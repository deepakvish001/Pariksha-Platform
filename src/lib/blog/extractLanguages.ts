import { detectLanguage } from "./detectLang";

/**
 * Normalize raw fence language tokens (which may carry meta like
 * `ts {1,3-5}` or `tabs group=install`) to a single short id.
 */
function normalizeLangToken(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const token = raw.trim().split(/\s+/)[0]?.toLowerCase();
  if (!token || token === "tabs" || token === "text" || token === "txt") return null;
  // Map a few common aliases to canonical short ids used elsewhere.
  const ALIAS: Record<string, string> = {
    typescript: "ts",
    javascript: "js",
    python: "py",
    "c++": "cpp",
    cxx: "cpp",
    "c#": "cs",
    csharp: "cs",
    rs: "rust",
    yml: "yaml",
    sh: "bash",
    zsh: "bash",
    shell: "bash",
    md: "md",
    markdown: "md",
    plaintext: "text",
  };
  return ALIAS[token] ?? token;
}

/**
 * Scan a markdown document for fenced code blocks and return the unique set
 * of (normalized) languages used. When a fence has no language, we attempt
 * to auto-detect it from the snippet body.
 */
export function extractLanguages(markdown: string | null | undefined): string[] {
  if (!markdown) return [];
  const found = new Set<string>();
  // Match ``` fences with optional language line + body until matching close.
  const re = /^```([^\n]*)\n([\s\S]*?)^```/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const lang = normalizeLangToken(m[1]);
    if (lang) {
      found.add(lang);
      continue;
    }
    const detected = detectLanguage(m[2]);
    if (detected) found.add(detected);
  }
  return Array.from(found);
}
