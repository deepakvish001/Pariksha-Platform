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
    .select("id, title, duration_min, org_id, organizations:org_id(id, name, logo_url, brand_color)")
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
  const subject = `${orgName} invited you to "${assessment.title}"`;
  const results: { email: string; ok: boolean; error?: string }[] = [];
  const duration = (assessment as any).duration_min as number | null;
  const logoUrl = (assessment as any).organizations?.logo_url as string | null;
  const rawBrand = ((assessment as any).organizations?.brand_color as string | null)?.trim() || "";
  const brand = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawBrand) ? rawBrand : "#0f172a";
  const brandDark = darken(brand, 0.18);
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("") || "P";

  for (const inv of invites) {
    const link = `${APP_URL.replace(/\/+$/, "")}/assessments/join/${inv.token}`;
    const display = inv.name?.trim() || "there";
    const preheader = `${orgName} invited you to take ${assessment.title}. Open this email to start.`;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
    <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.04),0 8px 24px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,${brand} 0%,${brandDark} 100%);padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                        <td style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.22);border-radius:10px;width:44px;height:44px;text-align:center;vertical-align:middle;color:#ffffff;font-weight:700;font-size:15px;letter-spacing:0.5px;padding:0;">
                          ${logoUrl ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(orgName)} logo" width="36" height="36" style="display:block;margin:4px auto;border-radius:6px;object-fit:contain;background:#ffffff;" />` : escapeHtml(initials)}
                        </td>
                        <td style="padding-left:12px;color:#ffffff;font-size:15px;font-weight:600;vertical-align:middle;">${escapeHtml(orgName)}</td>
                      </tr></table>
                    </td>
                    <td align="right" style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Assessment Invite</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">
                  Hi ${escapeHtml(display)}, you're invited.
                </h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                  <strong style="color:#0f172a;">${escapeHtml(orgName)}</strong> has invited you to complete an online assessment. When you're ready, click the button below to begin.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 28px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:6px;">Assessment</div>
                      <div style="font-size:17px;font-weight:600;color:#0f172a;line-height:1.35;">${escapeHtml(assessment.title)}</div>
                      ${duration ? `<div style="margin-top:10px;font-size:13px;color:#475569;">⏱ Duration: <strong style="color:#0f172a;">${duration} minutes</strong></div>` : ""}
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="border-radius:10px;background:${brand};">
                      <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                        Start assessment →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Or paste this link into your browser:</p>
                <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                  <a href="${link}" style="color:${brand};text-decoration:none;">${link}</a>
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #e2e8f0;margin:0 0 8px;">
                  <tr><td style="padding-top:20px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;">Before you begin</p>
                    <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#475569;line-height:1.65;">
                      <li>Use a laptop or desktop with a stable internet connection.</li>
                      <li>Allow camera &amp; microphone access if prompted.</li>
                      <li>Find a quiet, well-lit space — you won't be able to pause once started.</li>
                    </ul>
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;">
                <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                  This invite is personal to <strong style="color:#64748b;">${escapeHtml(inv.email)}</strong>. Please don't share or forward this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;">Sent by ${escapeHtml(orgName)} via Parikshaa · Secure online assessments</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
    const text = `Hi ${display},\n\n${orgName} has invited you to take the assessment "${assessment.title}".${duration ? `\nDuration: ${duration} minutes.` : ""}\n\nStart here: ${link}\n\nThis invite is personal to ${inv.email}. Please don't share it.`;
    const attemptAt = new Date().toISOString();
    try {
      const r = await resend.emails.send({
        from: FROM,
        to: [inv.email],
        subject,
        html,
        text,
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
