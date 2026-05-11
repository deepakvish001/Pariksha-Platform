/**
 * Lightweight, dependency-free language detector for code snippets.
 *
 * Used as a fallback when a fenced code block has no language tag (or `text`).
 * Returns a normalized language id (e.g. "ts", "py", "java") or null when
 * confidence is too low.
 */

export type DetectedLang =
  | "ts"
  | "tsx"
  | "js"
  | "jsx"
  | "py"
  | "java"
  | "cpp"
  | "c"
  | "cs"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "kotlin"
  | "swift"
  | "sql"
  | "html"
  | "css"
  | "json"
  | "yaml"
  | "bash"
  | "md"
  | "dockerfile"
  | "makefile"
  | "toml"
  | "ini"
  | "nginx"
  | "graphql"
  | "xml"
  | "powershell"
  | "regex";

interface Rule {
  lang: DetectedLang;
  weight: number;
  re: RegExp;
}

// Higher-weight rules are stronger signals. Multiple matches accumulate.
const RULES: Rule[] = [
  // JSON / YAML / Markdown — structural, check first.
  { lang: "json", weight: 6, re: /^\s*[\[{][\s\S]*[\]}]\s*$/ },
  { lang: "yaml", weight: 4, re: /^[a-z0-9_-]+\s*:\s*[^\n]+$/im },
  { lang: "md", weight: 3, re: /^#{1,6}\s+\S|^\s*[-*]\s+\S/m },

  // HTML / CSS
  { lang: "html", weight: 5, re: /<\/?(html|body|head|div|span|p|a|img|h[1-6])\b/i },
  { lang: "html", weight: 3, re: /<!doctype html>/i },
  { lang: "css", weight: 4, re: /^[.#]?[\w-]+\s*\{[^}]*[\w-]+\s*:[^}]+;/m },

  // SQL
  { lang: "sql", weight: 5, re: /\b(select|insert|update|delete|create|alter|drop)\b[\s\S]*\bfrom\b|\bwhere\b/i },

  // Bash / shell
  { lang: "bash", weight: 4, re: /^\s*\$\s+\S/m },
  { lang: "bash", weight: 3, re: /^#!\/usr\/bin\/env\s+(bash|sh)/m },
  { lang: "bash", weight: 2, re: /\b(npm|pnpm|bun|yarn|brew|apt|sudo|curl|wget|grep|sed|awk)\b/i },

  // Python
  { lang: "py", weight: 5, re: /^\s*def\s+\w+\s*\([^)]*\)\s*:/m },
  { lang: "py", weight: 4, re: /^\s*(import|from)\s+[\w.]+/m },
  { lang: "py", weight: 3, re: /\bprint\s*\(/ },
  { lang: "py", weight: 3, re: /^\s*if\s+__name__\s*==\s*["']__main__["']\s*:/m },
  { lang: "py", weight: 2, re: /\b(self|elif|None|True|False)\b/ },

  // TypeScript / JavaScript
  { lang: "ts", weight: 5, re: /:\s*(string|number|boolean|any|void|unknown)(\b|\[)/ },
  { lang: "ts", weight: 5, re: /\b(interface|type)\s+\w+\s*[={]/ },
  { lang: "ts", weight: 4, re: /\bas\s+(const|\w+)\b/ },
  { lang: "tsx", weight: 4, re: /<\/?[A-Z]\w*[\s/>]/ },
  { lang: "js", weight: 3, re: /\b(const|let)\s+\w+\s*=/ },
  { lang: "js", weight: 3, re: /\bfunction\s+\w+\s*\(/ },
  { lang: "js", weight: 3, re: /=>\s*[{(]/ },
  { lang: "js", weight: 2, re: /\bconsole\.(log|error|warn)\(/ },
  { lang: "js", weight: 3, re: /\b(import|export)\b[\s\S]{0,80}?\bfrom\s+['"]/ },

  // Java / Kotlin
  { lang: "java", weight: 5, re: /\bpublic\s+(static\s+)?(class|void|interface)\s+\w+/ },
  { lang: "java", weight: 4, re: /\bSystem\.out\.println\(/ },
  { lang: "java", weight: 2, re: /\bimport\s+java\./ },
  { lang: "kotlin", weight: 5, re: /\bfun\s+\w+\s*\([^)]*\)\s*[:{]/ },
  { lang: "kotlin", weight: 3, re: /\bval\s+\w+\s*[:=]/ },

  // C / C++ / C#
  { lang: "cpp", weight: 5, re: /#include\s*<\w+>|\bstd::\w+/ },
  { lang: "cpp", weight: 3, re: /\bcout\s*<<|\bcin\s*>>/ },
  { lang: "c", weight: 4, re: /#include\s*<(stdio|stdlib|string)\.h>/ },
  { lang: "c", weight: 3, re: /\bprintf\s*\(/ },
  { lang: "cs", weight: 4, re: /\b(using\s+System|namespace\s+\w+|Console\.WriteLine)\b/ },

  // Go / Rust / PHP / Ruby / Swift
  { lang: "go", weight: 5, re: /\bpackage\s+main\b|\bfunc\s+\w+\s*\(/ },
  { lang: "go", weight: 3, re: /\bfmt\.Print(ln|f)?\(/ },
  { lang: "rust", weight: 5, re: /\bfn\s+\w+\s*\([^)]*\)\s*(->|{)/ },
  { lang: "rust", weight: 4, re: /\blet\s+mut\s+\w+|::<\w+>/ },
  { lang: "rust", weight: 3, re: /\bprintln!\s*\(/ },
  { lang: "php", weight: 5, re: /<\?php\b|\$\w+\s*=/ },
  { lang: "ruby", weight: 4, re: /\bdef\s+\w+\s*(\(.*?\))?\s*\n[\s\S]*?\bend\b/m },
  { lang: "ruby", weight: 3, re: /\bputs\s+["']/ },
  { lang: "swift", weight: 5, re: /\b(func|let|var)\s+\w+\s*:\s*\w+|\bimport\s+(Foundation|UIKit|SwiftUI)\b/ },
];

/**
 * Detect the most likely language for a snippet. Returns null when no rule
 * matches strongly enough (min total weight = 3).
 */
export function detectLanguage(snippet: string): DetectedLang | null {
  const code = (snippet || "").trim();
  if (code.length < 2) return null;

  // Score every language by summing weights of matching rules.
  const scores = new Map<DetectedLang, number>();
  for (const r of RULES) {
    if (r.re.test(code)) {
      scores.set(r.lang, (scores.get(r.lang) ?? 0) + r.weight);
    }
  }

  if (scores.size === 0) return null;

  // TS subsumes JS — if both match, prefer TS only when its own rules fired.
  const tsScore = scores.get("ts") ?? 0;
  const jsScore = scores.get("js") ?? 0;
  if (tsScore && jsScore) {
    scores.set("ts", tsScore + Math.floor(jsScore / 2));
  }

  let best: { lang: DetectedLang; score: number } | null = null;
  for (const [lang, score] of scores) {
    if (!best || score > best.score) best = { lang, score };
  }
  if (!best || best.score < 3) return null;
  return best.lang;
}

/**
 * Convenience wrapper: returns the detected language id, or the supplied
 * fallback when detection fails.
 */
export function detectLanguageOr(snippet: string, fallback = "text"): string {
  return detectLanguage(snippet) ?? fallback;
}
