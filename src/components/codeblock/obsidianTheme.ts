/**
 * Custom Prism token palette tuned for the deep "obsidian" dark surface used
 * by <CodeBlock />. All values are HSL so they age well across themes.
 *
 * Designed to read clearly on a near-black background (hsl(220 14% 4%)) while
 * keeping enough hue separation between keywords / strings / numbers to feel
 * like a premium IDE rather than a stock highlighter dump.
 */
export const obsidianDarkTheme: Record<string, React.CSSProperties> = {
  'pre[class*="language-"]': {
    color: "hsl(220 15% 88%)",
    background: "transparent",
    fontFamily:
      'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace',
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: 1.65,
    tabSize: 4,
    hyphens: "none",
    margin: 0,
  },
  'code[class*="language-"]': {
    color: "hsl(220 15% 88%)",
    background: "transparent",
    fontFamily:
      'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace',
    fontSize: "0.875rem",
  },
  comment: { color: "hsl(220 10% 45%)", fontStyle: "italic" },
  prolog: { color: "hsl(220 10% 45%)" },
  doctype: { color: "hsl(220 10% 45%)" },
  cdata: { color: "hsl(220 10% 45%)" },
  punctuation: { color: "hsl(220 10% 65%)" },
  property: { color: "hsl(200 95% 72%)" },
  tag: { color: "hsl(355 75% 72%)" },
  boolean: { color: "hsl(28 95% 70%)" },
  number: { color: "hsl(28 95% 70%)" },
  constant: { color: "hsl(28 95% 70%)" },
  symbol: { color: "hsl(28 95% 70%)" },
  deleted: { color: "hsl(355 75% 72%)" },
  selector: { color: "hsl(150 60% 70%)" },
  "attr-name": { color: "hsl(28 95% 70%)" },
  string: { color: "hsl(150 60% 70%)" },
  char: { color: "hsl(150 60% 70%)" },
  builtin: { color: "hsl(200 95% 72%)" },
  inserted: { color: "hsl(150 60% 70%)" },
  operator: { color: "hsl(220 10% 75%)" },
  entity: { color: "hsl(200 95% 72%)", cursor: "help" },
  url: { color: "hsl(200 95% 72%)" },
  variable: { color: "hsl(15 85% 75%)" },
  atrule: { color: "hsl(265 90% 78%)" },
  "attr-value": { color: "hsl(150 60% 70%)" },
  function: { color: "hsl(200 95% 72%)" },
  "class-name": { color: "hsl(45 90% 70%)" },
  keyword: { color: "hsl(265 90% 78%)" },
  regex: { color: "hsl(45 90% 70%)" },
  important: { color: "hsl(355 75% 72%)", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
} as any;
