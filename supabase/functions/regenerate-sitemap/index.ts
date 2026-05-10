// Pings search engines with the sitemap URL. Admin/editor only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return json({ error: "Missing authorization" }, 401);
    }
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supa.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);
    const { data: isEditor } = await supa.rpc("is_blog_editor", { _user_id: u.user.id });
    if (!isEditor) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const siteUrl = (body.siteUrl as string | undefined) || "https://www.parikshaa.org";
    const sitemapUrl = `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`;

    const targets = [
      { name: "google", url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
      { name: "bing", url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    ];

    const results = await Promise.all(
      targets.map(async (t) => {
        try {
          const r = await fetch(t.url, { method: "GET" });
          await r.text();
          return { engine: t.name, status: r.status, ok: r.ok };
        } catch (e) {
          return { engine: t.name, status: 0, ok: false, error: String(e) };
        }
      }),
    );

    return json({ ok: true, sitemapUrl, results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
