// Sends assessment invitation emails via Resend.
// Modes:
//   - default: sends to actual invites (writes last_sent_at, send_count, etc.)
//   - { preview: true }: returns rendered { html, text, subject } for a sample
//     recipient — no email is sent and nothing is written to the database.
//   - { test_email: "x@y.com" }: sends a single sample email to that address
//     using the assessment's branding — no database writes, no invite needed.

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
  const callerEmail = userData.user.email ?? "preview@example.com";

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const assessmentId: string | undefined = body?.assessment_id;
  const orgIdParam: string | undefined = typeof body?.org_id === "string" ? body.org_id : undefined;
  const inviteIds: string[] | undefined = Array.isArray(body?.invite_ids) ? body.invite_ids : undefined;
  const onlyPending: boolean = !!body?.only_pending;
  const previewOnly: boolean = !!body?.preview;
  const testEmail: string | undefined = typeof body?.test_email === "string" ? body.test_email.trim() : undefined;

  // Org-only preview: lets Settings render a sample invite using just the org's
  // branding (no assessment required). Returns rendered HTML; no DB writes.
  if (previewOnly && !assessmentId && orgIdParam) {
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: org, error: oErr } = await admin
      .from("organizations")
      .select("id, name, logo_url, brand_color, owner_id, updated_at")
      .eq("id", orgIdParam)
      .maybeSingle();
    if (oErr || !org) return json(404, { error: "org_not_found" });

    const { data: member } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgIdParam)
      .eq("user_id", callerId)
      .maybeSingle();
    if (!member && org.owner_id !== callerId) return json(403, { error: "forbidden" });

    const rawLogo = (org.logo_url as string | null) ?? null;
    const logoVersion = org.updated_at
      ? new Date(org.updated_at as string).getTime().toString()
      : Date.now().toString();
    const logoUrl = rawLogo
      ? `${rawLogo}${rawLogo.includes("?") ? "&" : "?"}v=${logoVersion}`
      : null;

    const rendered = renderInviteEmail({
      orgName: (org.name as string) ?? "Your organization",
      logoUrl,
      brandColor: (org.brand_color as string | null) ?? null,
      title: "Sample assessment — Frontend Engineer",
      durationMin: 60,
      recipientName: "Sample Candidate",
      recipientEmail: "candidate@example.com",
      joinUrl: `${APP_URL.replace(/\/+$/, "")}/assessments/join/PREVIEW-TOKEN`,
    });
    return json(200, { preview: true, ...rendered });
  }

  if (!assessmentId) return json(400, { error: "missing_assessment_id" });

  const admin = createClient(supabaseUrl, serviceKey);

  // Load assessment (no embed — we re-fetch org separately to always get latest branding)
  const { data: assessment, error: aErr } = await admin
    .from("assessments")
    .select("id, title, duration_min, org_id, brand_color")
    .eq("id", assessmentId)
    .maybeSingle();
  if (aErr || !assessment) return json(404, { error: "assessment_not_found" });

  const orgId = (assessment as any).org_id as string;

  // Always re-read latest org branding at send time (no caching / no stale joins)
  const { data: org, error: oErr } = await admin
    .from("organizations")
    .select("id, name, logo_url, brand_color, owner_id, updated_at")
    .eq("id", orgId)
    .maybeSingle();
  if (oErr || !org) return json(404, { error: "org_not_found" });

  // Authorize: caller must be a member of the org (or owner)
  const { data: member } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", callerId)
    .maybeSingle();
  if (!member && org.owner_id !== callerId) return json(403, { error: "forbidden" });

  // Cache-bust the logo so email clients don't serve a stale image after the
  // org updates its logo. Uses org.updated_at as the version fingerprint.
  const rawLogo = (org.logo_url as string | null) ?? null;
  const logoVersion = org.updated_at
    ? new Date(org.updated_at as string).getTime().toString()
    : Date.now().toString();
  const logoUrl = rawLogo
    ? `${rawLogo}${rawLogo.includes("?") ? "&" : "?"}v=${logoVersion}`
    : null;

  const branding = {
    orgName: (org.name as string) ?? "Your organization",
    logoUrl,
    // Per-assessment override wins; fall back to the org default.
    brandColor: ((assessment as any).brand_color as string | null) ?? ((org.brand_color as string | null) ?? null),
    title: assessment.title as string,
    durationMin: (assessment as any).duration_min as number | null,
  };

  // ---- Preview mode: render and return (no send, no DB) ----
  if (previewOnly) {
    const rendered = renderInviteEmail({
      ...branding,
      recipientName: "Sample Candidate",
      recipientEmail: "candidate@example.com",
      joinUrl: `${APP_URL.replace(/\/+$/, "")}/assessments/join/PREVIEW-TOKEN`,
    });
    return json(200, { preview: true, ...rendered });
  }

  // ---- Test send mode: send one branded sample to a chosen address ----
  if (testEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return json(400, { error: "invalid_test_email" });
    }
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json(500, { error: "resend_not_configured" });
    const resend = new Resend(resendKey);
    const rendered = renderInviteEmail({
      ...branding,
      recipientName: "Sample Candidate",
      recipientEmail: testEmail,
      joinUrl: `${APP_URL.replace(/\/+$/, "")}/assessments/join/PREVIEW-TOKEN`,
      testBanner: true,
    });
    try {
      const r = await resend.emails.send({
        from: FROM,
        to: [testEmail],
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
        text: rendered.text,
      });
      if ((r as any)?.error) {
        return json(200, { test: true, ok: false, error: String((r as any).error?.message ?? (r as any).error) });
      }
      return json(200, { test: true, ok: true, sent_to: testEmail });
    } catch (e) {
      return json(200, { test: true, ok: false, error: (e as Error).message });
    }
  }

  // ---- Real send mode ----
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(500, { error: "resend_not_configured" });

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
  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const inv of invites) {
    const rendered = renderInviteEmail({
      ...branding,
      recipientName: inv.name,
      recipientEmail: inv.email,
      joinUrl: `${APP_URL.replace(/\/+$/, "")}/assessments/join/${inv.token}`,
    });
    const attemptAt = new Date().toISOString();
    try {
      const r = await resend.emails.send({
        from: FROM,
        to: [inv.email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
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

interface RenderArgs {
  orgName: string;
  logoUrl: string | null;
  brandColor: string | null;
  title: string;
  durationMin: number | null;
  recipientName: string | null;
  recipientEmail: string;
  joinUrl: string;
  testBanner?: boolean;
}

function renderInviteEmail(a: RenderArgs): { html: string; text: string; subject: string } {
  const rawBrand = (a.brandColor ?? "").trim();
  const brand = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawBrand) ? rawBrand : "#0f172a";
  const brandDark = darken(brand, 0.18);
  // Dark-mode brand: brighten dark brand colors so they stay readable on a dark
  // background (e.g. near-black brands would vanish). Light brands are left
  // mostly as-is. Also used as the CTA background in dark mode.
  const brandOnDark = ensureReadableOnDark(brand);
  const brandOnDarkSoft = lighten(brandOnDark, 0.15);
  const initials = a.orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "P";
  const display = a.recipientName?.trim() || "there";
  const subject = `${a.orgName} invited you to "${a.title}"`;
  const preheader = `${a.orgName} invited you to take ${a.title}. Open this email to start.`;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(subject)}</title>
    <style>
      /* Dark-mode friendly palette. The brand color (header gradient) is
         preserved across schemes; surrounding chrome adapts. */
      @media (prefers-color-scheme: dark) {
        body, .em-bg { background:#0b0f17 !important; }
        .em-card { background:#111827 !important; box-shadow:0 1px 2px rgba(0,0,0,0.4),0 8px 24px rgba(0,0,0,0.45) !important; }
        .em-text-strong { color:#f1f5f9 !important; }
        .em-text { color:#cbd5e1 !important; }
        .em-text-muted { color:#94a3b8 !important; }
        .em-text-faint { color:#64748b !important; }
        .em-panel { background:#1e293b !important; border-color:#334155 !important; }
        .em-panel-label { color:#94a3b8 !important; }
        .em-divider { border-top-color:#1f2937 !important; }
        .em-divider-soft { border-top-color:#1f2937 !important; }
        .em-link { color:${brandOnDark} !important; }
        .em-cta { background:${brandOnDark} !important; }
        .em-cta a { color:#0b0f17 !important; }
        .em-test-banner { background:#3f2d10 !important; border-color:#92660b !important; color:#fde68a !important; }
        .em-footer-note { color:#64748b !important; }
        .em-footer-note strong { color:#94a3b8 !important; }
      }
      /* Outlook ignores @media but otherwise honors light styles — no-op. */
    </style>
  </head>
  <body class="em-bg" style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
    <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="em-bg" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          ${a.testBanner ? `<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;margin-bottom:12px;"><tr><td class="em-test-banner" style="background:#fef3c7;border:1px solid #fcd34d;color:#78350f;font-size:12px;font-weight:600;padding:10px 16px;border-radius:8px;text-align:center;">⚠ This is a TEST email. The "Start assessment" link is a placeholder and will not work.</td></tr></table>` : ""}
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="em-card" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.04),0 8px 24px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,${brand} 0%,${brandDark} 100%);padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                        <td style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.22);border-radius:10px;width:44px;height:44px;text-align:center;vertical-align:middle;color:#ffffff;font-weight:700;font-size:15px;letter-spacing:0.5px;padding:0;">
                          ${a.logoUrl ? `<img src="${escapeAttr(a.logoUrl)}" alt="${escapeAttr(a.orgName)} logo" width="36" height="36" style="display:block;margin:4px auto;border-radius:6px;object-fit:contain;background:#ffffff;" />` : escapeHtml(initials)}
                        </td>
                        <td style="padding-left:12px;color:#ffffff;font-size:15px;font-weight:600;vertical-align:middle;">${escapeHtml(a.orgName)}</td>
                      </tr></table>
                    </td>
                    <td align="right" style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Assessment Invite</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 class="em-text-strong" style="margin:0 0 8px;font-size:24px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">
                  Hi ${escapeHtml(display)}, you're invited.
                </h1>
                <p class="em-text" style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                  <strong class="em-text-strong" style="color:#0f172a;">${escapeHtml(a.orgName)}</strong> has invited you to complete an online assessment. When you're ready, click the button below to begin.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="em-panel" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 28px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div class="em-panel-label" style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#64748b;font-weight:600;margin-bottom:6px;">Assessment</div>
                      <div class="em-text-strong" style="font-size:17px;font-weight:600;color:#0f172a;line-height:1.35;">${escapeHtml(a.title)}</div>
                      ${a.durationMin ? `<div class="em-text" style="margin-top:10px;font-size:13px;color:#475569;">⏱ Duration: <strong class="em-text-strong" style="color:#0f172a;">${a.durationMin} minutes</strong></div>` : ""}
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td class="em-cta" style="border-radius:10px;background:${brand};">
                      <a href="${a.joinUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                        Start assessment →
                      </a>
                    </td>
                  </tr>
                </table>
                <p class="em-text-faint" style="margin:0 0 6px;font-size:12px;color:#64748b;">Or paste this link into your browser:</p>
                <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                  <a href="${a.joinUrl}" class="em-link" style="color:${brand};text-decoration:none;">${a.joinUrl}</a>
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="em-divider" style="border-top:1px solid #e2e8f0;margin:0 0 8px;">
                  <tr><td style="padding-top:20px;">
                    <p class="em-text-strong" style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;">Before you begin</p>
                    <ul class="em-text" style="margin:0;padding:0 0 0 18px;font-size:13px;color:#475569;line-height:1.65;">
                      <li>Use a laptop or desktop with a stable internet connection.</li>
                      <li>Allow camera &amp; microphone access if prompted.</li>
                      <li>Find a quiet, well-lit space — you won't be able to pause once started.</li>
                    </ul>
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="em-divider-soft" style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;">
                <p class="em-footer-note" style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                  This invite is personal to <strong style="color:#64748b;">${escapeHtml(a.recipientEmail)}</strong>. Please don't share or forward this email.
                </p>
              </td>
            </tr>
          </table>
          <p class="em-footer-note" style="margin:18px 0 0;font-size:11px;color:#94a3b8;">Sent by ${escapeHtml(a.orgName)} via Parikshaa · Secure online assessments</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  // brandOnDarkSoft is reserved for future accents; reference it so the
  // compiler/linter doesn't flag it as unused.
  void brandOnDarkSoft;
  const text = `Hi ${display},\n\n${a.orgName} has invited you to take the assessment "${a.title}".${a.durationMin ? `\nDuration: ${a.durationMin} minutes.` : ""}\n\nStart here: ${a.joinUrl}\n\nThis invite is personal to ${a.recipientEmail}. Please don't share it.`;
  return { html, text, subject };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/\n/g, "");
}

function darken(hex: string, amount: number) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const f = Math.max(0, Math.min(1, 1 - amount));
  r = Math.round(r * f);
  g = Math.round(g * f);
  b = Math.round(b * f);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function lighten(hex: string, amount: number) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const f = Math.max(0, Math.min(1, amount));
  r = Math.round(r + (255 - r) * f);
  g = Math.round(g + (255 - g) * f);
  b = Math.round(b + (255 - b) * f);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Relative luminance per WCAG. Returns 0..1.
function luminance(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLin((num >> 16) & 0xff);
  const g = toLin((num >> 8) & 0xff);
  const b = toLin(num & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Brighten dark brands until they hit a luminance threshold readable on a
// dark (~#0b0f17) background. Light brands are returned unchanged.
function ensureReadableOnDark(hex: string, target = 0.35) {
  let out = hex;
  let lum = luminance(out);
  let i = 0;
  while (lum < target && i < 8) {
    out = lighten(out, 0.18);
    lum = luminance(out);
    i++;
  }
  return out;
}
