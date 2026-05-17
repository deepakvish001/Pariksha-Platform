/**
 * Offline-safe delivery queue for SOS alerts.
 *
 * If the network drops between the moment the candidate hits "Send SOS"
 * and the moment Supabase receives the row, the alert would be lost.
 * To prevent that, every send attempt is mirrored to localStorage as a
 * "queued" item; a background watcher replays them whenever the browser
 * comes back online or the tab regains focus.
 *
 * Each item also drives the live status pill so candidates see
 *   queued → sent  (or queued → failed after exhausted retries).
 */

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "parikshaa.sos.deliveryQueue.v1";
const MAX_ATTEMPTS = 6;

export interface QueuedSos {
  /** Stable local id so the UI can react to a single queued alert. */
  localId: string;
  attempt_id: string;
  raised_by: string;
  issue: string;
  notes: string | null;
  /** Enriched device/network metadata captured at SOS time. */
  metadata: Record<string, unknown>;
  assessment_title: string | null;
  client_attempted_at: string;
  /** Increments each time we attempt to flush. */
  tries: number;
  /** Last error returned by Supabase, for surfacing in the UI. */
  lastError?: string;
}

type Listener = (items: QueuedSos[]) => void;
const listeners = new Set<Listener>();
let flushing = false;

function read(): QueuedSos[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSos[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedSos[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full / private mode — best effort
  }
  listeners.forEach((l) => l(items));
}

export function getQueuedSos(attemptId?: string | null): QueuedSos[] {
  const all = read();
  return attemptId ? all.filter((i) => i.attempt_id === attemptId) : all;
}

export function subscribeSosQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener(read());
  return () => {
    listeners.delete(listener);
  };
}

export function enqueueSos(item: Omit<QueuedSos, "localId" | "tries" | "client_attempted_at"> & {
  client_attempted_at?: string;
}): QueuedSos {
  const queued: QueuedSos = {
    localId: crypto.randomUUID(),
    tries: 0,
    client_attempted_at: item.client_attempted_at ?? new Date().toISOString(),
    ...item,
  };
  const all = read();
  all.push(queued);
  write(all);
  return queued;
}

function remove(localId: string) {
  write(read().filter((i) => i.localId !== localId));
}

function update(localId: string, patch: Partial<QueuedSos>) {
  write(read().map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
}

/**
 * Attempt to deliver a single queued SOS. Returns true if delivered.
 * Performs the same 3-way fanout as the live path:
 *   assessment_sos_events + attempt_events + assessment_chat_messages
 */
async function deliverOne(item: QueuedSos): Promise<{ ok: boolean; error?: string }> {
  try {
    const sosInsert = await supabase
      .from("assessment_sos_events")
      .insert({
        attempt_id: item.attempt_id,
        raised_by: item.raised_by,
        issue: item.issue,
        notes: item.notes,
        delivery_status: "sent",
        client_attempted_at: item.client_attempted_at,
      } as any)
      .select("id")
      .single();
    if (sosInsert.error) throw sosInsert.error;

    const [evt, chat] = await Promise.all([
      supabase.from("attempt_events").insert({
        attempt_id: item.attempt_id,
        kind: "sos",
        payload: {
          issue: item.issue,
          notes: item.notes,
          raised_at: item.client_attempted_at,
          assessment_title: item.assessment_title,
          delivered_via: "offline_replay",
          tries: item.tries + 1,
          ...item.metadata,
        },
      }),
      supabase.from("assessment_chat_messages").insert({
        attempt_id: item.attempt_id,
        sender_user_id: item.raised_by,
        sender_role: "system",
        body: `🚨 SOS raised by candidate (delivered after reconnect) — ${item.issue}${
          item.notes ? `\n\nDetails: ${item.notes}` : ""
        }`,
      }),
    ]);
    if (evt.error) console.warn("SOS replay event mirror failed", evt.error);
    if (chat.error) console.warn("SOS replay chat post failed", chat.error);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Network error" };
  }
}

/** Walk the queue once, flushing whatever can be delivered. */
export async function flushSosQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    const items = read();
    for (const item of items) {
      const result = await deliverOne(item);
      if (result.ok) {
        remove(item.localId);
      } else {
        const nextTries = item.tries + 1;
        if (nextTries >= MAX_ATTEMPTS) {
          // Mark as failed in storage so the UI can show it (kept around
          // so the candidate sees "delivery failed — call support").
          update(item.localId, {
            tries: nextTries,
            lastError: `Delivery failed after ${MAX_ATTEMPTS} attempts: ${result.error ?? "unknown"}`,
          });
        } else {
          update(item.localId, { tries: nextTries, lastError: result.error });
          // Stop the loop — likely still offline; wait for next trigger.
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}

/**
 * Wire up global listeners that retry queued SOS alerts on reconnect /
 * tab focus. Safe to call multiple times — listeners are idempotent.
 */
let installed = false;
export function installSosQueueAutoflush(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const tick = () => void flushSosQueue();
  window.addEventListener("online", tick);
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  // Periodic safety net (every 30s) for unstable mobile connections
  setInterval(tick, 30_000);
}

export const SOS_DELIVERY_FAILED_THRESHOLD = MAX_ATTEMPTS;
