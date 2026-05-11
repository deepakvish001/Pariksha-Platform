import yaml from "js-yaml";

export interface ParsedFrontMatter {
  data: Record<string, unknown>;
  body: string;
  found: boolean;
}

const FM_REGEX = /^---\n([\s\S]*?)\n---\s*\n?/;
const TOML_REGEX = /^\+\+\+\n([\s\S]*?)\n\+\+\+\s*\n?/;

/** Parse leading YAML or TOML front-matter from a markdown string. */
export function parseFrontMatter(input: string): ParsedFrontMatter {
  const yamlMatch = input.match(FM_REGEX);
  if (yamlMatch) {
    try {
      const data = (yaml.load(yamlMatch[1]) ?? {}) as Record<string, unknown>;
      return { data, body: input.slice(yamlMatch[0].length), found: true };
    } catch {
      /* fall through */
    }
  }
  const tomlMatch = input.match(TOML_REGEX);
  if (tomlMatch) {
    const data = parseSimpleToml(tomlMatch[1]);
    return { data, body: input.slice(tomlMatch[0].length), found: true };
  }
  return { data: {}, body: input, found: false };
}

/** Tiny TOML subset parser — `key = value` pairs, strings, numbers, bools, arrays. */
function parseSimpleToml(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const lineRaw of src.split("\n")) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#") || line.startsWith("[")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const valRaw = line.slice(eq + 1).trim();
    out[key] = parseTomlValue(valRaw);
  }
  return out;
}

function parseTomlValue(v: string): unknown {
  if (!v) return "";
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1);
  if (v === "true" || v === "false") return v === "true";
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((p) => parseTomlValue(p.trim()))
      .filter((p) => p !== "");
  }
  return v;
}

export interface FrontMatterApply {
  title?: string;
  excerpt?: string;
  cover?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  tags?: string[];
  categories?: string[];
}

const STR = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

const ARR = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return undefined;
};

/** Look up a value across many synonym keys, case-insensitive. */
function pickStr(d: Record<string, unknown>, keys: string[]): string | undefined {
  const lookup = new Map<string, unknown>();
  for (const [k, v] of Object.entries(d)) lookup.set(k.toLowerCase(), v);
  for (const k of keys) {
    const v = STR(lookup.get(k.toLowerCase()));
    if (v) return v;
  }
  return undefined;
}

function pickArr(d: Record<string, unknown>, keys: string[]): string[] | undefined {
  const lookup = new Map<string, unknown>();
  for (const [k, v] of Object.entries(d)) lookup.set(k.toLowerCase(), v);
  for (const k of keys) {
    const v = ARR(lookup.get(k.toLowerCase()));
    if (v && v.length) return v;
  }
  return undefined;
}

/** Walk nested taxonomy objects (Hugo-style `taxonomies.tags`). */
function nestedArr(d: Record<string, unknown>, parents: string[], leafKeys: string[]): string[] | undefined {
  for (const p of parents) {
    const node = (d as any)[p];
    if (node && typeof node === "object" && !Array.isArray(node)) {
      const sub = pickArr(node as Record<string, unknown>, leafKeys);
      if (sub && sub.length) return sub;
    }
  }
  return undefined;
}

/**
 * Map common front-matter keys (Hugo, Jekyll, Hexo, Dev.to, Gatsby, Notion,
 * Astro, Ghost, Medium, Zola, Eleventy, ...) to editor field names.
 */
export function mapFrontMatter(data: Record<string, unknown>): FrontMatterApply {
  return {
    title: pickStr(data, ["title", "name", "post_title", "headline"]),
    excerpt: pickStr(data, [
      "excerpt",
      "description",
      "summary",
      "subtitle",
      "lede",
      "lead",
      "abstract",
      "tagline",
      "blurb",
      "preview",
      "intro",
    ]),
    cover: pickStr(data, [
      "cover",
      "cover_image",
      "coverImage",
      "image",
      "thumbnail",
      "thumbnail_url",
      "hero",
      "hero_image",
      "header",
      "header_image",
      "banner",
      "banner_image",
      "og_image",
      "ogImage",
      "social_image",
      "socialImage",
      "featured_image",
      "featuredImage",
    ]),
    slug: pickStr(data, ["slug", "permalink", "url", "path"]),
    seoTitle: pickStr(data, [
      "seo_title",
      "seoTitle",
      "meta_title",
      "metaTitle",
      "page_title",
    ]),
    seoDescription: pickStr(data, [
      "seo_description",
      "seoDescription",
      "meta_description",
      "metaDescription",
      "page_description",
    ]),
    canonicalUrl: pickStr(data, [
      "canonical_url",
      "canonicalUrl",
      "canonical",
      "canonical_link",
    ]),
    tags:
      pickArr(data, ["tags", "tag", "keywords", "labels", "topics"]) ??
      nestedArr(data, ["taxonomies", "meta"], ["tags", "keywords"]),
    categories:
      pickArr(data, ["categories", "category", "sections", "section", "collection"]) ??
      nestedArr(data, ["taxonomies", "meta"], ["categories", "category"]),
  };
}
