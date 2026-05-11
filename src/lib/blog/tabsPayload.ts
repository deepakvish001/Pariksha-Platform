/**
 * Safe parser/validator for the JSON payload emitted by remark-code-tabs
 * into `__tabs__` synthetic code nodes. Returns `null` for any malformed
 * input so the renderer can fall back to plain code rendering.
 */
import type { CodeTabsPayload, CodeTabVariant } from "./remarkCodeTabs";

const isString = (v: unknown): v is string => typeof v === "string";

function sanitiseHighlight(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const out: number[] = [];
  for (const n of input) {
    if (typeof n === "number" && Number.isFinite(n) && n > 0) {
      out.push(Math.floor(n));
    }
  }
  return out;
}

function sanitiseVariant(raw: unknown): CodeTabVariant | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const language = isString(r.language) ? r.language.trim() : "";
  const code = isString(r.code) ? r.code : "";
  if (!language) return null;
  return {
    language: language.toLowerCase(),
    filename: isString(r.filename) && r.filename.trim() ? r.filename : undefined,
    highlightLines: sanitiseHighlight(r.highlightLines),
    code,
  };
}

export function parseTabsPayload(raw: string): CodeTabsPayload | null {
  if (!raw || typeof raw !== "string") return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  const group = isString(obj.group) && obj.group.trim() ? obj.group : "_";
  const variantsRaw = obj.variants;
  if (!Array.isArray(variantsRaw) || variantsRaw.length === 0) return null;
  const variants: CodeTabVariant[] = [];
  for (const v of variantsRaw) {
    const sv = sanitiseVariant(v);
    if (sv) variants.push(sv);
  }
  if (variants.length === 0) return null;
  return { group, variants };
}
