// Search Console proxy via the connector gateway.
// POST body: {
//   report: "summary" | "queries" | "pages" | "countries" | "devices" | "timeseries",
//   startDate?: string, endDate?: string, days?: number,
//   siteUrl?: string (must be allowlisted)
// }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console/webmasters/v3";
const DEFAULT_SITE = "https://www.parikshaa.org/";
const SITE_ALLOWLIST = (Deno.env.get("GSC_SITE_URLS") || DEFAULT_SITE)
  .split(",").map((s) => s.trim()).filter(Boolean);

const CACHE_TTL_SECONDS = 60 * 60;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildBody(report: string, startDate: string, endDate: string) {
  switch (report) {
    case "summary": return { startDate, endDate, dimensions: [] };
    case "queries": return { startDate, endDate, dimensions: ["query"], rowLimit: 25 };
    case "pages": return { startDate, endDate, dimensions: ["page"], rowLimit: 25 };
    case "countries": return { startDate, endDate, dimensions: ["country"], rowLimit: 10 };
    case "devices": return { startDate, endDate, dimensions: ["device"] };
    case "timeseries": return { startDate, endDate, dimensions: ["date"], rowLimit: 1000 };
    default: throw new Error(`Unknown report: ${report}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GSC_API_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleOk } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!roleOk) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const report = String(body.report ?? "summary");
    const siteUrl = String(body.siteUrl || SITE_ALLOWLIST[0]);
    if (!SITE_ALLOWLIST.includes(siteUrl)) {
      return new Response(JSON.stringify({ error: "Site not allowed" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let startDate: string;
    let endDate: string;
    if (body.startDate && body.endDate && ISO.test(body.startDate) && ISO.test(body.endDate)) {
      startDate = body.startDate; endDate = body.endDate;
    } else {
      const safeDays = Math.max(3, Math.min(365, Number(body.days) || 28));
      startDate = isoDaysAgo(safeDays);
      endDate = isoDaysAgo(2); // ~2 day lag
    }

    const cacheKey = `gsc:${siteUrl}:${report}:${startDate}:${endDate}`;
    const { data: cached } = await admin
      .from("analytics_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    await admin.from("admin_audit_log").insert({
      actor_id: userData.user.id,
      action: "view_analytics",
      entity_type: "gsc",
      entity_slug: siteUrl,
      diff: { report, startDate, endDate, cached: !!cached },
    });

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(JSON.stringify({ cached: true, ...cached.payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reqBody = buildBody(report, startDate, endDate);
    const url = `${GATEWAY}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const gsc = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GSC_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });
    const json = await gsc.json();
    if (!gsc.ok) throw new Error(`GSC API failed [${gsc.status}]: ${JSON.stringify(json)}`);

    const payload = { report, siteUrl, startDate, endDate, data: json };
    await admin.from("analytics_cache").upsert({
      cache_key: cacheKey,
      payload,
      expires_at: new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString(),
    });

    return new Response(JSON.stringify({ cached: false, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("gsc-report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
