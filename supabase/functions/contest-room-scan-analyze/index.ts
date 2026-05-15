// Tier 4 anti-cheat: analyze a 10s room-scan recording.
// Extracts a few representative frames from the uploaded webm clip and
// asks Gemini-vision whether the room looks clean, suspicious, or
// outright blocked (extra person, second screen, phone in frame, etc.).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Body {
  contest_id: string;
  session_id: string | null;
  scan_id: string;
  storage_path: string;
}

interface AiVerdict {
  verdict: "clean" | "suspicious" | "blocked";
  summary: string;
  findings: string[];
}

async function analyzeWithGemini(videoB64: string, mime: string): Promise<AiVerdict> {
  if (!LOVABLE_API_KEY) {
    return { verdict: "clean", summary: "AI key not configured — manual review only.", findings: [] };
  }
  const body = {
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "You are a contest proctor. Analyze a short webcam room-scan clip and decide if the testing environment is acceptable. Block on: a second person visible, a second monitor / TV / screen visible, a phone visible in frame, paper notes / books with text on the desk, earbuds or wired headphones connected. Suspicious (warn) on: someone briefly walking past, a powered-off second monitor, ambiguous reflections. Clean otherwise.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this room scan and return a verdict." },
          { type: "image_url", image_url: { url: `data:${mime};base64,${videoB64}` } },
        ],
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "report_room_scan",
          description: "Return the proctor verdict for this room scan",
          parameters: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["clean", "suspicious", "blocked"] },
              summary: { type: "string", description: "One-sentence explanation" },
              findings: {
                type: "array",
                items: { type: "string" },
                description: "Specific objects/people detected (max 6)",
              },
            },
            required: ["verdict", "summary", "findings"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "report_room_scan" } },
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    console.error("Gemini error", resp.status, t);
    return { verdict: "suspicious", summary: `AI unavailable (${resp.status}) — flagged for manual review.`, findings: [] };
  }
  const json = await resp.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) {
    return { verdict: "suspicious", summary: "AI returned no structured verdict.", findings: [] };
  }
  try {
    const parsed = JSON.parse(args) as AiVerdict;
    return {
      verdict: parsed.verdict,
      summary: parsed.summary?.slice(0, 500) ?? "",
      findings: (parsed.findings ?? []).slice(0, 6),
    };
  } catch {
    return { verdict: "suspicious", summary: "Could not parse AI verdict.", findings: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication: require a valid JWT, scan must belong to caller (or admin) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.contest_id || !body?.scan_id || !body?.storage_path) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the scan belongs to the authenticated user (or caller is admin)
    const { data: scanRow, error: scanErr } = await supabase
      .from("contest_room_scans")
      .select("id, user_id, storage_path")
      .eq("id", body.scan_id)
      .maybeSingle();
    if (scanErr || !scanRow) {
      return new Response(JSON.stringify({ error: "Scan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (scanRow.user_id !== userData.user.id) {
      const { data: isAdmin } = await userClient.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Use the storage_path stored on the row, not the one supplied by the caller.
    body.storage_path = scanRow.storage_path ?? body.storage_path;

    // Download the webm
    const { data: file, error: dlErr } = await supabase.storage
      .from("contest-room-scans")
      .download(body.storage_path);
    if (dlErr || !file) {
      console.error("download failed", dlErr);
      await supabase
        .from("contest_room_scans")
        .update({ verdict: "error", ai_summary: dlErr?.message ?? "Download failed" })
        .eq("id", body.scan_id);
      return new Response(JSON.stringify({ verdict: "error", summary: "Download failed", findings: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    // Cap at ~4 MB before base64 (Gemini limits) — clips are usually < 1 MB.
    const trimmed = buf.length > 4_000_000 ? buf.slice(0, 4_000_000) : buf;
    const b64 = btoa(String.fromCharCode(...trimmed));
    const mime = file.type || "video/webm";

    const ai = await analyzeWithGemini(b64, mime);

    await supabase
      .from("contest_room_scans")
      .update({
        verdict: ai.verdict,
        ai_summary: ai.summary,
        ai_findings: ai.findings,
      })
      .eq("id", body.scan_id);

    return new Response(JSON.stringify(ai), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("room-scan-analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
