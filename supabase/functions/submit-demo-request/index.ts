import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const Schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  org: z.string().trim().min(1).max(160),
  useCase: z.string().min(1).max(40),
  candidates: z.string().min(1).max(40),
  proctoring: z.array(z.string().max(80)).max(20).default([]),
  reporting: z.array(z.string().max(80)).max(20).default([]),
  notes: z.string().max(2000).optional().nullable(),
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
  referrer: z.string().max(500).optional().nullable(),
  landingPage: z.string().max(500).optional().nullable(),
});

// In-memory rate limit (per cold-start). Best-effort.
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
        org: data.org,
        use_case: data.useCase,
        candidates: data.candidates,
        proctoring: data.proctoring,
        reporting: data.reporting,
        notes: data.notes ?? null,
        utm_source: data.utm?.source ?? null,
        utm_medium: data.utm?.medium ?? null,
        utm_campaign: data.utm?.campaign ?? null,
        utm_term: data.utm?.term ?? null,
        utm_content: data.utm?.content ?? null,
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

    // Best-effort email to the sales team via Resend (if configured). Failure does not block success.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const teamEmail = Deno.env.get("DEMO_REQUEST_TEAM_EMAIL") ?? "founders@parikshaa.com";
    const fromEmail = Deno.env.get("DEMO_REQUEST_FROM_EMAIL") ?? "Parikshaa Leads <onboarding@resend.dev>";
    if (resendKey) {
      try {
        const html = `
          <h2>New demo request</h2>
          <p><strong>${escapeHtml(data.name)}</strong> &lt;${escapeHtml(data.email)}&gt; from <strong>${escapeHtml(data.org)}</strong></p>
          <ul>
            <li><strong>Use case:</strong> ${escapeHtml(data.useCase)}</li>
            <li><strong>Volume:</strong> ${escapeHtml(data.candidates)}</li>
            <li><strong>Proctoring:</strong> ${data.proctoring.map(escapeHtml).join(", ") || "—"}</li>
            <li><strong>Reporting:</strong> ${data.reporting.map(escapeHtml).join(", ") || "—"}</li>
          </ul>
          ${data.notes ? `<p><strong>Notes:</strong><br/>${escapeHtml(data.notes).replace(/\n/g, "<br/>")}</p>` : ""}
          <hr/>
          <p style="color:#666;font-size:12px;">
            UTM: ${escapeHtml(data.utm?.source ?? "—")} / ${escapeHtml(data.utm?.medium ?? "—")} / ${escapeHtml(data.utm?.campaign ?? "—")}<br/>
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
            subject: `[Demo] ${data.org} — ${data.useCase} (${data.candidates})`,
            html,
          }),
        });
      } catch (mailErr) {
        console.error("[submit-demo-request] email failed", mailErr);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, id: inserted.id }),
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
