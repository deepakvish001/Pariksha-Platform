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

/** Map common front-matter keys (Hugo, Jekyll, Hexo, Dev.to, etc.) to editor fields. */
export function mapFrontMatter(data: Record<string, unknown>): FrontMatterApply {
  return {
    title: STR(data.title) ?? STR((data as any).Title),
    excerpt:
      STR(data.excerpt) ??
      STR(data.description) ??
      STR(data.summary) ??
      STR((data as any).subtitle),
    cover:
      STR(data.cover) ??
      STR(data.cover_image) ??
      STR((data as any).coverImage) ??
      STR((data as any).image) ??
      STR((data as any).thumbnail) ??
      STR((data as any).hero_image),
    slug: STR(data.slug) ?? STR((data as any).permalink),
    seoTitle: STR((data as any).seo_title) ?? STR((data as any).seoTitle),
    seoDescription:
      STR((data as any).seo_description) ?? STR((data as any).seoDescription),
    canonicalUrl:
      STR((data as any).canonical_url) ?? STR((data as any).canonicalUrl),
    tags: ARR(data.tags) ?? ARR((data as any).keywords),
    categories: ARR((data as any).categories) ?? ARR((data as any).category),
  };
}
