import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  org_id: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(10),
  ttl_hours: z.number().int().min(1).max(24 * 14).optional(),
});

function randomToken(len = 24) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const { org_id, emails, ttl_hours = 72 } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE);
    // Verify ownership
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, slug, type, owner_id")
      .eq("id", org_id)
      .maybeSingle();
    if (orgErr || !org || org.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Ad-hoc rate limit: max 6 generations per inviter per org per minute ──
    const sinceIso = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentCount } = await admin
      .from("b2b_org_invites")
      .select("id", { count: "exact", head: true })
      .eq("inviter_id", user.id)
      .eq("org_id", org_id)
      .gte("created_at", sinceIso);
    if ((recentCount ?? 0) >= 6) {
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Too many invite generations — please wait a moment before trying again.",
          retry_after_seconds: 30,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "30",
          },
        },
      );
    }

    const expiresAt = new Date(Date.now() + ttl_hours * 3600 * 1000);
    const origin =
      req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    const baseHost = origin ? new URL(origin).origin : "";
    const basePath = `${org.type === "company" ? "companies" : "colleges"}/${org.slug}/team`;

    // Dedupe + lowercase
    const uniq = Array.from(new Set(emails.map((e) => e.toLowerCase().trim())));

    // Revoke previous active tokens for these emails so resends never leave
    // multiple valid links per recipient (no duplicate tokens in flight).
    await admin
      .from("b2b_org_invites")
      .update({ revoked: true })
      .eq("org_id", org_id)
      .eq("revoked", false)
      .in("email", uniq);

    const rows = uniq.map((email) => ({
      org_id,
      inviter_id: user.id,
      email,
      token: randomToken(),
      expires_at: expiresAt.toISOString(),
    }));

    // Safe retry: if a unique-token collision somehow happens, regenerate once.
    let inserted: { email: string; token: string; expires_at: string }[] | null = null;
    let lastErr: { message: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await admin
        .from("b2b_org_invites")
        .insert(rows)
        .select("email, token, expires_at");
      if (!error) {
        inserted = data as typeof inserted;
        lastErr = null;
        break;
      }
      lastErr = error;
      if (!`${error.message}`.toLowerCase().includes("duplicate")) break;
      // Regenerate tokens and retry once.
      for (const r of rows) r.token = randomToken();
    }

    if (lastErr || !inserted) {
      return new Response(
        JSON.stringify({ error: lastErr?.message ?? "Insert failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const links = inserted.map((r) => ({
      email: r.email,
      url: `${baseHost}/${basePath}?invite=${r.token}`,
      token: r.token,
      expires_at: r.expires_at,
    }));

    return new Response(JSON.stringify({ links, expires_at: expiresAt.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
