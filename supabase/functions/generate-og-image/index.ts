// Generates an SVG OpenGraph card for a blog post and stores it in blog-media.
// Returns the public URL and updates blog_posts.og_image_url. Editor-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);
    const { data: isEditor } = await userClient.rpc("is_blog_editor", { _user_id: u.user.id });
    if (!isEditor) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const postId = body.postId as string | undefined;
    if (!postId) return json({ error: "postId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: post, error: pErr } = await admin
      .from("blog_posts")
      .select("id, slug, title, excerpt, author_id")
      .eq("id", postId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!post) return json({ error: "Post not found" }, 404);

    let authorName: string | null = null;
    if (post.author_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", post.author_id)
        .maybeSingle();
      authorName = prof?.full_name ?? null;
    }

    const svg = renderOgSvg({
      title: post.title || "Byteskill",
      excerpt: post.excerpt || "",
      author: authorName || "Byteskill",
    });

    const path = `og/${post.slug}-${Date.now()}.svg`;
    const { error: upErr } = await admin.storage
      .from("blog-media")
      .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
        contentType: "image/svg+xml",
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from("blog-media").getPublicUrl(path);
    const ogUrl = pub.publicUrl;

    await admin.from("blog_posts").update({ og_image_url: ogUrl }).eq("id", postId);

    return json({ ok: true, og_image_url: ogUrl });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

function renderOgSvg(input: { title: string; excerpt: string; author: string }) {
  const titleLines = wrap(input.title, 28, 3);
  const excerptLines = wrap(input.excerpt, 60, 2);

  const titleEls = titleLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 92}">${escape(l)}</tspan>`)
    .join("");
  const excerptEls = excerptLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 38}">${escape(l)}</tspan>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#030305"/>
      <stop offset="100%" stop-color="#0b0710"/>
    </linearGradient>
    <radialGradient id="orb" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="0.1" cy="0.95" r="0.6">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#orb)"/>
  <rect width="1200" height="630" fill="url(#orb2)"/>
  <g font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" fill="#ffffff">
    <text x="80" y="100" font-size="28" font-weight="600" fill="#f59e0b" letter-spacing="2">BYTESKILL · BLOG</text>
    <text x="80" y="220" font-size="76" font-weight="800" fill="#ffffff">${titleEls}</text>
    <text x="80" y="${260 + titleLines.length * 92}" font-size="28" fill="#cbd5e1" opacity="0.85">${excerptEls}</text>
    <g transform="translate(80, 540)">
      <circle cx="22" cy="22" r="22" fill="#f59e0b"/>
      <text x="22" y="30" font-size="22" font-weight="700" text-anchor="middle" fill="#0b0710">${escape((input.author[0] || "B").toUpperCase())}</text>
      <text x="62" y="20" font-size="22" font-weight="600" fill="#ffffff">${escape(input.author)}</text>
      <text x="62" y="46" font-size="18" fill="#94a3b8">parikshaa.org</text>
    </g>
  </g>
</svg>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
