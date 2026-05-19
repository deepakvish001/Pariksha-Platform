// Bulk-enroll students into a college organization + retry invite-email delivery.
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
  students: z.array(StudentSchema).min(1).max(2000).optional(),
  send_invite_email: z.boolean().optional().default(true),
  // Retry-only mode: skip upserts and re-attempt email delivery for prior
  // invites that failed (or were never sent). Optionally narrow to specific emails.
  retry_failed: z.boolean().optional().default(false),
  retry_emails: z.array(z.string().email()).max(2000).optional(),
  max_attempts: z.number().int().min(1).max(8).optional().default(3),
});

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Try enqueueing one invite email with exponential backoff.
// Returns { ok: true } or { ok: false, error: string }.
async function sendInviteWithRetry(
  admin: any,
  invite: { id: string; email: string; token: string },
  ctx: { orgName: string; origin: string },
  maxAttempts: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const join_url =
        `${ctx.origin}/join/student?token=${encodeURIComponent(invite.token)}` +
        `&email=${encodeURIComponent(invite.email)}`;
      const { error } = await admin.rpc("enqueue_email", {
        p_queue: "transactional_emails",
        p_payload: {
          to: invite.email,
          subject: `You've been enrolled at ${ctx.orgName}`,
          template: "student-enrollment",
          data: { org_name: ctx.orgName, join_url },
        },
      });
      if (!error) {
        await admin
          .from("org_student_invites")
          .update({
            last_sent_at: new Date().toISOString(),
            send_count: ((invite as any).send_count ?? 0) + 1,
            last_send_error: null,
            last_send_attempt_at: new Date().toISOString(),
          })
          .eq("id", invite.id);
        return { ok: true };
      }
      lastErr = error.message ?? String(error);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
    if (attempt < maxAttempts) {
      // 250ms, 750ms, 2000ms, 4000ms…
      await sleep(Math.min(250 * Math.pow(3, attempt - 1), 4000));
    }
  }
  await admin
    .from("org_student_invites")
    .update({
      last_send_error: lastErr.slice(0, 500),
      last_send_attempt_at: new Date().toISOString(),
    })
    .eq("id", invite.id);
  return { ok: false, error: lastErr };
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
    const { org_id, students, retry_failed, retry_emails, max_attempts, send_invite_email } = parsed.data;

    if (!retry_failed && (!students || students.length === 0)) {
      return jsonRes({ error: "students[] is required unless retry_failed=true" }, 400);
    }

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

    const { data: org } = await admin
      .from("organizations")
      .select("name, slug, type")
      .eq("id", org_id)
      .maybeSingle();
    const orgName = org?.name ?? "your college";
    const origin = req.headers.get("origin") ?? "";

    // ---------- Retry-only branch ----------
    if (retry_failed) {
      let q = admin
        .from("org_student_invites")
        .select("id, email, token, send_count")
        .eq("org_id", org_id)
        .eq("revoked", false)
        .is("accepted_at", null);
      // Failed OR never sent
      q = q.or("last_send_error.not.is.null,last_sent_at.is.null");
      if (retry_emails && retry_emails.length) {
        q = q.in("email", retry_emails.map((e) => e.toLowerCase()));
      }
      const { data: invites, error: listErr } = await q.limit(2000);
      if (listErr) return jsonRes({ error: listErr.message }, 500);

      const results = { attempted: 0, sent: 0, failed: [] as { email: string; error: string }[] };
      for (const inv of invites ?? []) {
        results.attempted++;
        const r = await sendInviteWithRetry(admin, inv as any, { orgName, origin }, max_attempts);
        if (r.ok) results.sent++;
        else results.failed.push({ email: (inv as any).email, error: r.error });
      }
      return jsonRes({ ok: true, mode: "retry", email_results: results });
    }

    // ---------- Enrollment branch ----------
    // Normalize + dedupe (case-insensitive email) within payload
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const s of students!) {
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

    let inserted: { id: string; email: string }[] = [];
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

    // Create invites for newly inserted rows and capture tokens for emailing
    let freshInvites: { id: string; email: string; token: string; send_count: number }[] = [];
    if (inserted.length) {
      const inviteRows = inserted.map((r) => ({
        org_id,
        student_id: r.id,
        email: r.email,
        invited_by: user.id,
      }));
      const { data: created, error: invErr } = await admin
        .from("org_student_invites")
        .insert(inviteRows)
        .select("id, email, token, send_count");
      if (invErr) return jsonRes({ error: invErr.message }, 500);
      freshInvites = (created ?? []) as any;
    }

    // Send invite emails with per-recipient retry + backoff.
    const email_results = { attempted: 0, sent: 0, failed: [] as { email: string; error: string }[] };
    if (send_invite_email && freshInvites.length) {
      for (const inv of freshInvites) {
        email_results.attempted++;
        const r = await sendInviteWithRetry(admin, inv, { orgName, origin }, max_attempts);
        if (r.ok) email_results.sent++;
        else email_results.failed.push({ email: inv.email, error: r.error });
      }
    }

    return jsonRes({
      ok: true,
      mode: "enroll",
      inserted: inserted.length,
      updated: toUpdate.length,
      total: rows.length,
      email_results,
    });
  } catch (e) {
    return jsonRes({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
