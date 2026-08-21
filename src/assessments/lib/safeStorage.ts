/**
 * safeStorage — drop-in replacement for window.localStorage that:
 *  - never throws (private mode, disabled storage, quota exceeded, SSR)
 *  - falls back to an in-memory Map so toggles/queues still work within the
 *    current session even when persistence is unavailable
 *
 * Detection is lazy: on the first write failure we permanently switch this
 * key-space over to the memory backing store, so we don't keep paying the
 * try/catch + DOMException cost on hot paths.
 */

const memory = new Map<string, string>();
let useMemoryFallback = false;

function probe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = "__assess_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// Probe once at module load so we know up-front whether persistence works.
if (typeof window !== "undefined" && !probe()) {
  useMemoryFallback = true;
}

export const safeStorage = {
  isPersistent(): boolean {
    return !useMemoryFallback;
  },
  get(key: string): string | null {
    if (useMemoryFallback) {
      if (memory.has(key)) return memory.get(key)!;
      // Falling back to memory means a *write* failed at some point (quota
      // exceeded, etc.) — reads are usually unaffected, so a key written to
      // localStorage before the flip can still be sitting there. Try it
      // before giving up, otherwise it looks like the data vanished.
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      useMemoryFallback = true;
      return memory.has(key) ? memory.get(key)! : null;
    }
  },
  set(key: string, value: string): boolean {
    if (useMemoryFallback) {
      memory.set(key, value);
      return false; // wrote, but not persistently
    }
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      // Quota exceeded / disabled mid-session — flip to memory and keep going
      useMemoryFallback = true;
      memory.set(key, value);
      return false;
    }
  },
  remove(key: string): void {
    memory.delete(key);
    if (useMemoryFallback) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      useMemoryFallback = true;
    }
  },
};
