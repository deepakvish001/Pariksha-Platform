// Submit a user's SQL query: execute it against a seeded SQLite DB, compare
// against the reference query's result, and store/award XP just like the
// regular `submit-code` flow. Response shape matches submit-code so the
// frontend can render results uniformly.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import initSqlJs from "npm:sql.js@1.10.3";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SqlDebug {
  engine: "sqlite";
  rowsAffected?: number;
  durationMs?: number;
  query?: string;
  error?: string;
}

interface CaseResult {
  index: number;
  passed: boolean;
  runStatus: string;
  status_label: string;
  time_ms: number;
  memory_kb: number;
  input: string;
  expected: string;
  stdout: string;
  stderr: string;
  raw: SqlDebug;
}

interface SubmitResult {
  verdict: string;
  passed: number;
  total: number;
  runtime_ms: number;
  memory_kb: number;
  failing_case: Record<string, unknown> | null;
  stderr: string | null;
  submission_id: string | null;
  raw_fermion?: SqlDebug | null;
  case_results?: CaseResult[];
  limits?: { language: string; cpu_ms: number; wall_ms: number; memory_kb: number };
}

interface FunctionResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  diagnostics?: { error_stage?: string; details?: unknown };
}

function respond<T>(payload: FunctionResponse<T>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let WASM_BYTES: Uint8Array | null = null;
async function getSQL() {
  if (SQL) return SQL;
  if (!WASM_BYTES) {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.wasm",
    );
    if (!res.ok) throw new Error(`Failed to fetch sql-wasm.wasm: ${res.status}`);
    WASM_BYTES = new Uint8Array(await res.arrayBuffer());
  }
  SQL = await initSqlJs({ wasmBinary: WASM_BYTES });
  return SQL!;
}

interface ExecOutcome {
  columns: string[];
  rows: unknown[][];
  durationMs: number;
}

function execQuery(
  sqlMod: Awaited<ReturnType<typeof initSqlJs>>,
  schema: string,
  seed: string,
  query: string,
): ExecOutcome {
  const db = new sqlMod.Database();
  try {
    if (schema?.trim()) db.exec(schema);
    if (seed?.trim()) db.exec(seed);
    const start = performance.now();
    const res = db.exec(query);
    const durationMs = performance.now() - start;
    const last = res.length > 0 ? res[res.length - 1] : null;
    return {
      columns: last?.columns ?? [],
      rows: (last?.values as unknown[][]) ?? [],
      durationMs,
    };
  } finally {
    db.close();
  }
}

function formatRows(columns: string[], rows: unknown[][]): string {
  const head = columns.join("\t");
  const body = rows
    .map((r) =>
      r
        .map((v) => (v === null || v === undefined ? "NULL" : String(v)))
        .join("\t"),
    )
    .join("\n");
  return body.length > 0 ? `${head}\n${body}` : head;
}

// Compare two result-sets. If `orderMatters` is false, both are sorted
// row-wise lexicographically before string compare. Column names are
// compared case-insensitively.
function compareResults(
  expected: ExecOutcome,
  actual: ExecOutcome,
  orderMatters: boolean,
): { equal: boolean; reason?: string } {
  const ec = expected.columns.map((c) => c.toLowerCase());
  const ac = actual.columns.map((c) => c.toLowerCase());
  if (ec.length !== ac.length) {
    return { equal: false, reason: `Expected ${ec.length} column(s), got ${ac.length}` };
  }
  for (let i = 0; i < ec.length; i++) {
    if (ec[i] !== ac[i]) {
      return { equal: false, reason: `Column ${i + 1}: expected "${expected.columns[i]}", got "${actual.columns[i]}"` };
    }
  }
  if (expected.rows.length !== actual.rows.length) {
    return { equal: false, reason: `Expected ${expected.rows.length} row(s), got ${actual.rows.length}` };
  }
  const norm = (rows: unknown[][]) =>
    rows.map((r) =>
      r.map((v) => (v === null || v === undefined ? "\0NULL" : String(v))).join("\u0001"),
    );
  let e = norm(expected.rows);
  let a = norm(actual.rows);
  if (!orderMatters) {
    e = [...e].sort();
    a = [...a].sort();
  }
  for (let i = 0; i < e.length; i++) {
    if (e[i] !== a[i]) {
      return { equal: false, reason: `Row ${i + 1} mismatch` };
    }
  }
  return { equal: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond<SubmitResult>({ ok: false, error: "Authentication required" });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return respond<SubmitResult>({ ok: false, error: "Invalid session" });
    }
    const userId = userData.user.id;

    const rawBody = await req.text();
    const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};
    const source_code: string = body.source_code ?? "";
    const language: string = body.language ?? "sql";
    const language_id: number = body.language_id ?? 82;
    const problem_slug: string = body.problem_slug ?? "";
    const schema: string = body.schema ?? "";
    const seed: string = body.seed ?? "";
    const referenceQuery: string = body.reference_query ?? "";
    const orderMatters: boolean = !!body.order_matters;
    const contest_slug: string | undefined = body.contest_slug;

    // Layer 5 — reject unsigned / tampered / replayed contest SQL submissions.
    if (contest_slug && typeof contest_slug === "string") {
      const signed = readSignedHeaders(req);
      if (!signed) {
        return respond<SubmitResult>({ ok: false, error: "Missing contest session signature" });
      }
      const verify = await verifySignedRequest(req, rawBody);
      if (!verify.ok) {
        try {
          if (SUPABASE_SERVICE_ROLE_KEY) {
            const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { data: sess } = await admin
              .from("contest_sessions")
              .select("id, contest_id, user_id")
              .eq("id", signed.sessionId)
              .maybeSingle();
            if (sess) {
              await admin.from("contest_violations").insert({
                contest_id: sess.contest_id,
                user_id: sess.user_id,
                session_id: sess.id,
                type: "signature_invalid",
                severity: "critical",
                meta: { reason: verify.reason, surface: "submit-sql" },
              });
            }
          }
        } catch { /* noop */ }
        return respond<SubmitResult>({ ok: false, error: `Invalid signature: ${verify.reason}` });
      }
    }

    if (!source_code.trim() || !referenceQuery.trim() || !problem_slug) {
      return respond<SubmitResult>({
        ok: false,
        error: "Missing source_code, reference_query, or problem_slug",
      });
    }

    // Server-side contest gate (defense in depth) — also enforces side-camera
    // requirement via validate_contest_submission.
    if (contest_slug && typeof contest_slug === "string") {
      try {
        const { data: contestRow } = await supabase
          .from("contests")
          .select("id")
          .eq("slug", contest_slug)
          .maybeSingle();
        if (contestRow?.id) {
          const { data: check, error: vErr } = await supabase.rpc(
            "validate_contest_submission",
            { _contest_id: contestRow.id, _problem_slug: problem_slug },
          );
          if (vErr) {
            return respond<SubmitResult>({
              ok: false,
              error: `Contest validation failed: ${vErr.message}`,
            });
          }
          const v = check as { ok: boolean; message?: string; code?: string } | null;
          if (v && !v.ok) {
            return respond<SubmitResult>({
              ok: false,
              error: v.message ?? "Contest submission blocked",
            });
          }
        }
      } catch (e) {
        console.warn("submit-sql contest validation error", e);
      }
    }

    const sqlMod = await getSQL();

    // Compute expected once
    let expected: ExecOutcome;
    try {
      expected = execQuery(sqlMod, schema, seed, referenceQuery);
    } catch (err) {
      return respond<SubmitResult>({
        ok: false,
        error: `Reference query failed: ${(err as Error).message}`,
      });
    }

    let actual: ExecOutcome | null = null;
    let runErr: string | null = null;
    try {
      actual = execQuery(sqlMod, schema, seed, source_code);
    } catch (err) {
      runErr = (err as Error).message ?? "SQL error";
    }

    let verdict = "Accepted";
    let passed = 1;
    let stderr: string | null = null;
    let failing_case: Record<string, unknown> | null = null;
    const expectedStdout = formatRows(expected.columns, expected.rows);

    let actualStdout = "";
    let runStatus = "successful";
    let statusLabel = "Accepted";
    if (runErr || !actual) {
      verdict = "Runtime Error";
      passed = 0;
      stderr = runErr ?? "Unknown SQL error";
      runStatus = "non-zero-exit-code";
      statusLabel = "Runtime Error";
      failing_case = {
        index: 0,
        input: "(seeded dataset)",
        expected: expectedStdout,
        output: "",
        error: stderr,
      };
    } else {
      actualStdout = formatRows(actual.columns, actual.rows);
      const cmp = compareResults(expected, actual, orderMatters);
      if (!cmp.equal) {
        verdict = "Wrong Answer";
        passed = 0;
        runStatus = "wrong-answer";
        statusLabel = "Wrong Answer";
        failing_case = {
          index: 0,
          input: "(seeded dataset)",
          expected: expectedStdout,
          output: actualStdout,
          error: cmp.reason,
        };
      }
    }

    const runtimeMs = Math.round(actual?.durationMs ?? 0);
    const caseResults: CaseResult[] = [
      {
        index: 0,
        passed: passed === 1,
        runStatus,
        status_label: statusLabel,
        time_ms: runtimeMs,
        memory_kb: 0,
        input: "(seeded dataset)",
        expected: expectedStdout,
        stdout: actualStdout,
        stderr: stderr ?? "",
        raw: {
          engine: "sqlite",
          rowsAffected: actual?.rows.length ?? 0,
          durationMs: actual?.durationMs ?? 0,
          query: source_code.slice(0, 4000),
          error: runErr ?? undefined,
        },
      },
    ];

    const { data: insertData, error: insertErr } = await supabase
      .from("code_submissions")
      .insert({
        user_id: userId,
        problem_slug,
        language,
        language_id,
        source_code,
        verdict,
        runtime_ms: runtimeMs,
        memory_kb: 0,
        passed_tests: passed,
        total_tests: 1,
        failing_case,
        stderr,
        is_submission: true,
      })
      .select()
      .single();

    if (insertErr) console.error("Insert error:", insertErr);

    if (verdict === "Accepted") {
      const { data: priorAccepted } = await supabase
        .from("code_submissions")
        .select("id")
        .eq("user_id", userId)
        .eq("problem_slug", problem_slug)
        .eq("verdict", "Accepted")
        .limit(2);
      if (priorAccepted && priorAccepted.length === 1) {
        await supabase.rpc("award_xp", {
          _user_id: userId,
          _amount: 25,
          _source: "topic_complete",
          _description: `Solved SQL problem: ${problem_slug}`,
        });
      }
    }

    return respond<SubmitResult>({
      ok: true,
      data: {
        verdict,
        passed,
        total: 1,
        runtime_ms: runtimeMs,
        memory_kb: 0,
        failing_case,
        stderr,
        submission_id: insertData?.id ?? null,
        raw_fermion: caseResults[0].raw,
        case_results: caseResults,
        limits: { language: "SQLite", cpu_ms: 2000, wall_ms: 4000, memory_kb: 131_072 },
      },
    });
  } catch (err) {
    console.error("submit-sql error:", err);
    return respond<SubmitResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics: { error_stage: "unknown" },
    });
  }
});
