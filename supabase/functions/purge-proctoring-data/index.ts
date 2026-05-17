// Purges proctoring data older than configured retention windows.
//
// Reads `platform_settings.proctoring_retention` (jsonb):
//   { "snapshot_days": number, "events_days": number }
//
// Deletes:
//   - storage objects in `assessment-proctor` bucket older than snapshot_days
//   - `attempt_events` rows older than events_days (proctoring kinds only)
//
// Records each run into `proctoring_purge_runs` for the admin history panel.
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

  // Parse optional run metadata from caller.
  let source = "manual";
  let triggeredBy: string | null = null;
  let dryRun = false;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.source === "string" && body.source.length <= 32) {
        source = body.source;
      }
      if (typeof body?.triggered_by === "string" && body.triggered_by.length === 36) {
        triggeredBy = body.triggered_by;
      }
      if (body?.dry_run === true) dryRun = true;
    }
  } catch (_) { /* ignore */ }

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

  const errors: string[] = [];

  // ─── DRY RUN: count only, do not delete or log ─────────────────────────
  if (dryRun) {
    let snapshotsToDelete = 0;
    let eventsToDelete = 0;
    try {
      const { count } = await admin
        .from("attempt_events")
        .select("id", { count: "exact", head: true })
        .eq("kind", "webcam_snapshot")
        .lt("created_at", snapCutoff);
      snapshotsToDelete = count ?? 0;
    } catch (e) {
      errors.push(`snapshot-count: ${(e as Error).message}`);
    }
    try {
      const { count } = await admin
        .from("attempt_events")
        .select("id", { count: "exact", head: true })
        .in("kind", PROCTORING_EVENT_KINDS)
        .lt("created_at", eventCutoff);
      eventsToDelete = count ?? 0;
    } catch (e) {
      errors.push(`event-count: ${(e as Error).message}`);
    }
    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        dry_run: true,
        retention,
        snapshots_to_delete: snapshotsToDelete,
        events_to_delete: eventsToDelete,
        snapshot_cutoff: snapCutoff,
        event_cutoff: eventCutoff,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

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
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error: rmErr } = await admin.storage.from("assessment-proctor").remove(chunk);
        if (!rmErr) snapshotsDeleted += chunk.length;
        else errors.push(`storage: ${rmErr.message}`);
      }
    }
  } catch (e) {
    console.error("snapshot purge error", e);
    errors.push(`snapshot: ${(e as Error).message}`);
  }

  // ─── Delete old proctoring events ──────────────────────────────────────
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
      else errors.push(`events: ${delErr.message}`);
    }
  } catch (e) {
    console.error("event purge error", e);
    errors.push(`events: ${(e as Error).message}`);
  }

  // ─── Delete old session-recording chunks (storage + rows) ──────────────
  let chunksDeleted = 0;
  try {
    const { data: oldChunks } = await admin
      .from("assessment_proctor_session_chunks")
      .select("id, storage_path")
      .lt("started_at", snapCutoff)
      .limit(2000);
    const rows = (oldChunks ?? []) as Array<{ id: string; storage_path: string }>;
    const chunkPaths = rows.map((r) => r.storage_path).filter((p): p is string => !!p);
    if (chunkPaths.length > 0) {
      for (let i = 0; i < chunkPaths.length; i += 100) {
        const batch = chunkPaths.slice(i, i + 100);
        const { error: rmErr } = await admin.storage.from("assessment-proctor").remove(batch);
        if (rmErr) errors.push(`chunk-storage: ${rmErr.message}`);
      }
      const ids = rows.map((r) => r.id);
      const { error: delErr } = await admin.from("assessment_proctor_session_chunks").delete().in("id", ids);
      if (!delErr) chunksDeleted = ids.length;
      else errors.push(`chunks: ${delErr.message}`);
    }
  } catch (e) {
    console.error("chunk purge error", e);
    errors.push(`chunks: ${(e as Error).message}`);
  }

  // ─── Log this run ──────────────────────────────────────────────────────
  try {
    await admin.from("proctoring_purge_runs").insert({
      snapshots_deleted: snapshotsDeleted,
      events_deleted: eventsDeleted,
      snapshot_days: retention.snapshot_days,
      events_days: retention.events_days,
      snapshot_cutoff: snapCutoff,
      event_cutoff: eventCutoff,
      source,
      triggered_by: triggeredBy,
      error: errors.length ? errors.join("; ").slice(0, 1000) : null,
    });
  } catch (e) {
    console.error("failed to log purge run", e);
  }

  const result = {
    ok: errors.length === 0,
    retention,
    snapshots_deleted: snapshotsDeleted,
    events_deleted: eventsDeleted,
    chunks_deleted: chunksDeleted,
    snapshot_cutoff: snapCutoff,
    event_cutoff: eventCutoff,
    errors,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
