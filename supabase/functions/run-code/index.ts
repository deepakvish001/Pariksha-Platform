// Run user code against custom stdin (no verdict, no DB write)
// Used for the "Run" button in the editor

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JUDGE0_URL = Deno.env.get("JUDGE0_URL")?.replace(/\/$/, "") ?? "";
const JUDGE0_AUTH_HEADER = Deno.env.get("JUDGE0_AUTH_HEADER") ?? "X-Auth-Token";
const JUDGE0_AUTH_TOKEN = Deno.env.get("JUDGE0_AUTH_TOKEN") ?? "";

function judge0Headers(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUDGE0_AUTH_TOKEN) headers[JUDGE0_AUTH_HEADER] = JUDGE0_AUTH_TOKEN;
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

async function runOnJudge0(payload: {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}) {
  // Submit
  const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`,
    {
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
    },
  );

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Judge0 submit failed (${submitRes.status}): ${errText}`);
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
  throw new Error("Judge0 polling timed out");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!JUDGE0_URL) {
      return new Response(
        JSON.stringify({ error: "JUDGE0_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { source_code, language_id, stdin, expected_output } = body ?? {};

    if (typeof source_code !== "string" || source_code.length === 0) {
      return new Response(
        JSON.stringify({ error: "source_code required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (source_code.length > 50000) {
      return new Response(
        JSON.stringify({ error: "source_code too large (50KB max)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (typeof language_id !== "number") {
      return new Response(
        JSON.stringify({ error: "language_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await runOnJudge0({
      source_code,
      language_id,
      stdin: typeof stdin === "string" ? stdin : "",
      expected_output: typeof expected_output === "string" ? expected_output : undefined,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("run-code error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
