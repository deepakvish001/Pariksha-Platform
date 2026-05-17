// Sends assessment invitation emails via Resend.
// Authenticates via the caller's JWT, verifies they are an org member
// for the assessment's org, then emails the join link to each invite.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FROM = Deno.env.get("ASSESSMENT_INVITE_FROM") ?? "Parikshaa <noreply@parikshaa.org>";
const APP_URL = Deno.env.get("ASSESSMENT_INVITE_APP_URL") ?? "https://parikshaa.org";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(500, { error: "resend_not_configured" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Identify the caller from their JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "no_auth" });
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "invalid_auth" });
  const callerId = userData.user.id;

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const assessmentId: string | undefined = body?.assessment_id;
  const inviteIds: string[] | undefined = Array.isArray(body?.invite_ids) ? body.invite_ids : undefined;
  const onlyPending: boolean = !!body?.only_pending;
  if (!assessmentId) return json(400, { error: "missing_assessment_id" });

  const admin = createClient(supabaseUrl, serviceKey);

  // Load assessment + org
  const { data: assessment, error: aErr } = await admin
    .from("assessments")
    .select("id, title, org_id, organizations:org_id(id, name)")
    .eq("id", assessmentId)
    .maybeSingle();
  if (aErr || !assessment) return json(404, { error: "assessment_not_found" });

  // Authorize: caller must be a member of the org (or owner)
  const orgId = (assessment as any).org_id as string;
  const orgName = (assessment as any).organizations?.name ?? "Your organization";
  const { data: member } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", callerId)
    .maybeSingle();
  const { data: org } = await admin
    .from("organizations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();
  if (!member && org?.owner_id !== callerId) return json(403, { error: "forbidden" });

  // Load invites
  let q = admin
    .from("assessment_invites")
    .select("id, email, name, token, status, send_count")
    .eq("assessment_id", assessmentId);
  if (inviteIds && inviteIds.length) q = q.in("id", inviteIds);
  if (onlyPending) q = q.eq("status", "pending");
  const { data: invites, error: iErr } = await q;
  if (iErr) return json(500, { error: "invite_query_failed", details: iErr.message });
  if (!invites?.length) return json(200, { sent: 0, failed: 0, results: [] });

  const resend = new Resend(resendKey);
  const subject = `You're invited: ${assessment.title}`;
  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const inv of invites) {
    const link = `${APP_URL.replace(/\/+$/, "")}/assessments/join/${inv.token}`;
    const display = inv.name?.trim() || "there";
    const html = `
      <div style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;color:#0a0a0a;">
        <div style="max-width:560px;margin:0 auto;">
          <h1 style="font-size:22px;margin:0 0 16px;">Hi ${escapeHtml(display)},</h1>
          <p style="font-size:15px;line-height:1.5;margin:0 0 16px;">
            <strong>${escapeHtml(orgName)}</strong> has invited you to take the assessment
            <strong>${escapeHtml(assessment.title)}</strong>.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${link}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
              Start assessment
            </a>
          </p>
          <p style="font-size:13px;color:#55575d;line-height:1.5;margin:0 0 8px;">
            Or open this link in your browser:
          </p>
          <p style="font-size:12px;word-break:break-all;color:#3b6fa0;margin:0 0 24px;">${link}</p>
          <p style="font-size:12px;color:#999;margin:0;">This invite is personal to ${escapeHtml(inv.email)}. Please don't share it.</p>
        </div>
      </div>`;
    const attemptAt = new Date().toISOString();
    try {
      const r = await resend.emails.send({
        from: FROM,
        to: [inv.email],
        subject,
        html,
      });
      if ((r as any)?.error) {
        const msg = String((r as any).error?.message ?? (r as any).error);
        await admin
          .from("assessment_invites")
          .update({ last_send_attempt_at: attemptAt, last_send_error: msg })
          .eq("id", inv.id);
        results.push({ email: inv.email, ok: false, error: msg });
      } else {
        await admin
          .from("assessment_invites")
          .update({
            last_send_attempt_at: attemptAt,
            last_sent_at: attemptAt,
            last_send_error: null,
            send_count: ((inv as any).send_count ?? 0) + 1,
          })
          .eq("id", inv.id);
        results.push({ email: inv.email, ok: true });
      }
    } catch (e) {
      const msg = (e as Error).message;
      await admin
        .from("assessment_invites")
        .update({ last_send_attempt_at: attemptAt, last_send_error: msg })
        .eq("id", inv.id);
      results.push({ email: inv.email, ok: false, error: msg });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return json(200, { sent, failed: results.length - sent, results });
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
