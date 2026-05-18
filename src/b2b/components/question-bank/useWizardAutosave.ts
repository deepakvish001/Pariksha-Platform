import { useEffect, useRef, useState } from "react";

const PREFIX = "qb-autosave:v1:";

type Snapshot<T> = { draft: T; status: "draft" | "published"; ts: number };

export function loadAutosave<T>(key: string): Snapshot<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Snapshot<T>;
  } catch {
    return null;
  }
}

export function clearAutosave(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}

/**
 * Debounced autosave of a wizard draft to localStorage.
 * Returns the timestamp of the most recent successful save (or null).
 */
export function useWizardAutosave<T>(
  key: string,
  draft: T,
  status: "draft" | "published",
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const debounceMs = options?.debounceMs ?? 1200;
  const enabled = options?.enabled ?? true;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    const snap = loadAutosave<T>(key);
    return snap ? new Date(snap.ts) : null;
  });
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    // Skip the very first effect (initial mount) to avoid re-writing unchanged data
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      try {
        const ts = Date.now();
        const snap: Snapshot<T> = { draft, status, ts };
        window.localStorage.setItem(PREFIX + key, JSON.stringify(snap));
        setLastSavedAt(new Date(ts));
      } catch {
        /* quota or serialization error — ignore */
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [key, draft, status, debounceMs, enabled]);

  return { lastSavedAt };
}

/** Human "x seconds ago" formatter, kept tiny on purpose. */
export function formatRelative(date: Date | null, now: number): string {
  if (!date) return "Not saved yet";
  const diff = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (diff < 5) return "Saved just now";
  if (diff < 60) return `Saved ${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `Saved ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Saved ${h}h ago`;
  return `Saved ${date.toLocaleString()}`;
}
