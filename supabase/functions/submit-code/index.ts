// Submit user code against ALL hidden test cases via Fermion Online Compiler.
// Uses Fermion's built-in ExactMatch matcher per case, aggregates verdict,
// stores the submission, and awards XP on first AC.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FERMION_KEY = Deno.env.get("FERMION_RAPIDAPI_KEY") ?? "";

const FERMION_HOST = "fermion-online-compiler.p.rapidapi.com";
const FERMION_BASE = `https://${FERMION_HOST}/public`;
const SUBMIT_URL = `${FERMION_BASE}/request-dsa-code-execution-batch`;
const RESULT_URL = `${FERMION_BASE}/get-dsa-code-execution-result-batch`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  raw: FermionRawDebug;
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
  raw_fermion?: FermionRawDebug | null;
  case_results?: CaseResult[];
  limits?: { language: string; cpu_ms: number; wall_ms: number; memory_kb: number };
}

interface Diagnostics {
  error_stage?: "config" | "auth" | "validation" | "submit" | "poll" | "unknown";
  requested_url?: string;
  judge0_status?: number;
  judge0_body?: string;
  raw_fermion_response?: unknown;
}

interface FunctionResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  diagnostics?: Diagnostics;
}

class FermionError extends Error {
  diagnostics: Diagnostics;
  constructor(message: string, diagnostics: Diagnostics) {
    super(message);
    this.diagnostics = diagnostics;
  }
}

function respond<T>(payload: FunctionResponse<T>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fermionHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-rapidapi-host": FERMION_HOST,
    "x-rapidapi-key": FERMION_KEY,
  };
}

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64UrlEncode = (s: string) => bytesToB64Url(new TextEncoder().encode(s ?? ""));
function b64UrlDecode(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function judge0ToFermion(id: number): string | null {
  switch (id) {
    case 71: case 70: return "Python";
    case 54: case 76: return "Cpp";
    case 62: return "Java";
    case 63: case 74: return "NodeJs";
    case 50: return "C";
    case 60: return "Go";
    default: return null;
  }
}

interface RuntimeConfig { cpuMs: number; wallMs: number; memKb: number }
const FERMION_SAFE_MAX: RuntimeConfig = { cpuMs: 5000, wallMs: 6500, memKb: 512000 };
const RUNTIME_DEFAULTS: Record<string, RuntimeConfig> = {
  C: { cpuMs: 2000, wallMs: 5000, memKb: 512000 },
  Cpp: { cpuMs: 2000, wallMs: 5000, memKb: 512000 },
  Java: { cpuMs: 3000, wallMs: 6000, memKb: 512000 },
  Python: { cpuMs: 3000, wallMs: 6000, memKb: 262144 },
  NodeJs: { cpuMs: 3000, wallMs: 6000, memKb: 262144 },
  Go: { cpuMs: 3000, wallMs: 6000, memKb: 262144 },
};
function runConfigFor(language: string, overrides?: { cpuSec?: number; memKb?: number }): RuntimeConfig {
  const cfg = RUNTIME_DEFAULTS[language] ?? RUNTIME_DEFAULTS.Python;
  const requestedCpuMs = typeof overrides?.cpuSec === "number" ? overrides.cpuSec * 1000 : cfg.cpuMs;
  const requestedMemKb = typeof overrides?.memKb === "number" ? overrides.memKb : cfg.memKb;
  const cpuMs = Math.min(requestedCpuMs, cfg.cpuMs, FERMION_SAFE_MAX.cpuMs);
  return {
    cpuMs,
    wallMs: Math.min(Math.max(cfg.wallMs, cpuMs), FERMION_SAFE_MAX.wallMs),
    memKb: Math.min(requestedMemKb, cfg.memKb, FERMION_SAFE_MAX.memKb),
  };
}

interface TestCase { input: string; expected: string }
interface CaseOutcome {
  runStatus: string;
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number;
  raw: FermionRawDebug;
}

interface FermionRawDebug {
  codingTaskStatus?: string;
  runStatus?: string;
  runResult?: unknown;
  stdout?: string;
  stderr?: string;
}

async function submitBatch(language: string, source: string, tests: TestCase[], cpuMs: number, wallMs: number, memKb: number): Promise<string[]> {
  // All N test cases go inside ONE outer item, as `entries: [...]`. Response returns
  // taskIds in the same order as entries.
  const body = {
    data: [
      {
        data: {
          entries: tests.map((t) => ({
            language,
            sourceCodeAsBase64UrlEncoded: b64UrlEncode(source),
            runConfig: {
              customMatcherToUseForExpectedOutput: "ExactMatch",
              expectedOutputAsBase64UrlEncoded: b64UrlEncode(t.expected ?? ""),
              stdinStringAsBase64UrlEncoded: b64UrlEncode(t.input ?? ""),
              cpuTimeLimitInMilliseconds: cpuMs,
              wallTimeLimitInMilliseconds: wallMs,
              memoryLimitInKilobyte: memKb,
            },
          })),
        },
      },
    ],
  };

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: fermionHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new FermionError(`Fermion submit failed (${res.status}): ${text.slice(0, 300)}`, {
      error_stage: "submit", requested_url: SUBMIT_URL, judge0_status: res.status, judge0_body: text,
    });
  }
  let json: any;
  try { json = JSON.parse(text); } catch {
    throw new FermionError("Fermion submit returned non-JSON", { error_stage: "submit", requested_url: SUBMIT_URL, judge0_body: text });
  }
  const root = Array.isArray(json) ? json[0] : json;
  const ids: unknown =
    root?.output?.data?.taskIds ??
    root?.data?.taskIds ??
    root?.output?.taskIds;
  const taskIds = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
  if (taskIds.length !== tests.length) {
    const errMsg = root?.output?.errorMessage || root?.errorMessage;
    throw new FermionError(
      `Fermion submit: expected ${tests.length} task IDs, got ${taskIds.length}${errMsg ? ` — ${errMsg}` : ""}`,
      { error_stage: "submit", requested_url: SUBMIT_URL, judge0_body: text.slice(0, 500), raw_fermion_response: root },
    );
  }
  return taskIds;
}

async function pollBatch(taskIds: string[]): Promise<Map<string, CaseOutcome>> {
  const remaining = new Set(taskIds);
  const out = new Map<string, CaseOutcome>();

  for (let attempt = 0; attempt < 60 && remaining.size > 0; attempt++) {
    await new Promise((r) => setTimeout(r, 800));
    const res = await fetch(RESULT_URL, {
      method: "POST",
      headers: fermionHeaders(),
      body: JSON.stringify({ data: [{ data: { taskUniqueIds: Array.from(remaining) } }] }),
    });
    if (!res.ok) continue;
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { continue; }

    const root = Array.isArray(json) ? json[0] : json;
    const entries: any[] =
      root?.output?.data?.tasks ??
      root?.output?.data?.results ??
      root?.output?.tasks ??
      root?.output?.results ??
      root?.data?.tasks ??
      root?.data?.results ??
      [];

    for (const task of entries) {
      const taskId = task?.taskUniqueId;
      if (!taskId || !remaining.has(taskId)) continue;
      const taskStatus = task?.codingTaskStatus ?? task?.taskStatus ?? task?.status;
      if (taskStatus !== "Finished") continue;
      const runResult = task?.runResult ?? task?.executionResult ?? task?.result ?? {};
      const prd = runResult?.programRunData ?? {};
      const stdout = b64UrlDecode(prd?.stdoutBase64UrlEncoded);
      const stderr =
        b64UrlDecode(prd?.stderrBase64UrlEncoded) ||
        b64UrlDecode(runResult?.compilerOutputAfterCompilationBase64UrlEncoded);
      out.set(taskId, {
        runStatus: runResult?.runStatus ?? "unknown",
        stdout,
        stderr,
        timeMs:
          typeof prd?.cpuTimeUsedInMilliseconds === "number" ? prd.cpuTimeUsedInMilliseconds :
          typeof prd?.wallTimeUsedInMilliseconds === "number" ? prd.wallTimeUsedInMilliseconds : 0,
        memoryKb: typeof prd?.memoryUsedInKilobyte === "number" ? prd.memoryUsedInKilobyte : 0,
        raw: { codingTaskStatus: taskStatus, runStatus: runResult?.runStatus ?? "unknown", runResult, stdout, stderr },
      });
      remaining.delete(taskId);
    }
  }

  if (remaining.size > 0) {
    throw new FermionError(`Fermion polling timed out for ${remaining.size} task(s)`, {
      error_stage: "poll", requested_url: RESULT_URL,
    });
  }
  return out;
}

const normalize = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trimEnd();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!FERMION_KEY) {
      return respond<SubmitResult>({
        ok: false,
        error: "Code execution is not configured. Add FERMION_RAPIDAPI_KEY in Lovable Cloud → Backend → Secrets.",
        diagnostics: { error_stage: "config" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond<SubmitResult>({ ok: false, error: "Unauthorized", diagnostics: { error_stage: "auth" } });
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return respond<SubmitResult>({ ok: false, error: "Unauthorized", diagnostics: { error_stage: "auth" } });
    const userId = userData.user.id;

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { source_code, language, language_id, problem_slug, tests, cpu_time_limit, memory_limit, contest_slug } = body ?? {};

    if (!source_code || typeof source_code !== "string" || source_code.length > 50000)
      return respond<SubmitResult>({ ok: false, error: "Invalid source_code", diagnostics: { error_stage: "validation" } });
    if (typeof language_id !== "number" || typeof language !== "string")
      return respond<SubmitResult>({ ok: false, error: "Invalid language", diagnostics: { error_stage: "validation" } });
    if (!problem_slug)
      return respond<SubmitResult>({ ok: false, error: "problem_slug required", diagnostics: { error_stage: "validation" } });

    // Layer 5 — when this is a contest submission, require a valid signed
    // transport envelope. Rejects replays, tampered payloads, and any client
    // that bypassed the proctored player.
    if (contest_slug && typeof contest_slug === "string") {
      const signed = readSignedHeaders(req);
      if (!signed) {
        return respond<SubmitResult>({ ok: false, error: "Missing contest session signature", diagnostics: { error_stage: "signature_missing" } });
      }
      const verify = await verifySignedRequest(req, rawBody);
      if (!verify.ok) {
        // Best-effort: record a critical signature_invalid violation so the
        // violation engine can terminate the session on the next sweep.
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
                meta: { reason: verify.reason, surface: "submit-code" },
              });
            }
          }
        } catch { /* noop */ }
        return respond<SubmitResult>({ ok: false, error: `Invalid signature: ${verify.reason}`, diagnostics: { error_stage: "signature_invalid" } });
      }
    }

    // Server-side contest gate (defense in depth — the client also calls this
    // RPC, but a malicious client can bypass that check). Looks up the contest
    // by slug and refuses the submission if the user has no live session,
    // stale heartbeat, fingerprint mismatch, or paste-only typing pattern.
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
              diagnostics: { error_stage: "contest_validation" },
            });
          }
          const v = check as { ok: boolean; message?: string; code?: string } | null;
          if (v && !v.ok) {
            return respond<SubmitResult>({
              ok: false,
              error: v.message ?? "Contest submission blocked",
              diagnostics: { error_stage: "contest_validation" },
            });
          }
        }
      } catch (e) {
        return respond<SubmitResult>({
          ok: false,
          error: `Contest validation error: ${(e as Error).message}`,
          diagnostics: { error_stage: "contest_validation" },
        });
      }
    }


    // Prefer DB-stored hidden tests (zero-trust): fetch via service role and
    // override any client-supplied tests when the problem exists in DB.
    let effectiveTests: TestCase[] = Array.isArray(tests) ? (tests as TestCase[]) : [];
    if (SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: dbTests } = await admin
          .from("coding_problem_tests")
          .select("input,expected,ord")
          .eq("problem_slug", problem_slug)
          .eq("kind", "hidden")
          .order("ord", { ascending: true });
        if (dbTests && dbTests.length > 0) {
          effectiveTests = dbTests.map((t: any) => ({ input: t.input ?? "", expected: t.expected ?? "" }));
        }
      } catch (_) {
        // Fallback to client tests on DB error.
      }
    }

    if (effectiveTests.length === 0)
      return respond<SubmitResult>({ ok: false, error: "tests required", diagnostics: { error_stage: "validation" } });
    if (effectiveTests.length > 30)
      return respond<SubmitResult>({ ok: false, error: "Too many tests", diagnostics: { error_stage: "validation" } });

    const fermionLang = judge0ToFermion(language_id);
    if (!fermionLang)
      return respond<SubmitResult>({ ok: false, error: `Language not supported by Fermion (language_id=${language_id})`, diagnostics: { error_stage: "validation" } });

    const limits = runConfigFor(fermionLang, { cpuSec: cpu_time_limit, memKb: memory_limit });
    const { cpuMs, wallMs, memKb } = limits;

    // Submit all cases as a single batch, then poll.
    const taskIds = await submitBatch(fermionLang, source_code, effectiveTests, cpuMs, wallMs, memKb);
    const results = await pollBatch(taskIds);

    let passed = 0;
    let verdict: string = "Accepted";
    let failingCase: Record<string, unknown> | null = null;
    let totalTimeMs = 0;
    let maxMemory = 0;
    let stderrCombined = "";
    let rawFermion: FermionRawDebug | null = null;
    const caseResults: CaseResult[] = [];
    let firstFailureSeen = false;

    const labelFor = (s: string): string => {
      switch (s) {
        case "successful": return "Accepted";
        case "wrong-answer": return "Wrong Answer";
        case "time-limit-exceeded": return "Time Limit Exceeded";
        case "compilation-error": return "Compile Error";
        case "non-zero-exit-code": return "Runtime Error (NZEC)";
        case "died-sigsev": return "Runtime Error (SIGSEGV)";
        case "died-sigxfsz": return "Runtime Error (SIGXFSZ)";
        case "died-sigfpe": return "Runtime Error (SIGFPE)";
        case "died-sigabrt": return "Runtime Error (SIGABRT)";
        case "internal-isolate-error": return "Internal Error";
        default: return s || "Unknown";
      }
    };

    for (let i = 0; i < effectiveTests.length; i++) {
      const t = effectiveTests[i];
      const r = results.get(taskIds[i]);
      if (!r) {
        if (!firstFailureSeen) { verdict = "Internal Error"; stderrCombined = "Missing result for test case"; firstFailureSeen = true; }
        caseResults.push({
          index: i, passed: false, runStatus: "missing", status_label: "Missing",
          time_ms: 0, memory_kb: 0, input: t.input, expected: t.expected, stdout: "", stderr: "Missing result", raw: {},
        });
        continue;
      }
      totalTimeMs += r.timeMs;
      if (r.memoryKb > maxMemory) maxMemory = r.memoryKb;

      // Determine pass/fail per case (using normalization for output comparison)
      let casePassed = false;
      let caseFailureReason = "";
      switch (r.runStatus) {
        case "compilation-error":
          caseFailureReason = "Compile Error";
          if (!firstFailureSeen) {
            verdict = "Compile Error";
            stderrCombined = r.stderr || "Compilation failed";
            failingCase = { index: i, input: t.input, expected: t.expected, output: "", error: stderrCombined };
            rawFermion = r.raw;
            firstFailureSeen = true;
          }
          break;
        case "time-limit-exceeded":
          caseFailureReason = "TLE";
          if (!firstFailureSeen) {
            verdict = "Time Limit Exceeded";
            failingCase = { index: i, input: t.input, expected: t.expected, output: r.stdout };
            rawFermion = r.raw;
            firstFailureSeen = true;
          }
          break;
        case "non-zero-exit-code":
        case "died-sigsev":
        case "died-sigxfsz":
        case "died-sigfpe":
        case "died-sigabrt":
          caseFailureReason = "Runtime Error";
          if (!firstFailureSeen) {
            verdict = "Runtime Error";
            stderrCombined = r.stderr || r.runStatus;
            failingCase = { index: i, input: t.input, expected: t.expected, output: r.stdout, error: stderrCombined };
            rawFermion = r.raw;
            firstFailureSeen = true;
          }
          break;
        case "internal-isolate-error":
        case "unknown":
          caseFailureReason = "Internal Error";
          if (!firstFailureSeen) {
            verdict = "Internal Error";
            stderrCombined = r.stderr || "Judge internal error";
            rawFermion = r.raw;
            firstFailureSeen = true;
          }
          break;
        case "wrong-answer":
        case "successful":
        default: {
          const got = normalize(r.stdout);
          const want = normalize(t.expected ?? "");
          if (got === want) { casePassed = true; passed++; }
          else {
            caseFailureReason = "Wrong Answer";
            if (!firstFailureSeen) {
              verdict = "Wrong Answer";
              failingCase = { index: i, input: t.input, expected: t.expected, output: r.stdout };
              rawFermion = r.raw;
              firstFailureSeen = true;
            }
          }
          break;
        }
      }

      caseResults.push({
        index: i,
        passed: casePassed,
        runStatus: r.runStatus,
        status_label: casePassed ? "Accepted" : (caseFailureReason || labelFor(r.runStatus)),
        time_ms: Math.round(r.timeMs),
        memory_kb: r.memoryKb,
        input: t.input,
        expected: t.expected,
        stdout: r.stdout,
        stderr: r.stderr,
        raw: r.raw,
      });
    }

    const runtimeMs = Math.round(totalTimeMs);

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
        memory_kb: maxMemory,
        passed_tests: passed,
        total_tests: effectiveTests.length,
        failing_case: failingCase,
        stderr: stderrCombined || null,
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
          _description: `Solved coding problem: ${problem_slug}`,
        });
      }
    }

    return respond<SubmitResult>({
      ok: true,
      data: {
        verdict,
        passed,
        total: effectiveTests.length,
        runtime_ms: runtimeMs,
        memory_kb: maxMemory,
        failing_case: failingCase,
        stderr: stderrCombined || null,
        submission_id: insertData?.id ?? null,
        raw_fermion: rawFermion,
        case_results: caseResults,
        limits: { language: fermionLang, cpu_ms: cpuMs, wall_ms: wallMs, memory_kb: memKb },
      },
    });
  } catch (err) {
    console.error("submit-code error:", err);
    const diagnostics = err instanceof FermionError ? err.diagnostics : { error_stage: "unknown" as const };
    return respond<SubmitResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics,
    });
  }
});
