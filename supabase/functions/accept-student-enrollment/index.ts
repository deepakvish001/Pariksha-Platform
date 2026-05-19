// Accept a pending student enrollment: links the signed-in user to the org_students row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  token: z.string().min(8).max(128).optional(),
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
    if (!user?.email) return jsonRes({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return jsonRes({ error: parsed.error.flatten().fieldErrors }, 400);
    const { token } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE);

    let studentRow: any = null;
    if (token) {
      const { data: invite } = await admin
        .from("org_student_invites")
        .select("id, org_id, student_id, email, expires_at, revoked, accepted_at")
        .eq("token", token)
        .maybeSingle();
      if (!invite) return jsonRes({ error: "Invalid invite token" }, 404);
      if (invite.revoked) return jsonRes({ error: "Invite revoked" }, 410);
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        return jsonRes({ error: "Invite expired" }, 410);
      }
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        return jsonRes({ error: "Invite email does not match signed-in user" }, 403);
      }
      const { data: s } = await admin
        .from("org_students")
        .select("id, org_id, status, user_id")
        .eq("id", invite.student_id)
        .maybeSingle();
      studentRow = s;
      await admin
        .from("org_student_invites")
        .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq("id", invite.id);
    } else {
      // No token: find any pending enrollment by email
      const { data: s } = await admin
        .from("org_students")
        .select("id, org_id, status, user_id")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      studentRow = s;
    }

    if (!studentRow) return jsonRes({ error: "No enrollment found" }, 404);

    await admin
      .from("org_students")
      .update({
        user_id: user.id,
        status: studentRow.status === "invited" ? "active" : studentRow.status,
        activated_at: new Date().toISOString(),
      })
      .eq("id", studentRow.id);

    const { data: org } = await admin
      .from("organizations")
      .select("slug, type, name")
      .eq("id", studentRow.org_id)
      .maybeSingle();

    return jsonRes({ ok: true, org_id: studentRow.org_id, slug: org?.slug, org_name: org?.name });
  } catch (e) {
    return jsonRes({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
