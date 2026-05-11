/** Normalize text pasted from external sources (Word, Notion, Google Docs, etc.). */
export function normalizePastedText(input: string): string {
  if (!input) return "";
  let s = input;

  // Line endings
  s = s.replace(/\r\n?/g, "\n");

  // Zero-width / BOM
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Non-breaking space → regular space
  s = s.replace(/\u00A0/g, " ");

  // Smart quotes → straight
  s = s
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"');

  // En/em dashes from Word → ASCII
  s = s.replace(/\u2014/g, "—").replace(/\u2013/g, "–");
  // (keep them readable; renderers handle these fine)

  // Ellipsis
  s = s.replace(/\u2026/g, "...");

  // Strip Notion footers
  s = s.replace(/\n*Open in Notion\s*$/i, "");

  // Collapse 3+ blank lines → 2
  s = s.replace(/\n{3,}/g, "\n\n");

  // Ensure trailing newline after fenced code blocks
  s = s.replace(/```([^\n]*)\n([\s\S]*?)```(?!`)/g, (_, lang, body) => {
    const trimmed = body.replace(/\n+$/, "");
    return "```" + lang + "\n" + trimmed + "\n```";
  });

  return s.trim() + "\n";
}
