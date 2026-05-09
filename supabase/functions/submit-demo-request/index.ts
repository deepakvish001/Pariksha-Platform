import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Lenient schema — accepts both legacy {org,useCase,candidates,proctoring,reporting,utm{}}
// and new {organization, source, utm_source...} shapes from various lead-capture forms.
const Schema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    org: z.string().trim().max(160).optional().nullable(),
    organization: z.string().trim().max(160).optional().nullable(),
    useCase: z.string().max(40).optional().nullable(),
    candidates: z.string().max(40).optional().nullable(),
    proctoring: z.array(z.string().max(80)).max(20).optional().default([]),
    reporting: z.array(z.string().max(80)).max(20).optional().default([]),
    notes: z.string().max(2000).optional().nullable(),
    source: z.string().max(80).optional().nullable(),
    utm: z
      .object({
        source: z.string().max(120).optional().nullable(),
        medium: z.string().max(120).optional().nullable(),
        campaign: z.string().max(120).optional().nullable(),
        term: z.string().max(120).optional().nullable(),
        content: z.string().max(120).optional().nullable(),
      })
      .partial()
      .optional(),
    utm_source: z.string().max(120).optional().nullable(),
    utm_medium: z.string().max(120).optional().nullable(),
    utm_campaign: z.string().max(120).optional().nullable(),
    utm_term: z.string().max(120).optional().nullable(),
    utm_content: z.string().max(120).optional().nullable(),
    referrer: z.string().max(500).optional().nullable(),
    landingPage: z.string().max(500).optional().nullable(),
  })
  .passthrough();

const lastByEmail = new Map<string, number>();
const WINDOW_MS = 30_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = parsed.data;
    const orgValue = (data.org ?? data.organization ?? "—").toString();
    const useCase = (data.useCase ?? data.source ?? "demo").toString();
    const candidates = (data.candidates ?? "—").toString();

    const utm = {
      source: data.utm?.source ?? data.utm_source ?? null,
      medium: data.utm?.medium ?? data.utm_medium ?? null,
      campaign: data.utm?.campaign ?? data.utm_campaign ?? null,
      term: data.utm?.term ?? data.utm_term ?? null,
      content: data.utm?.content ?? data.utm_content ?? data.source ?? null,
    };

    const emailKey = data.email.toLowerCase();
    const now = Date.now();
    const last = lastByEmail.get(emailKey) ?? 0;
    if (now - last < WINDOW_MS) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment and retry." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    lastByEmail.set(emailKey, now);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const userAgent = req.headers.get("user-agent") ?? null;

    const { data: inserted, error } = await supabase
      .from("demo_requests")
      .insert({
        name: data.name,
        email: data.email,
        org: orgValue,
        use_case: useCase,
        candidates,
        proctoring: data.proctoring ?? [],
        reporting: data.reporting ?? [],
        notes: data.notes ?? null,
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_term: utm.term,
        utm_content: utm.content,
        referrer: data.referrer ?? null,
        landing_page: data.landingPage ?? null,
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[submit-demo-request] insert failed", error);
      return new Response(JSON.stringify({ error: "Failed to save request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const teamEmail = Deno.env.get("DEMO_REQUEST_TEAM_EMAIL") ?? "founders@parikshaa.com";
    const fromEmail = Deno.env.get("DEMO_REQUEST_FROM_EMAIL") ?? "Parikshaa <onboarding@resend.dev>";
    const calendarUrl =
      Deno.env.get("DEMO_CALENDAR_URL") ?? "https://cal.com/parikshaa/demo";

    if (resendKey) {
      // 1) Internal notification to the sales team
      try {
        const html = `
          <h2>New demo request</h2>
          <p><strong>${escapeHtml(data.name)}</strong> &lt;${escapeHtml(data.email)}&gt; from <strong>${escapeHtml(orgValue)}</strong></p>
          <ul>
            <li><strong>Use case:</strong> ${escapeHtml(useCase)}</li>
            <li><strong>Volume:</strong> ${escapeHtml(candidates)}</li>
            <li><strong>Proctoring:</strong> ${(data.proctoring ?? []).map(escapeHtml).join(", ") || "—"}</li>
            <li><strong>Reporting:</strong> ${(data.reporting ?? []).map(escapeHtml).join(", ") || "—"}</li>
          </ul>
          ${data.notes ? `<p><strong>Notes:</strong><br/>${escapeHtml(data.notes).replace(/\n/g, "<br/>")}</p>` : ""}
          <hr/>
          <p style="color:#666;font-size:12px;">
            UTM: ${escapeHtml(utm.source ?? "—")} / ${escapeHtml(utm.medium ?? "—")} / ${escapeHtml(utm.campaign ?? "—")}<br/>
            Referrer: ${escapeHtml(data.referrer ?? "—")}<br/>
            Landing: ${escapeHtml(data.landingPage ?? "—")}<br/>
            Lead ID: ${inserted.id}
          </p>
        `;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [teamEmail],
            reply_to: data.email,
            subject: `[Demo] ${orgValue} — ${useCase} (${candidates})`,
            html,
          }),
        });
      } catch (mailErr) {
        console.error("[submit-demo-request] team email failed", mailErr);
      }

      // 2) Automated follow-up to the requester with calendar link + next steps
      try {
        const firstName = (data.name.split(" ")[0] ?? "there").trim() || "there";
        const leadHtml = `
          <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
            <h1 style="font-size:22px;margin:0 0 8px;">Thanks, ${escapeHtml(firstName)} — your demo is reserved 🎯</h1>
            <p style="color:#475569;line-height:1.55;margin:0 0 18px;">
              We received your request from <strong>${escapeHtml(orgValue)}</strong> and a Parikshaa specialist will reach out within
              <strong>1 business day</strong>. To make it faster, pick a 15-minute slot that works for you:
            </p>
            <p style="margin:0 0 24px;">
              <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#f59e0b;color:#0b0b0b;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;">
                Book your 15-min slot →
              </a>
            </p>
            <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:24px 0 8px;">What happens next</h3>
            <ol style="color:#0f172a;line-height:1.6;padding-left:20px;margin:0 0 18px;">
              <li>You'll receive a calendar invite once you book a slot.</li>
              <li>We'll tailor the demo to your ${escapeHtml(useCase)} use case (${escapeHtml(candidates)} candidates).</li>
              <li>You'll leave with a free trial workspace + sample assessment.</li>
            </ol>
            <p style="color:#475569;line-height:1.55;margin:18px 0 0;">
              In the meantime, you can <a href="https://parikshaa.org/b2b/onboarding" style="color:#b45309;">start a free workspace</a> — no card needed.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 14px;"/>
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              Reply directly to this email to reach our team.<br/>
              Parikshaa · Hire & place developers 10× faster
            </p>
          </div>
        `;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [data.email],
            reply_to: teamEmail,
            subject: `Your Parikshaa demo — book your 15-min slot`,
            html: leadHtml,
          }),
        });

        // Best-effort tracking of the follow-up send
        await supabase.from("lead_events").insert({
          event_type: "demo_followup_email_sent",
          page: data.landingPage ?? null,
          referrer: data.referrer ?? null,
          utm_source: utm.source,
          utm_medium: utm.medium,
          utm_campaign: utm.campaign,
          utm_term: utm.term,
          utm_content: utm.content,
          user_agent: userAgent,
          session_id: null,
          metadata: { lead_id: inserted.id, email: data.email, calendar_url: calendarUrl },
        });
      } catch (followupErr) {
        console.error("[submit-demo-request] followup email failed", followupErr);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, id: inserted.id, calendar_url: calendarUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[submit-demo-request] error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
