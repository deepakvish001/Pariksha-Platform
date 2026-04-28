// Run user code against custom stdin via Fermion Online Compiler (RapidAPI).
// Translates Fermion's batch submit + poll API to the existing RunResult shape
// so the frontend stays unchanged.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
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

interface RunResult {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  time: number | null;
  memory: number | null;
  raw_fermion?: FermionRawDebug;
}

interface Diagnostics {
  error_stage?: "config" | "validation" | "submit" | "poll" | "unknown";
  requested_url?: string;
  judge0_status?: number; // kept for frontend compat
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

// --- Base64URL helpers ---
function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const std = btoa(bin);
  return std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64UrlEncode(s: string): string {
  return bytesToB64Url(new TextEncoder().encode(s ?? ""));
}
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

// Map Judge0 language IDs (frontend) -> Fermion language enum
function judge0ToFermion(id: number): string | null {
  switch (id) {
    case 71: return "Python";        // Python 3
    case 70: return "Python";        // Python 2 fallback
    case 54: return "Cpp";           // C++ (GCC 9.2)
    case 76: return "Cpp";
    case 62: return "Java";
    case 63: return "NodeJs";        // JS (Node)
    case 74: return "NodeJs";        // TS -> run as JS (Fermion has no TS)
    case 50: return "C";             // C
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
function runConfigFor(language: string): RuntimeConfig {
  const cfg = RUNTIME_DEFAULTS[language] ?? RUNTIME_DEFAULTS.Python;
  return {
    cpuMs: Math.min(cfg.cpuMs, FERMION_SAFE_MAX.cpuMs),
    wallMs: Math.min(cfg.wallMs, FERMION_SAFE_MAX.wallMs),
    memKb: Math.min(cfg.memKb, FERMION_SAFE_MAX.memKb),
  };
}

// Map Fermion runStatus -> Judge0-like status object the frontend already understands
function fermionStatusToJudge0(runStatus: string | undefined): { id: number; description: string } {
  switch (runStatus) {
    case "successful":            return { id: 3,  description: "Accepted" };
    case "wrong-answer":          return { id: 4,  description: "Wrong Answer" };
    case "time-limit-exceeded":   return { id: 5,  description: "Time Limit Exceeded" };
    case "compilation-error":     return { id: 6,  description: "Compilation Error" };
    case "non-zero-exit-code":    return { id: 7,  description: "Runtime Error (NZEC)" };
    case "died-sigsev":           return { id: 11, description: "Runtime Error (SIGSEGV)" };
    case "died-sigxfsz":          return { id: 9,  description: "Runtime Error (SIGXFSZ)" };
    case "died-sigfpe":           return { id: 8,  description: "Runtime Error (SIGFPE)" };
    case "died-sigabrt":          return { id: 10, description: "Runtime Error (SIGABRT)" };
    case "internal-isolate-error":return { id: 13, description: "Internal Error" };
    default:                      return { id: 14, description: "Exec Format Error" };
  }
}

interface FermionExecOutcome {
  runStatus: string;
  stdout: string;
  stderr: string;
  timeMs: number | null;
  memoryKb: number | null;
  raw: FermionRawDebug;
}

interface FermionRawDebug {
  codingTaskStatus?: string;
  runStatus?: string;
  runResult?: unknown;
  stdout?: string;
  stderr?: string;
}

async function submitToFermion(payload: {
  language: string;
  source: string;
  stdin?: string;
  cpuMs: number;
  wallMs: number;
  memKb: number;
}): Promise<string> {
  const body = {
    data: [
      {
        data: {
          entries: [
            {
              language: payload.language,
              sourceCodeAsBase64UrlEncoded: b64UrlEncode(payload.source),
              runConfig: {
                customMatcherToUseForExpectedOutput: "ExactMatch",
                expectedOutputAsBase64UrlEncoded: "",
                stdinStringAsBase64UrlEncoded: payload.stdin ? b64UrlEncode(payload.stdin) : "",
                cpuTimeLimitInMilliseconds: payload.cpuMs,
                wallTimeLimitInMilliseconds: payload.wallMs,
                memoryLimitInKilobyte: payload.memKb,
              },
            },
          ],
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
      error_stage: "submit",
      requested_url: SUBMIT_URL,
      judge0_status: res.status,
      judge0_body: text,
    });
  }
  let json: any;
  try { json = JSON.parse(text); } catch {
    throw new FermionError("Fermion submit returned non-JSON", {
      error_stage: "submit", requested_url: SUBMIT_URL, judge0_body: text,
    });
  }
  // Response: { output: { status, data: { taskIds: [...] } } } per item; root is array
  const root = Array.isArray(json) ? json[0] : json;
  const taskIds: unknown =
    root?.output?.data?.taskIds ??
    root?.data?.taskIds ??
    root?.output?.taskIds;
  const taskId = Array.isArray(taskIds) ? taskIds[0] : undefined;
  if (!taskId || typeof taskId !== "string") {
    const errMsg = root?.output?.errorMessage || root?.errorMessage;
    throw new FermionError(
      `Fermion submit: no taskId in response${errMsg ? ` — ${errMsg}` : ""}`,
      { error_stage: "submit", requested_url: SUBMIT_URL, judge0_body: text.slice(0, 500) },
    );
  }
  return taskId;
}

async function pollFermion(taskId: string): Promise<FermionExecOutcome> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const res = await fetch(RESULT_URL, {
      method: "POST",
      headers: fermionHeaders(),
      body: JSON.stringify({ data: [{ data: { taskUniqueIds: [taskId] } }] }),
    });
    if (!res.ok) continue;
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { continue; }

    // Response: array of { output: { data: { tasks: [{ taskUniqueId, codingTaskStatus, runResult }] } } }
    const root = Array.isArray(json) ? json[0] : json;
    const entries: any[] =
      root?.output?.data?.tasks ??
      root?.output?.data?.results ??
      root?.output?.tasks ??
      root?.output?.results ??
      root?.data?.tasks ??
      root?.data?.results ??
      [];
    const task = entries.find((e: any) => e?.taskUniqueId === taskId) ?? entries[0];
    if (!task) continue;
    const taskStatus = task?.codingTaskStatus ?? task?.taskStatus ?? task?.status;
    if (taskStatus !== "Finished") continue;

    const runResult = task?.runResult ?? task?.executionResult ?? task?.result ?? {};
    const prd = runResult?.programRunData ?? {};
    return {
      runStatus: runResult?.runStatus ?? "unknown",
      stdout: b64UrlDecode(prd?.stdoutBase64UrlEncoded),
      stderr:
        b64UrlDecode(prd?.stderrBase64UrlEncoded) ||
        b64UrlDecode(runResult?.compilerOutputAfterCompilationBase64UrlEncoded),
      timeMs:
        typeof prd?.cpuTimeUsedInMilliseconds === "number" ? prd.cpuTimeUsedInMilliseconds :
        typeof prd?.wallTimeUsedInMilliseconds === "number" ? prd.wallTimeUsedInMilliseconds : null,
      memoryKb: typeof prd?.memoryUsedInKilobyte === "number" ? prd.memoryUsedInKilobyte : null,
    };
  }
  throw new FermionError("Fermion polling timed out", {
    error_stage: "poll", requested_url: RESULT_URL,
  });
}

async function runOnFermion(payload: {
  source_code: string;
  language: string;
  stdin?: string;
  cpu_ms: number;
  wall_ms: number;
  mem_kb: number;
}): Promise<RunResult> {
  const taskId = await submitToFermion({
    language: payload.language,
    source: payload.source_code,
    stdin: payload.stdin,
    cpuMs: payload.cpu_ms,
    wallMs: payload.wall_ms,
    memKb: payload.mem_kb,
  });
  const outcome = await pollFermion(taskId);
  // For free-form Run, we do not have an expected output. Fermion may label
  // a successful execution as "wrong-answer" because expected output is empty.
  const runStatus = outcome.runStatus === "wrong-answer" ? "successful" : outcome.runStatus;
  const status = fermionStatusToJudge0(runStatus);
  const isCompileErr = runStatus === "compilation-error";
  return {
    status,
    stdout: outcome.stdout,
    stderr: outcome.stderr,
    compile_output: isCompileErr ? (outcome.stderr || "Compilation failed") : "",
    message: runStatus,
    time: outcome.timeMs != null ? outcome.timeMs / 1000 : null,
    memory: outcome.memoryKb,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!FERMION_KEY) {
      return respond<RunResult>({
        ok: false,
        error: "Code execution is not configured. Add FERMION_RAPIDAPI_KEY in Lovable Cloud → Backend → Secrets.",
        diagnostics: { error_stage: "config" },
      });
    }

    const body = await req.json();
    const { source_code, language_id, stdin, problem_slug, language } = body ?? {};

    if (typeof source_code !== "string" || source_code.length === 0) {
      return respond<RunResult>({ ok: false, error: "source_code required", diagnostics: { error_stage: "validation" } });
    }
    if (source_code.length > 50000) {
      return respond<RunResult>({ ok: false, error: "source_code too large (50KB max)", diagnostics: { error_stage: "validation" } });
    }
    if (typeof language_id !== "number") {
      return respond<RunResult>({ ok: false, error: "language_id required", diagnostics: { error_stage: "validation" } });
    }
    const fermionLang = judge0ToFermion(language_id);
    if (!fermionLang) {
      return respond<RunResult>({
        ok: false,
        error: `Language not supported by Fermion (language_id=${language_id})`,
        diagnostics: { error_stage: "validation" },
      });
    }

    const result = await runOnFermion({
      source_code,
      language: fermionLang,
      stdin: typeof stdin === "string" ? stdin : "",
      cpu_ms: 3000,
      wall_ms: 6000,
      mem_kb: 262144,
    });

    // Best-effort log to code_runs
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && typeof problem_slug === "string" && typeof language === "string") {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("code_runs").insert({
            user_id: userData.user.id,
            problem_slug,
            language,
            language_id,
            source_code,
            stdin: typeof stdin === "string" ? stdin : "",
            stdout: result.stdout || null,
            stderr: result.stderr || null,
            compile_output: result.compile_output || null,
            status: result.status?.description ?? null,
            status_id: result.status?.id ?? null,
            time_ms: result.time != null ? Math.round(result.time * 1000) : null,
            memory_kb: result.memory ?? null,
          });
        }
      }
    } catch (logErr) {
      console.warn("run-code: failed to log run", logErr);
    }

    return respond<RunResult>({ ok: true, data: result });
  } catch (err) {
    console.error("run-code error:", err);
    const diagnostics = err instanceof FermionError ? err.diagnostics : { error_stage: "unknown" as const };
    return respond<RunResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics,
    });
  }
});
