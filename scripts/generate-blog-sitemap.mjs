// Postbuild: enrich dist/sitemap.xml with published blog posts.
// Reads the static public/sitemap.xml that's already copied to dist/, then appends
// /blog and /blog/<slug> entries fetched from the public Supabase REST API.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL =
  process.env.SITE_URL ||
  "https://www.parikshaa.org";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

const distPath = resolve("dist/sitemap.xml");
const publicPath = resolve("public/sitemap.xml");
const sourcePath = existsSync(distPath) ? distPath : publicPath;

if (!existsSync(sourcePath)) {
  console.warn("[sitemap] No base sitemap found, skipping blog enrichment.");
  process.exit(0);
}

async function fetchBlogPosts() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc&limit=2000`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] Blog fetch returned ${res.status}; skipping blog entries.`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Blog fetch failed: ${err?.message ?? err}`);
    return [];
  }
}

function buildEntry(loc: string, lastmod?: string, changefreq = "weekly", priority = "0.7") {
  const lm = lastmod ? `<lastmod>${lastmod.split("T")[0]}</lastmod>` : "";
  return `  <url><loc>${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

const xml = readFileSync(sourcePath, "utf8");
const posts = await fetchBlogPosts();

const blogIndexEntry = buildEntry(`${BASE_URL}/blog`, undefined, "daily", "0.9");
const postEntries = posts
  .filter((p) => p?.slug)
  .map((p) =>
    buildEntry(
      `${BASE_URL}/blog/${p.slug}`,
      p.updated_at || p.published_at,
      "weekly",
      "0.7",
    ),
  );

// Strip any existing /blog or /blog/<slug> entries, then re-insert.
const cleaned = xml
  .split("\n")
  .filter((l) => !/<loc>[^<]*\/blog(\/[^<]*)?<\/loc>/.test(l))
  .join("\n");

const newBlock = [blogIndexEntry, ...postEntries].join("\n");
const enriched = cleaned.replace("</urlset>", `${newBlock}\n</urlset>`);

writeFileSync(distPath, enriched);
console.log(
  `[sitemap] Wrote ${distPath} with ${posts.length} blog post${posts.length === 1 ? "" : "s"}.`,
);
