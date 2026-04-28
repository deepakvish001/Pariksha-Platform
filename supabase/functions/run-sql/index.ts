// Run a user's SQL query against an in-memory SQLite database seeded per
// problem. Mirrors the response shape of `run-code` so the frontend can
// render results identically (status, stdout, stderr, raw_fermion debug).
//
// Engine: sql.js (WASM SQLite), works in Deno edge runtime.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import initSqlJs from "npm:sql.js@1.10.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

interface RunResult {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  time: number | null;
  memory: number | null;
  raw_fermion?: SqlDebug;
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
async function getSQL() {
  if (SQL) return SQL;
  // Locate the wasm file inside the published package on the npm CDN that
  // npm: specifiers resolve to.
  SQL = await initSqlJs({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`,
  });
  return SQL!;
}

// Format result rows as a stable, comparable string. Header line uses
// columns from the first SELECT; rows are tab-joined; NULL renders as the
// literal string "NULL". Numeric values keep their JS string form.
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

interface ExecOutcome {
  columns: string[];
  rows: unknown[][];
  durationMs: number;
}

async function execAgainstSeededDb(
  schema: string,
  seed: string,
  userQuery: string,
): Promise<ExecOutcome> {
  const sqlMod = await getSQL();
  const db = new sqlMod.Database();
  try {
    if (schema?.trim()) db.exec(schema);
    if (seed?.trim()) db.exec(seed);
    const start = performance.now();
    const res = db.exec(userQuery);
    const durationMs = performance.now() - start;
    // sql.js returns an array, one entry per statement that produced rows.
    // For comparison purposes we use the LAST statement that returned rows
    // (most queries are a single SELECT). If nothing returned rows, we
    // emit an empty result-set with zero columns.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond<RunResult>({ ok: false, error: "Authentication required" });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return respond<RunResult>({ ok: false, error: "Invalid session" });
    }

    const body = await req.json().catch(() => ({}));
    const userQuery: string = body.source_code ?? "";
    const schema: string = body.schema ?? "";
    const seed: string = body.seed ?? "";

    if (!userQuery.trim()) {
      return respond<RunResult>({
        ok: false,
        error: "Empty query — write some SQL before running.",
      });
    }

    try {
      const outcome = await execAgainstSeededDb(schema, seed, userQuery);
      const stdout = formatRows(outcome.columns, outcome.rows);
      return respond<RunResult>({
        ok: true,
        data: {
          status: { id: 3, description: "Accepted" },
          stdout,
          stderr: "",
          compile_output: "",
          message: `${outcome.rows.length} row(s) returned`,
          time: outcome.durationMs / 1000,
          memory: null,
          raw_fermion: {
            engine: "sqlite",
            rowsAffected: outcome.rows.length,
            durationMs: outcome.durationMs,
            query: userQuery.slice(0, 4000),
          },
        },
      });
    } catch (err) {
      const message = (err as Error).message ?? "SQL error";
      return respond<RunResult>({
        ok: true,
        data: {
          status: { id: 6, description: "Compilation Error" },
          stdout: "",
          stderr: message,
          compile_output: message,
          message,
          time: null,
          memory: null,
          raw_fermion: {
            engine: "sqlite",
            error: message,
            query: userQuery.slice(0, 4000),
          },
        },
      });
    }
  } catch (err) {
    return respond<RunResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics: { error_stage: "unknown" },
    });
  }
});
