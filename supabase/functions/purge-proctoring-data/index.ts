// Purges proctoring data older than configured retention windows.
//
// Reads `platform_settings.proctoring_retention` (jsonb):
//   { "snapshot_days": number, "events_days": number }
//
// Deletes:
//   - storage objects in `assessment-proctor` bucket older than snapshot_days
//   - `attempt_events` rows older than events_days (proctoring kinds only)
//
// Designed to be invoked by pg_cron via pg_net, or manually by admins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROCTORING_EVENT_KINDS = [
  "webcam_snapshot",
  "violation_strike",
  "tab_hidden",
  "window_blur",
  "fullscreen_exit",
  "webcam_lost",
  "lockdown_fail",
  "lockdown_enter",
  "devtools_attempt",
  "print_blocked",
  "auto_submitted",
];

const DEFAULTS = { snapshot_days: 30, events_days: 90 };

interface Retention {
  snapshot_days: number;
  events_days: number;
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Load settings
  const { data: setting } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "proctoring_retention")
    .maybeSingle();

  const raw = (setting?.value ?? {}) as Partial<Retention>;
  const retention: Retention = {
    snapshot_days: clamp(raw.snapshot_days, 1, 3650, DEFAULTS.snapshot_days),
    events_days: clamp(raw.events_days, 1, 3650, DEFAULTS.events_days),
  };

  const now = Date.now();
  const snapCutoff = new Date(now - retention.snapshot_days * 86400_000).toISOString();
  const eventCutoff = new Date(now - retention.events_days * 86400_000).toISOString();

  // ─── Delete old webcam snapshots from storage ──────────────────────────
  let snapshotsDeleted = 0;
  try {
    const { data: oldSnapEvents } = await admin
      .from("attempt_events")
      .select("id, payload")
      .eq("kind", "webcam_snapshot")
      .lt("created_at", snapCutoff)
      .limit(1000);

    const paths = (oldSnapEvents ?? [])
      .map((e: any) => e.payload?.path)
      .filter((p: unknown): p is string => typeof p === "string" && p.length > 0);

    if (paths.length > 0) {
      // Remove in chunks of 100 (Supabase storage cap)
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error: rmErr } = await admin.storage.from("assessment-proctor").remove(chunk);
        if (!rmErr) snapshotsDeleted += chunk.length;
      }
    }
  } catch (e) {
    console.error("snapshot purge error", e);
  }

  // ─── Delete old proctoring events (cascade-safe, capped per run) ───────
  let eventsDeleted = 0;
  try {
    const { data: oldEvents } = await admin
      .from("attempt_events")
      .select("id")
      .in("kind", PROCTORING_EVENT_KINDS)
      .lt("created_at", eventCutoff)
      .limit(5000);
    const ids = (oldEvents ?? []).map((e: any) => e.id);
    if (ids.length > 0) {
      const { error: delErr } = await admin.from("attempt_events").delete().in("id", ids);
      if (!delErr) eventsDeleted = ids.length;
    }
  } catch (e) {
    console.error("event purge error", e);
  }

  const result = {
    ok: true,
    retention,
    snapshots_deleted: snapshotsDeleted,
    events_deleted: eventsDeleted,
    snapshot_cutoff: snapCutoff,
    event_cutoff: eventCutoff,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
