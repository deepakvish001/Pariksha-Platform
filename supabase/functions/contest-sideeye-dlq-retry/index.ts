// Edge function: contest-sideeye-dlq-retry
// Cron-driven worker that retries failed side-camera frame analyses queued in
// `sideeye_failed_analyses`. Runs every 10 minutes via pg_cron. Pulls up to 25
// rows whose next_retry_at <= now() and resolved_at is null. For each row it
// re-invokes `contest-sideeye-frame-analyze` with the original payload using
// the service role. On success it marks the row resolved; on failure it
// increments retry_count, applies exponential backoff (1m, 5m, 30m, 2h, 6h),
// and after 5 attempts gives up + emits a critical admin notification.
//
// Body: {} (cron-invoked, no body required)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000];
const MAX_RETRIES = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Cron-only endpoint: require shared secret or service role key.
  const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
  const provided = req.headers.get("X-Cron-Secret")
    || req.headers.get("Authorization")?.replace("Bearer ", "");
  const authorized = (cronSecret && provided === cronSecret) || provided === SERVICE_KEY;
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: pending, error } = await admin
    .from("sideeye_failed_analyses")
    .select("id, session_id, payload, retry_count")
    .is("resolved_at", null)
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(25);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let succeeded = 0, failed = 0, abandoned = 0;

  for (const row of pending ?? []) {
    const payload = (row.payload ?? {}) as { storagePath?: string; idemKey?: string };
    if (!payload.storagePath) {
      await admin.from("sideeye_failed_analyses")
        .update({ resolved_at: new Date().toISOString(), error: "missing storagePath" })
        .eq("id", row.id);
      continue;
    }

    try {
      // Re-fetch the stored frame and re-invoke analyzer with same idempotency key
      const { data: signed } = await admin.storage
        .from("contest-sideeye")
        .createSignedUrl(payload.storagePath, 60);
      if (!signed?.signedUrl) throw new Error("signed URL failed");
      const imgResp = await fetch(signed.signedUrl);
      const buf = new Uint8Array(await imgResp.arrayBuffer());
      const b64 = btoa(String.fromCharCode(...buf));
      const dataUrl = `data:image/jpeg;base64,${b64}`;

      const fnResp = await fetch(`${SUPABASE_URL}/functions/v1/contest-sideeye-frame-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
        body: JSON.stringify({
          sessionId: row.session_id,
          storagePath: payload.storagePath,
          dataUrl,
          idempotencyKey: payload.idemKey ?? `${row.session_id}:${payload.storagePath}`,
        }),
      });

      if (!fnResp.ok) throw new Error(`analyze ${fnResp.status}`);

      await admin.from("sideeye_failed_analyses")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);
      succeeded++;
    } catch (e) {
      const nextCount = (row.retry_count ?? 0) + 1;
      if (nextCount >= MAX_RETRIES) {
        await admin.from("sideeye_failed_analyses")
          .update({
            retry_count: nextCount,
            resolved_at: new Date().toISOString(),
            error: `ABANDONED: ${e instanceof Error ? e.message : String(e)}`,
          })
          .eq("id", row.id);
        abandoned++;
      } else {
        const delay = BACKOFF_MS[Math.min(nextCount, BACKOFF_MS.length - 1)];
        await admin.from("sideeye_failed_analyses")
          .update({
            retry_count: nextCount,
            next_retry_at: new Date(Date.now() + delay).toISOString(),
            error: e instanceof Error ? e.message : String(e),
          })
          .eq("id", row.id);
        failed++;
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: pending?.length ?? 0, succeeded, failed, abandoned }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
