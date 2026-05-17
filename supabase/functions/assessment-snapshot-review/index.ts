// Reviews unreviewed assessment proctor snapshots with Lovable AI (Gemini).
// Designed for cron invocation (every ~30s) or manual POST `{ attempt_id }`.
// Persists structured findings to `assessment_proctor_findings`.
//
// Verifies caller is either service-role (cron / pg_net) or an org admin
// attached to the assessment's org.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const FINDING_SCHEMA = {
  type: "object",
  properties: {
    phone_in_frame: { type: "boolean" },
    looking_away: { type: "boolean" },
    person_count: { type: "integer" },
    identity_unclear: { type: "boolean" },
    notes: { type: "string" },
  },
  required: ["phone_in_frame", "looking_away", "person_count", "identity_unclear"],
  additionalProperties: false,
} as const;

const WEBCAM_PROMPT = "You are an exam proctor. Inspect the candidate's webcam frame and report whether: a phone is visible, the candidate is looking away from the screen, how many people are in frame, and if their identity is unclear. Be precise — false positives hurt the candidate.";
const SCREEN_PROMPT = "You are an exam proctor. Inspect the candidate's shared screen frame and report whether: a phone is visible on the desk, the candidate appears engaged with the assessment (looking_away=false if focused), how many people are visible, and identity_unclear=true only if a different person is clearly using the machine.";

async function callAI(imageUrl: string, source: string): Promise<any> {
  const prompt = source === "screen" ? SCREEN_PROMPT : WEBCAM_PROMPT;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "proctor_finding", strict: true, schema: FINDING_SCHEMA },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

function severityOf(f: any): string {
  if (f.person_count > 1 || f.identity_unclear) return "high";
  if (f.phone_in_frame) return "high";
  if (f.looking_away || f.person_count === 0) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let attemptFilter: string | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body.attempt_id === "string") attemptFilter = body.attempt_id;
    }
  } catch { /* noop */ }

  // ---- AuthZ: only service-role (cron) or org owner/admin/proctor may invoke ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  const isServiceCall = bearer && bearer === SERVICE_KEY;

  if (!isServiceCall) {
    if (!bearer) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Resolve caller from JWT using anon client. Pass the token explicitly so
    // it works without relying on persisted-session storage.
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: { persistSession: false },
    });
    const { data: who } = await userClient.auth.getUser(bearer);
    const uid = who?.user?.id;
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Manual invocations must scope to one attempt so we can authorize.
    if (!attemptFilter) {
      return new Response(JSON.stringify({ error: "attempt_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Look up the attempt's org and verify the caller has a proctor role there.
    const { data: orgRow, error: orgErr } = await supabase
      .rpc("attempt_assessment_org", { _attempt: attemptFilter });
    if (orgErr || !orgRow) {
      return new Response(JSON.stringify({ error: "Attempt not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgRow as unknown as string)
      .eq("user_id", uid)
      .maybeSingle();
    const role = (membership as any)?.role;
    if (!role || !["owner", "admin", "proctor"].includes(role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }


  // Pull a small batch of unreviewed snapshots
  let q = supabase
    .from("assessment_proctor_snapshots")
    .select("id, attempt_id, source, storage_path")
    .eq("reviewed", false)
    .order("captured_at", { ascending: true })
    .limit(15);
  if (attemptFilter) q = q.eq("attempt_id", attemptFilter);

  const { data: snaps, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let flagged = 0;
  for (const snap of snaps ?? []) {
    try {
      const { data: signed } = await supabase.storage
        .from("assessment-proctor")
        .createSignedUrl(snap.storage_path, 300);
      if (!signed?.signedUrl) continue;

      const finding = await callAI(signed.signedUrl, snap.source);
      const severity = severityOf(finding);

      await supabase.from("assessment_proctor_findings").insert({
        attempt_id: snap.attempt_id,
        snapshot_id: snap.id,
        finding,
        severity,
      });
      await supabase
        .from("assessment_proctor_snapshots")
        .update({ reviewed: true })
        .eq("id", snap.id);

      processed++;
      if (severity === "high") flagged++;
    } catch (e) {
      // Mark reviewed=true so we don't loop forever on a poison frame
      await supabase
        .from("assessment_proctor_snapshots")
        .update({ reviewed: true })
        .eq("id", snap.id);
      console.error("snapshot review failed", snap.id, e);
    }
  }

  return new Response(JSON.stringify({ processed, flagged }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
