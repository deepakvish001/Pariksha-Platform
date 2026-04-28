// Run user code against custom stdin (logs to code_runs when authenticated)
// Used for the "Run" button in the editor
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

interface RunResult {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  time: number | null;
  memory: number | null;
}

interface Diagnostics {
  error_stage?: "config" | "validation" | "submit" | "poll" | "unknown";
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

function friendlyJudge0Error(status: number, body: string): string {
  const isRapidApi = JUDGE0_URL.includes("rapidapi.com");
  const provider = isRapidApi ? "RapidAPI Judge0" : "Judge0";
  const where = isRapidApi
    ? "Check your RapidAPI key & host header in Lovable Cloud → Backend → Secrets (JUDGE0_AUTH_TOKEN, JUDGE0_AUTH_HEADER, JUDGE0_EXTRA_HEADER_NAME, JUDGE0_EXTRA_HEADER_VALUE). Also confirm you are subscribed to the Judge0 CE API on RapidAPI."
    : "Check JUDGE0_URL and JUDGE0_AUTH_TOKEN in Lovable Cloud → Backend → Secrets, and verify your Judge0 server is reachable.";

  if (status === 401 || status === 403) {
    return `${provider} rejected the request (${status} ${status === 401 ? "Unauthorized" : "Forbidden"}). Your API key/host headers are missing or invalid. ${where}`;
  }
  if (status === 429) {
    return `${provider} rate limit hit (429). You've exceeded your RapidAPI quota — upgrade your plan or wait for the quota to reset.`;
  }
  if (status === 404) {
    return `${provider} endpoint not found (404). Verify JUDGE0_URL is correct (should be the base URL, e.g. https://judge0-ce.p.rapidapi.com — no trailing path).`;
  }
  if (status >= 500) {
    return `${provider} server error (${status}). The code execution service is temporarily unavailable. Try again in a moment.`;
  }
  return `${provider} request failed (${status})${body ? `: ${body.slice(0, 300)}` : ""}. ${where}`;
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

async function runOnJudge0(payload: {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}): Promise<RunResult> {
  const submitUrl = `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`;
  // Submit
  const submitRes = await fetch(submitUrl, {
    method: "POST",
    headers: judge0Headers(),
    body: JSON.stringify({
      source_code: b64encode(payload.source_code),
      language_id: payload.language_id,
      stdin: payload.stdin ? b64encode(payload.stdin) : undefined,
      expected_output: payload.expected_output
        ? b64encode(payload.expected_output)
        : undefined,
      cpu_time_limit: payload.cpu_time_limit ?? 5,
      memory_limit: payload.memory_limit ?? 256000,
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Judge0RequestError(
      friendlyJudge0Error(submitRes.status, errText),
      {
        error_stage: "submit",
        requested_url: submitUrl,
        judge0_status: submitRes.status,
        judge0_body: errText || undefined,
      },
    );
  }

  const { token } = await submitRes.json();
  if (!token) throw new Error("Judge0 returned no token");

  // Poll
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 600));
    const r = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,message,time,memory`,
      { headers: judge0Headers() },
    );
    if (!r.ok) continue;
    const data = await r.json();
    // status.id 1=In Queue, 2=Processing, >2 done
    if (data.status && data.status.id > 2) {
      return {
        status: data.status,
        stdout: b64decode(data.stdout),
        stderr: b64decode(data.stderr),
        compile_output: b64decode(data.compile_output),
        message: b64decode(data.message),
        time: data.time ? parseFloat(data.time) : null,
        memory: data.memory ?? null,
      };
    }
  }
  throw new Judge0RequestError("Judge0 polling timed out", {
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
      return respond<RunResult>({
        ok: false,
        error: "Code execution is not configured. Add JUDGE0_URL (and JUDGE0_AUTH_TOKEN / JUDGE0_AUTH_HEADER for RapidAPI) in Lovable Cloud → Backend → Secrets.",
        diagnostics: { error_stage: "config" },
      });
    }
    if (JUDGE0_URL.includes("rapidapi.com") && (!JUDGE0_AUTH_TOKEN || !JUDGE0_EXTRA_HEADER_VALUE)) {
      return respond<RunResult>({
        ok: false,
        error: "RapidAPI Judge0 requires both an API key and host header. Set JUDGE0_AUTH_TOKEN (your x-rapidapi-key) and JUDGE0_EXTRA_HEADER_NAME=x-rapidapi-host + JUDGE0_EXTRA_HEADER_VALUE=judge0-ce.p.rapidapi.com in Lovable Cloud → Backend → Secrets.",
        diagnostics: { error_stage: "config" },
      });
    }

    const body = await req.json();
    const { source_code, language_id, stdin, expected_output } = body ?? {};

    if (typeof source_code !== "string" || source_code.length === 0) {
      return respond<RunResult>({
        ok: false,
        error: "source_code required",
        diagnostics: { error_stage: "validation" },
      });
    }
    if (source_code.length > 50000) {
      return respond<RunResult>({
        ok: false,
        error: "source_code too large (50KB max)",
        diagnostics: { error_stage: "validation" },
      });
    }
    if (typeof language_id !== "number") {
      return respond<RunResult>({
        ok: false,
        error: "language_id required",
        diagnostics: { error_stage: "validation" },
      });
    }

    const result = await runOnJudge0({
      source_code,
      language_id,
      stdin: typeof stdin === "string" ? stdin : "",
      expected_output: typeof expected_output === "string" ? expected_output : undefined,
    });

    return respond<RunResult>({ ok: true, data: result });
  } catch (err) {
    console.error("run-code error:", err);
    const diagnostics = err instanceof Judge0RequestError
      ? err.diagnostics
      : { error_stage: "unknown" as const };
    return respond<RunResult>({
      ok: false,
      error: (err as Error).message ?? "Unknown error",
      diagnostics,
    });
  }
});
