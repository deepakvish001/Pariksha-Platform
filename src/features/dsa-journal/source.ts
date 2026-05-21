/** Detect the source platform from a URL and try to infer a title slug. */
const SOURCES: Array<{ host: RegExp; name: string }> = [
  { host: /leetcode\.com/i, name: "LeetCode" },
  { host: /geeksforgeeks\.org/i, name: "GeeksforGeeks" },
  { host: /codeforces\.com/i, name: "Codeforces" },
  { host: /atcoder\.jp/i, name: "AtCoder" },
  { host: /codechef\.com/i, name: "CodeChef" },
  { host: /hackerrank\.com/i, name: "HackerRank" },
  { host: /hackerearth\.com/i, name: "HackerEarth" },
  { host: /interviewbit\.com/i, name: "InterviewBit" },
  { host: /spoj\.com/i, name: "SPOJ" },
];

export function detectSource(url: string): string | null {
  try {
    const u = new URL(url);
    for (const s of SOURCES) if (s.host.test(u.hostname)) return s.name;
    return "Custom";
  } catch {
    return null;
  }
}

const titleCase = (s: string) =>
  s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");

/** Best-effort title extraction from common URL patterns. */
export function inferTitleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");

    // leetcode.com/problems/<slug>/...
    const lc = path.match(/\/problems\/([a-z0-9-]+)/i);
    if (lc) return titleCase(lc[1]);

    // gfg practice/problems
    const gfg = path.match(/\/problems\/([a-z0-9-]+)/i);
    if (gfg) return titleCase(gfg[1]);

    // codeforces problemset/problem/<contest>/<idx>
    const cf = path.match(/\/problem\/(\d+)\/([A-Z0-9]+)/i);
    if (cf) return `Codeforces ${cf[1]}${cf[2]}`;

    // fallback: last meaningful segment
    const last = path.split("/").filter(Boolean).pop();
    if (last && /[a-z]/i.test(last)) return titleCase(last);
    return null;
  } catch {
    return null;
  }
}
