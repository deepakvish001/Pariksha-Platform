// GA4 Data API proxy via Google service-account JWT.
// POST body: {
//   report: "summary" | "topPages" | "trafficSources" | "timeseries" | "countries" | "devices",
//   startDate?: string (YYYY-MM-DD), endDate?: string (YYYY-MM-DD),
//   days?: number (used if startDate/endDate not provided),
//   propertyId?: string (must be allowlisted)
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

const DEFAULT_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID");
// Optional: comma-separated allowlist of property ids the dashboard can query.
// Falls back to [DEFAULT_PROPERTY_ID] when unset.
const PROPERTY_ALLOWLIST = (Deno.env.get("GA4_PROPERTY_IDS") || DEFAULT_PROPERTY_ID || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const SA_EMAIL = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
const SA_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

const CACHE_TTL_SECONDS = 60 * 60;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ga4SetupError(message: string) {
  return jsonResponse({ error: message, setupRequired: true }, 200);
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() / 1000 + 60) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  };
  const enc = new TextEncoder();
  const unsigned = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const pem = (SA_KEY || "").replace(/\\n/g, "\n");
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`Token exchange failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

function buildRequest(report: string, startDate: string, endDate: string) {
  const dateRanges = [{ startDate, endDate }];
  switch (report) {
    case "summary":
      return {
        dateRanges,
        metrics: [
          { name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" },
          { name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "bounceRate" },
        ],
      };
    case "timeseries":
      return {
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      };
    case "topPages":
      return {
        dateRanges,
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 25,
      };
    case "trafficSources":
      return {
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      };
    case "countries":
      return {
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      };
    case "devices":
      return {
        dateRanges,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      };
    default:
      throw new Error(`Unknown report: ${report}`);
  }
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (PROPERTY_ALLOWLIST.length === 0) throw new Error("GA4_PROPERTY_ID is not configured");
    if (!SA_EMAIL) throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured");
    if (!SA_KEY) throw new Error("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not configured");

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
    const propertyId = String(body.propertyId || PROPERTY_ALLOWLIST[0]);
    if (!PROPERTY_ALLOWLIST.includes(propertyId)) {
      return ga4SetupError(`Property ${propertyId} is not configured in the GA4 allowlist.`);
    }

    let startDate: string;
    let endDate: string;
    if (body.startDate && body.endDate && ISO.test(body.startDate) && ISO.test(body.endDate)) {
      startDate = body.startDate; endDate = body.endDate;
    } else {
      const safeDays = Math.max(1, Math.min(365, Number(body.days) || 28));
      startDate = isoDaysAgo(safeDays);
      endDate = todayIso();
    }

    const cacheKey = `ga4:${propertyId}:${report}:${startDate}:${endDate}`;
    const { data: cached } = await admin
      .from("analytics_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    // Audit every read (cache hit or miss)
    await admin.from("admin_audit_log").insert({
      actor_id: userData.user.id,
      action: "view_analytics",
      entity_type: "ga4",
      entity_slug: propertyId,
      diff: { report, startDate, endDate, cached: !!cached },
    });

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(JSON.stringify({ cached: true, ...cached.payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAccessToken();
    const reqBody = buildRequest(report, startDate, endDate);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const ga = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
    const json = await ga.json();
    if (!ga.ok) {
      const apiMessage = json?.error?.message || JSON.stringify(json);
      if (ga.status === 403) {
        return ga4SetupError(
          `GA4 permission denied for property ${propertyId}. Grant Viewer access in GA4 Property access management to the configured service account (${SA_EMAIL}). Google response: ${apiMessage}`,
        );
      }
      throw new Error(`GA4 API failed [${ga.status}]: ${JSON.stringify(json)}`);
    }

    const payload = { report, propertyId, startDate, endDate, data: json };
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
    console.error("ga4-report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
