import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns short-lived ICE servers for the Second Eye WebRTC stream.
 *
 * Provider precedence (first available wins):
 *  1. Cloudflare Calls    (env: CLOUDFLARE_TURN_TOKEN_ID + CLOUDFLARE_TURN_API_TOKEN)
 *  2. Twilio NTS          (env: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)
 *  3. Metered.ca          (env: METERED_API_KEY + METERED_APP_NAME)
 *  4. Public STUN fallback (always)
 *
 * Always returns 200 with `{ iceServers: [...], provider: "..." }`.
 * Authenticated callers only.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // 1) Cloudflare Calls
    const cfTokenId = Deno.env.get("CLOUDFLARE_TURN_TOKEN_ID");
    const cfApiToken = Deno.env.get("CLOUDFLARE_TURN_API_TOKEN");
    if (cfTokenId && cfApiToken) {
      try {
        const resp = await fetch(
          `https://rtc.live.cloudflare.com/v1/turn/keys/${cfTokenId}/credentials/generate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ttl: 3600 }),
          },
        );
        if (resp.ok) {
          const body = await resp.json();
          // Cloudflare returns { iceServers: { urls, username, credential } }
          const ice = body?.iceServers ?? body;
          const servers = Array.isArray(ice) ? ice : [ice];
          return json({
            iceServers: [...stunFallback(), ...servers],
            provider: "cloudflare",
            ttl: 3600,
          });
        } else {
          console.warn("Cloudflare TURN failed", resp.status, await resp.text());
        }
      } catch (e) {
        console.warn("Cloudflare TURN error", e);
      }
    }

    // 2) Twilio Network Traversal Service
    const twAccount = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (twAccount && twToken) {
      try {
        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twAccount}/Tokens.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twAccount}:${twToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "Ttl=3600",
          },
        );
        if (resp.ok) {
          const body = await resp.json();
          // Twilio returns { ice_servers: [...] }
          const servers = (body.ice_servers ?? []).map((s: any) => ({
            urls: s.url ?? s.urls,
            username: s.username,
            credential: s.credential,
          }));
          return json({
            iceServers: servers.length ? servers : stunFallback(),
            provider: "twilio",
            ttl: 3600,
          });
        } else {
          console.warn("Twilio TURN failed", resp.status, await resp.text());
        }
      } catch (e) {
        console.warn("Twilio TURN error", e);
      }
    }

    // 3) Metered.ca
    const meteredKey = Deno.env.get("METERED_API_KEY");
    const meteredApp = Deno.env.get("METERED_APP_NAME");
    if (meteredKey && meteredApp) {
      try {
        const resp = await fetch(
          `https://${meteredApp}.metered.live/api/v1/turn/credentials?apiKey=${meteredKey}`,
        );
        if (resp.ok) {
          const servers = await resp.json();
          return json({
            iceServers: Array.isArray(servers) ? servers : [servers],
            provider: "metered",
          });
        }
      } catch (e) {
        console.warn("Metered TURN error", e);
      }
    }

    // 4) STUN-only fallback
    return json({
      iceServers: stunFallback(),
      provider: "stun_only",
      warning: "No TURN provider configured. Candidates behind strict NAT may fail to connect.",
    });
  } catch (e) {
    console.error("contest-sideeye-ice", e);
    return json({
      iceServers: stunFallback(),
      provider: "stun_only",
      error: e instanceof Error ? e.message : "Unknown",
    });
  }
});

function stunFallback() {
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
