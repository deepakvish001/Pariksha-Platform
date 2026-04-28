// Submit user code against ALL hidden test cases, compute verdict, store result
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JUDGE0_URL = Deno.env.get("JUDGE0_URL")?.replace(/\/$/, "") ?? "";
const JUDGE0_AUTH_HEADER = Deno.env.get("JUDGE0_AUTH_HEADER") ?? "X-Auth-Token";
const JUDGE0_AUTH_TOKEN = Deno.env.get("JUDGE0_AUTH_TOKEN") ?? "";
const JUDGE0_EXTRA_HEADER_NAME = Deno.env.get("JUDGE0_EXTRA_HEADER_NAME") ?? "";
const JUDGE0_EXTRA_HEADER_VALUE = Deno.env.get("JUDGE0_EXTRA_HEADER_VALUE") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

interface SubmitResult {
  verdict: string;
  passed: number;
  total: number;
  runtime_ms: number;
  memory_kb: number;
  failing_case: Record<string, unknown> | null;
  stderr: string | null;
  submission_id: string | null;
}

interface Diagnostics {
  error_stage?: "config" | "auth" | "validation" | "submit" | "poll" | "unknown";
  requested_url?: string;
  judge0_status?: number;
  judge0_body?: string;
}

interface FunctionResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  diagnostics?: Diagnostics;
}

class Judge0RequestError extends Error {
  diagnostics: Diagnostics;

  constructor(message: string, diagnostics: Diagnostics) {
    super(message);
    this.name = "Judge0RequestError";
    this.diagnostics = diagnostics;
  }
}

function respond<T>(payload: FunctionResponse<T>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function judge0Headers(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUDGE0_AUTH_TOKEN) headers[JUDGE0_AUTH_HEADER] = JUDGE0_AUTH_TOKEN;
  if (JUDGE0_EXTRA_HEADER_NAME && JUDGE0_EXTRA_HEADER_VALUE) {
    headers[JUDGE0_EXTRA_HEADER_NAME] = JUDGE0_EXTRA_HEADER_VALUE;
  }
  return headers;
}

const b64encode = (s: string) => btoa(unescape(encodeURIComponent(s ?? "")));
const b64decode = (s: string | null | undefined) => {
  if (!s) return "";
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return "";
  }
};

const normalizeOutput = (s: string) =>
  s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trimEnd();

interface TestCase {
  input: string;
  expected: string;
}

async function runSingleCase(
  source_code: string,
  language_id: number,
  test: TestCase,
  cpuLimit: number,
  memLimit: number,
) {
  const submitUrl = `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`;
  const submitRes = await fetch(submitUrl, {
    method: "POST",
    headers: judge0Headers(),
    body: JSON.stringify({
      source_code: b64encode(source_code),
      language_id,
      stdin: b64encode(test.input ?? ""),
      cpu_time_limit: cpuLimit,
      memory_limit: memLimit,
    }),
  });
  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Judge0RequestError(
      `Judge0 submit failed (${submitRes.status})${errText ? `: ${errText}` : ""}`,
      {
        error_stage: "submit",
        requested_url: submitUrl,
        judge0_status: submitRes.status,
        judge0_body: errText || undefined,
      },
    );
  }
  const { token } = await submitRes.json();

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const r = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,message,time,memory`,
      { headers: judge0Headers() },
    );
    if (!r.ok) continue;
    const data = await r.json();
    if (data.status && data.status.id > 2) {
      return {
        statusId: data.status.id as number,
        statusDescription: data.status.description as string,
        stdout: b64decode(data.stdout),
        stderr: b64decode(data.stderr),
        compile: b64decode(data.compile_output),
        message: b64decode(data.message),
        time: data.time ? parseFloat(data.time) : 0,
        memory: data.memory ?? 0,
      };
    }
  }
  throw new Judge0RequestError("Polling timed out", {
    error_stage: "poll",
    requested_url: `${JUDGE0_URL}/submissions/${token}`,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!JUDGE0_URL) {
      return respond<SubmitResult>({
        ok: false,
        error: "JUDGE0_URL not configured",
        diagnostics: { error_stage: "config" },
      });
    }

    // Auth required
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond<SubmitResult>({
        ok: false,
        error: "Unauthorized",
        diagnostics: { error_stage: "auth" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return respond<SubmitResult>({
        ok: false,
        error: "Unauthorized",
        diagnostics: { error_stage: "auth" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const {
      source_code,
      language,
      language_id,
      problem_slug,
      tests,
      cpu_time_limit,
      memory_limit,
    } = body ?? {};

    if (!source_code || typeof source_code !== "string" || source_code.length > 50000) {
      return respond<SubmitResult>({
        ok: false,
        error: "Invalid source_code",
        diagnostics: { error_stage: "validation" },
      });
    }
    if (typeof language_id !== "number" || typeof language !== "string") {
      return respond<SubmitResult>({
        ok: false,
        error: "Invalid language",
        diagnostics: { error_stage: "validation" },
      });
    }
    if (!problem_slug || !Array.isArray(tests) || tests.length === 0) {
      return respond<SubmitResult>({
        ok: false,
        error: "tests required",
        diagnostics: { error_stage: "validation" },
      });
    }
    if (tests.length > 30) {
      return respond<SubmitResult>({
        ok: false,
        error: "Too many tests",
        diagnostics: { error_stage: "validation" },
      });
    }

    const cpuLimit = typeof cpu_time_limit === "number" ? Math.min(cpu_time_limit, 10) : 5;
    const memLimit = typeof memory_limit === "number" ? Math.min(memory_limit, 512000) : 256000;

    let passed = 0;
    let verdict: string = "Accepted";
    let failingCase: Record<string, unknown> | null = null;
    let totalTime = 0;
    let maxMemory = 0;
    let stderrCombined = "";

    for (let i = 0; i < tests.length; i++) {
      const t = tests[i] as TestCase;
      const result = await runSingleCase(source_code, language_id, t, cpuLimit, memLimit);
      totalTime += result.time;
      if (result.memory > maxMemory) maxMemory = result.memory;

      if (result.statusId === 6) {
        verdict = "Compile Error";
        stderrCombined = result.compile || result.stderr || "Compilation failed";
        failingCase = { index: i, input: t.input, expected: t.expected, output: "", error: stderrCombined };
        break;
      }
      if (result.statusId === 5) {
        verdict = "Time Limit Exceeded";
        failingCase = { index: i, input: t.input, expected: t.expected, output: result.stdout };
        break;
      }
      if (result.statusId >= 7 && result.statusId <= 12) {
        verdict = "Runtime Error";
        stderrCombined = result.stderr || result.message || "Runtime error";
        failingCase = { index: i, input: t.input, expected: t.expected, output: result.stdout, error: stderrCombined };
        break;
      }
      if (result.statusId === 13 || result.statusId === 14) {
        verdict = "Internal Error";
        stderrCombined = result.message || "Judge internal error";
        break;
      }
      // Accepted-ish; compare output ourselves to be safe
      const got = normalizeOutput(result.stdout);
      const want = normalizeOutput(t.expected ?? "");
      if (got !== want) {
        verdict = "Wrong Answer";
        failingCase = { index: i, input: t.input, expected: t.expected, output: result.stdout };
        break;
      }
      passed++;
    }

    const runtimeMs = Math.round(totalTime * 1000);

    // Store submission
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
        total_tests: tests.length,
        failing_case: failingCase,
        stderr: stderrCombined || null,
        is_submission: true,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
    }

    // Award XP on first AC for this problem
    if (verdict === "Accepted") {
      const { data: priorAccepted } = await supabase
        .from("code_submissions")
        .select("id")
        .eq("user_id", userId)
        .eq("problem_slug", problem_slug)
        .eq("verdict", "Accepted")
        .limit(2);
      // only first AC = exactly 1 row (the one we just inserted)
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
        total: tests.length,
        runtime_ms: runtimeMs,
        memory_kb: maxMemory,
        failing_case: failingCase,
        stderr: stderrCombined || null,
        submission_id: insertData?.id ?? null,
      },
    });
  } catch (err) {
    console.error("submit-code error:", err);
    const diagnostics = err instanceof Judge0RequestError
      ? err.diagnostics
      : { error_stage: "unknown" as const };
    return respond<SubmitResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics,
    });
  }
});
