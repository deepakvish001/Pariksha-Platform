// Bulk-enroll students into a college organization.
// Authenticated org owner/admin/recruiter only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const StudentSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().trim().max(200).optional().nullable(),
  roll_number: z.string().trim().max(60).optional().nullable(),
  branch: z.string().trim().max(80).optional().nullable(),
  batch_year: z.number().int().min(1970).max(2100).optional().nullable(),
  section: z.string().trim().max(20).optional().nullable(),
});

const BodySchema = z.object({
  org_id: z.string().uuid(),
  students: z.array(StudentSchema).min(1).max(2000),
  send_invite_email: z.boolean().optional().default(true),
});

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return jsonRes({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return jsonRes({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonRes({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { org_id, students } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Permission check: caller must be owner/admin/recruiter of org
    const { data: member } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const role = member?.role;
    if (!role || !["owner", "admin", "recruiter"].includes(role)) {
      return jsonRes({ error: "Forbidden" }, 403);
    }

    // Normalize + dedupe (case-insensitive email) within payload
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const s of students) {
      const email = s.email.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      rows.push({
        org_id,
        email,
        full_name: s.full_name?.trim() || null,
        roll_number: s.roll_number?.trim() || null,
        branch: s.branch?.trim() || null,
        batch_year: s.batch_year ?? null,
        section: s.section?.trim() || null,
        enrolled_by: user.id,
        status: "invited",
      });
    }

    // Upsert by (org_id, lower(email)) — we have a unique expression index so use ON CONFLICT via merge
    // Strategy: select existing emails, then insert only new, update existing fields.
    const emails = rows.map((r) => r.email);
    const { data: existing } = await admin
      .from("org_students")
      .select("id, email")
      .eq("org_id", org_id)
      .in("email", emails);
    const existingMap = new Map<string, string>();
    (existing ?? []).forEach((e: any) => existingMap.set(e.email.toLowerCase(), e.id));

    const toInsert = rows.filter((r) => !existingMap.has(r.email));
    const toUpdate = rows.filter((r) => existingMap.has(r.email));

    let inserted: any[] = [];
    if (toInsert.length) {
      const { data, error } = await admin
        .from("org_students")
        .insert(toInsert)
        .select("id, email");
      if (error) return jsonRes({ error: error.message }, 500);
      inserted = data ?? [];
    }
    for (const r of toUpdate) {
      const id = existingMap.get(r.email)!;
      await admin
        .from("org_students")
        .update({
          full_name: r.full_name,
          roll_number: r.roll_number,
          branch: r.branch,
          batch_year: r.batch_year,
          section: r.section,
        })
        .eq("id", id);
    }

    // Create invites for newly inserted rows
    const inviteRows = inserted.map((r) => ({
      org_id,
      student_id: r.id,
      email: r.email,
      invited_by: user.id,
    }));
    if (inviteRows.length) {
      await admin.from("org_student_invites").insert(inviteRows);
    }

    // Best-effort: enqueue invite emails via transactional email pipeline if available.
    // Silent no-op when infra not provisioned, so the function succeeds either way.
    try {
      const { data: org } = await admin
        .from("organizations")
        .select("name, slug, type")
        .eq("id", org_id)
        .maybeSingle();
      const orgName = org?.name ?? "your college";
      const origin = req.headers.get("origin") ?? "";
      for (const r of inserted) {
        await admin.rpc("enqueue_email", {
          p_queue: "transactional_emails",
          p_payload: {
            to: r.email,
            subject: `You've been enrolled at ${orgName}`,
            template: "student-enrollment",
            data: {
              org_name: orgName,
              join_url: `${origin}/join/student?email=${encodeURIComponent(r.email)}`,
            },
          },
        }).catch(() => {});
      }
    } catch { /* ignore */ }

    return jsonRes({
      ok: true,
      inserted: inserted.length,
      updated: toUpdate.length,
      total: rows.length,
    });
  } catch (e) {
    return jsonRes({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
