// Cross-contest similarity scanner. For a target submission, this
// function:
//   1. Fingerprints the submitted code with a winnowing-style hash
//      over normalized k-grams.
//   2. Compares against all other contest submissions for the same
//      problem (across contests).
//   3. Optionally checks the public web (GitHub code search) for an
//      identical snippet, when GITHUB_TOKEN is configured.
// Matches above 0.6 are persisted to contest_cross_similarity; a DB
// trigger raises an admin alert when similarity ≥ 0.80.
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

interface Body {
  session_id: string;
  user_id: string;
  contest_id: string;
  problem_id: string;
  code: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fingerprint = winnow(normalize(body.code));

    // Compare against other submissions for the same problem
    const { data: peers } = await supabase
      .from("contest_code_provenance")
      .select("session_id, user_id, contest_id, diff_summary")
      .eq("problem_id", body.problem_id)
      .eq("event_type", "snapshot")
      .neq("session_id", body.session_id)
      .limit(500);

    const matches: Array<Record<string, unknown>> = [];
    for (const peer of peers ?? []) {
      const peerHash = (peer.diff_summary as { hash?: string } | null)?.hash;
      if (!peerHash) continue;
      const sim = jaccard(fingerprint, [peerHash]);
      if (sim >= 0.6) {
        matches.push({
          source_session_id: body.session_id,
          source_user_id: body.user_id,
          source_contest_id: body.contest_id,
          match_session_id: peer.session_id,
          match_user_id: peer.user_id,
          match_contest_id: peer.contest_id,
          match_source: "internal",
          similarity: sim,
          matched_lines: null,
          details: { fingerprint_size: fingerprint.length },
        });
      }
    }

    // Optional GitHub web search
    const ghToken = Deno.env.get("GITHUB_TOKEN");
    if (ghToken && body.code.length > 80) {
      const snippet = body.code
        .split("\n")
        .filter((l) => l.trim().length > 20)
        .slice(0, 3)
        .join(" ")
        .slice(0, 200);
      try {
        const gh = await fetch(
          `https://api.github.com/search/code?q=${encodeURIComponent('"' + snippet + '"')}`,
          { headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json" } },
        );
        if (gh.ok) {
          const json = await gh.json();
          for (const item of (json.items ?? []).slice(0, 3)) {
            matches.push({
              source_session_id: body.session_id,
              source_user_id: body.user_id,
              source_contest_id: body.contest_id,
              match_source: "github",
              match_url: item.html_url,
              similarity: 0.85,
              details: { repo: item.repository?.full_name },
            });
          }
        }
      } catch {/* ignore */}
    }

    if (matches.length > 0) {
      await supabase.from("contest_cross_similarity").insert(matches);
    }

    return new Response(JSON.stringify({ ok: true, matches: matches.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function normalize(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "")
    .replace(/#.*/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b[a-z_][a-z0-9_]*\b/gi, "V")
    .toLowerCase();
}

function winnow(s: string, k = 5, w = 4): string[] {
  const grams: string[] = [];
  for (let i = 0; i + k <= s.length; i++) grams.push(hash(s.slice(i, i + k)));
  const fingerprints = new Set<string>();
  for (let i = 0; i + w <= grams.length; i++) {
    const window = grams.slice(i, i + w);
    fingerprints.add(window.sort()[0]);
  }
  return Array.from(fingerprints);
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}
