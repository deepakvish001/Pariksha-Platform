// Fetches a user's public stats from supported coding platforms.
// Phase 1: LeetCode (GraphQL), Codeforces (REST). Phase 2: best-effort scrapes for the rest.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Platform =
  | "leetcode"
  | "codeforces"
  | "codechef"
  | "hackerrank"
  | "hackerearth"
  | "geeksforgeeks";

interface Normalized {
  platform: Platform;
  handle: string;
  rating: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
  raw: unknown;
  confidence: "high" | "medium" | "low";
  sync_status: "ok" | "error";
  sync_error?: string;
}

async function fetchLeetCode(handle: string): Promise<Normalized> {
  const query = `query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking realName }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
    userContestRanking(username: $username) { rating attendedContestsCount }
  }`;
  try {
    const r = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": `https://leetcode.com/${handle}/`,
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query, variables: { username: handle } }),
    });
    if (!r.ok) throw new Error(`LeetCode HTTP ${r.status}`);
    const j = await r.json();
    const m = j?.data?.matchedUser;
    if (!m) throw new Error("LeetCode user not found");
    const counts: Record<string, number> = {};
    for (const x of m.submitStatsGlobal?.acSubmissionNum ?? []) {
      counts[(x.difficulty as string).toLowerCase()] = x.count as number;
    }
    return {
      platform: "leetcode",
      handle,
      rating: Math.round(j?.data?.userContestRanking?.rating ?? 0) || null,
      solved: {
        easy: counts.easy ?? 0,
        medium: counts.medium ?? 0,
        hard: counts.hard ?? 0,
        total: counts.all ?? (counts.easy ?? 0) + (counts.medium ?? 0) + (counts.hard ?? 0),
      },
      raw: j.data,
      confidence: "high",
      sync_status: "ok",
    };
  } catch (e) {
    return {
      platform: "leetcode", handle, rating: null,
      solved: { easy: 0, medium: 0, hard: 0, total: 0 },
      raw: null, confidence: "high", sync_status: "error",
      sync_error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function fetchCodeforces(handle: string): Promise<Normalized> {
  try {
    const [info, status] = await Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`).then((r) => r.json()),
      fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`).then((r) => r.json()),
    ]);
    if (info.status !== "OK") throw new Error(info.comment ?? "Codeforces error");
    const user = info.result[0];
    const solvedSet = new Set<string>();
    const ratingDiffs: Record<string, number[]> = { easy: [], medium: [], hard: [] };
    for (const sub of status.result ?? []) {
      if (sub.verdict === "OK" && sub.problem) {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedSet.has(key)) {
          solvedSet.add(key);
          const r = sub.problem.rating ?? 0;
          if (r && r < 1400) ratingDiffs.easy.push(r);
          else if (r && r < 2000) ratingDiffs.medium.push(r);
          else if (r) ratingDiffs.hard.push(r);
        }
      }
    }
    return {
      platform: "codeforces", handle,
      rating: user.rating ?? null,
      solved: {
        easy: ratingDiffs.easy.length,
        medium: ratingDiffs.medium.length,
        hard: ratingDiffs.hard.length,
        total: solvedSet.size,
      },
      raw: { user, solvedCount: solvedSet.size },
      confidence: "high", sync_status: "ok",
    };
  } catch (e) {
    return {
      platform: "codeforces", handle, rating: null,
      solved: { easy: 0, medium: 0, hard: 0, total: 0 },
      raw: null, confidence: "high", sync_status: "error",
      sync_error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

// Best-effort scrapers. Marked low confidence — UI shows "may be outdated".
async function fetchCodeChef(handle: string): Promise<Normalized> {
  try {
    const r = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const ratingMatch = html.match(/<div class="rating-number"[^>]*>(\d+)/);
    const solvedMatch = html.match(/Total Problems Solved:[^<]*<\/h3>\s*<h5[^>]*>(\d+)/i);
    return {
      platform: "codechef", handle,
      rating: ratingMatch ? parseInt(ratingMatch[1], 10) : null,
      solved: { easy: 0, medium: 0, hard: 0, total: solvedMatch ? parseInt(solvedMatch[1], 10) : 0 },
      raw: { scraped: true }, confidence: "low", sync_status: "ok",
    };
  } catch (e) {
    return scrapeError("codechef", handle, e);
  }
}

async function fetchGFG(handle: string): Promise<Normalized> {
  try {
    const r = await fetch(`https://auth.geeksforgeeks.org/user/${encodeURIComponent(handle)}/practice/`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const scoreMatch = html.match(/Coding Score[^<]*<[^>]*>(\d+)/i);
    const solvedMatch = html.match(/Problem Solved[^<]*<[^>]*>(\d+)/i);
    return {
      platform: "geeksforgeeks", handle,
      rating: scoreMatch ? parseInt(scoreMatch[1], 10) : null,
      solved: { easy: 0, medium: 0, hard: 0, total: solvedMatch ? parseInt(solvedMatch[1], 10) : 0 },
      raw: { scraped: true }, confidence: "low", sync_status: "ok",
    };
  } catch (e) {
    return scrapeError("geeksforgeeks", handle, e);
  }
}

async function fetchHackerRank(handle: string): Promise<Normalized> {
  try {
    const r = await fetch(`https://www.hackerrank.com/rest/contests/master/hackers/${encodeURIComponent(handle)}/profile`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return {
      platform: "hackerrank", handle, rating: null,
      solved: { easy: 0, medium: 0, hard: 0, total: 0 },
      raw: j, confidence: "low", sync_status: "ok",
    };
  } catch (e) {
    return scrapeError("hackerrank", handle, e);
  }
}

function scrapeError(platform: Platform, handle: string, e: unknown): Normalized {
  return {
    platform, handle, rating: null,
    solved: { easy: 0, medium: 0, hard: 0, total: 0 },
    raw: null, confidence: "low", sync_status: "error",
    sync_error: e instanceof Error ? e.message : "Unknown error",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const platform = String(body?.platform ?? "").toLowerCase() as Platform;
    const handle = String(body?.handle ?? "").trim();
    if (!handle || handle.length > 100) {
      return json({ error: "Invalid handle" }, 400);
    }
    let result: Normalized;
    switch (platform) {
      case "leetcode": result = await fetchLeetCode(handle); break;
      case "codeforces": result = await fetchCodeforces(handle); break;
      case "codechef": result = await fetchCodeChef(handle); break;
      case "geeksforgeeks": result = await fetchGFG(handle); break;
      case "hackerrank": result = await fetchHackerRank(handle); break;
      case "hackerearth":
        result = scrapeError("hackerearth", handle, new Error("HackerEarth has no public API yet — coming soon"));
        break;
      default:
        return json({ error: `Unsupported platform: ${platform}` }, 400);
    }
    return json(result, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
