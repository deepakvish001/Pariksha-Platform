// Accept a pending student enrollment: links the signed-in user to the org_students row.
// Every attempt (success or failure) is recorded in `org_student_invite_audit`
// so enrollment issues can be traced end-to-end. Admins can read the audit log.
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

type AuditInput = {
  invite_id?: string | null;
  org_id?: string | null;
  student_id?: string | null;
  user_id?: string | null;
  email?: string | null;
  token?: string | null;
  result: string;
  detail?: string | null;
  ip?: string | null;
  user_agent?: string | null;
};

async function writeAudit(admin: ReturnType<typeof createClient>, a: AuditInput) {
  try {
    await admin.from("org_student_invite_audit").insert({
      invite_id: a.invite_id ?? null,
      org_id: a.org_id ?? null,
      student_id: a.student_id ?? null,
      user_id: a.user_id ?? null,
      email: a.email ? a.email.toLowerCase() : null,
      token_prefix: a.token ? a.token.slice(0, 8) : null,
      result: a.result,
      detail: a.detail ?? null,
      ip: a.ip ?? null,
      user_agent: a.user_agent ?? null,
    });
  } catch (err) {
    // Never let audit failures break the user flow.
    console.error("[accept-student-enrollment] audit log failed:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  let tokenForAudit: string | null = null;

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      await writeAudit(admin, { result: "unauthorized_no_bearer", ip, user_agent: userAgent });
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user?.email) {
      await writeAudit(admin, { result: "unauthorized_no_user", ip, user_agent: userAgent });
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      await writeAudit(admin, {
        user_id: user.id,
        email: user.email,
        result: "bad_request",
        detail: JSON.stringify(parsed.error.flatten().fieldErrors),
        ip,
        user_agent: userAgent,
      });
      return jsonRes({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { token } = parsed.data;
    tokenForAudit = token ?? null;

    let studentRow: any = null;
    let inviteId: string | null = null;
    if (token) {
      const { data: invite } = await admin
        .from("org_student_invites")
        .select("id, org_id, student_id, email, expires_at, revoked, accepted_at")
        .eq("token", token)
        .maybeSingle();
      if (!invite) {
        await writeAudit(admin, {
          user_id: user.id,
          email: user.email,
          token,
          result: "invalid_token",
          ip,
          user_agent: userAgent,
        });
        return jsonRes({ error: "Invalid invite token" }, 404);
      }
      inviteId = invite.id;
      if (invite.revoked) {
        await writeAudit(admin, {
          invite_id: invite.id,
          org_id: invite.org_id,
          student_id: invite.student_id,
          user_id: user.id,
          email: user.email,
          token,
          result: "revoked",
          ip,
          user_agent: userAgent,
        });
        return jsonRes({ error: "Invite revoked" }, 410);
      }
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        await writeAudit(admin, {
          invite_id: invite.id,
          org_id: invite.org_id,
          student_id: invite.student_id,
          user_id: user.id,
          email: user.email,
          token,
          result: "expired",
          detail: `expires_at=${invite.expires_at}`,
          ip,
          user_agent: userAgent,
        });
        return jsonRes({ error: "Invite expired" }, 410);
      }
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        await writeAudit(admin, {
          invite_id: invite.id,
          org_id: invite.org_id,
          student_id: invite.student_id,
          user_id: user.id,
          email: user.email,
          token,
          result: "email_mismatch",
          detail: `invite_email=${invite.email}`,
          ip,
          user_agent: userAgent,
        });
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

    if (!studentRow) {
      await writeAudit(admin, {
        invite_id: inviteId,
        user_id: user.id,
        email: user.email,
        token: tokenForAudit,
        result: "no_enrollment",
        ip,
        user_agent: userAgent,
      });
      return jsonRes({ error: "No enrollment found" }, 404);
    }

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

    await writeAudit(admin, {
      invite_id: inviteId,
      org_id: studentRow.org_id,
      student_id: studentRow.id,
      user_id: user.id,
      email: user.email,
      token: tokenForAudit,
      result: "success",
      detail: `prev_status=${studentRow.status}`,
      ip,
      user_agent: userAgent,
    });

    return jsonRes({ ok: true, org_id: studentRow.org_id, slug: org?.slug, org_name: org?.name });
  } catch (e) {
    const detail = String(e instanceof Error ? e.message : e);
    await writeAudit(admin, {
      token: tokenForAudit,
      result: "server_error",
      detail,
      ip,
      user_agent: userAgent,
    });
    return jsonRes({ error: detail }, 500);
  }
});
