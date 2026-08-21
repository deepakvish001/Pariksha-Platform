import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * safeStorage keeps module-level state (`useMemoryFallback`, the `memory`
 * map) that's set at import time by probing `window.localStorage`, so each
 * test needs a fresh module instance with its own localStorage backing.
 *
 * jsdom's Storage is a spec "legacy platform object" whose own methods
 * can't be reliably overridden with `vi.spyOn` (the call keeps going
 * through jsdom's internal storage rather than the mock), so tests that
 * need `setItem` to fail swap the whole `window.localStorage` for a plain
 * object instead.
 */
async function freshSafeStorage() {
  vi.resetModules();
  const mod = await import("../safeStorage");
  return mod.safeStorage;
}

function fakeStorage(opts: { failSetItem?: boolean } = {}) {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      if (opts.failSetItem) throw new DOMException("QuotaExceededError");
      map.set(k, v);
    },
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  } as unknown as Storage;
}

describe("safeStorage", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads/writes normally when localStorage works", async () => {
    const safeStorage = await freshSafeStorage();
    expect(safeStorage.isPersistent()).toBe(true);
    expect(safeStorage.set("k", "v")).toBe(true);
    expect(safeStorage.get("k")).toBe("v");
  });

  it("does not lose a key that was persisted to real localStorage before a later write quota-fails", async () => {
    const backing = fakeStorage();
    Object.defineProperty(window, "localStorage", { value: backing, writable: true, configurable: true });
    const safeStorage = await freshSafeStorage();

    // Persisted for real, before anything goes wrong.
    safeStorage.set("assess.pending.attempt-1", JSON.stringify({ q1: { choice: "b" } }));

    // A later, unrelated write blows the quota (e.g. a large SOS payload
    // elsewhere in the app) and flips the module to memory-only mode.
    (backing as unknown as { setItem: unknown }).setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
    expect(safeStorage.set("assess.editorPrefs", "{}")).toBe(false);
    expect(safeStorage.isPersistent()).toBe(false);

    // The earlier key is still physically in localStorage — reads should
    // still find it instead of silently reporting it as gone.
    expect(safeStorage.get("assess.pending.attempt-1")).toBe(
      JSON.stringify({ q1: { choice: "b" } })
    );
  });

  it("still serves keys written to the in-memory fallback after the flip", async () => {
    const backing = fakeStorage({ failSetItem: true });
    Object.defineProperty(window, "localStorage", { value: backing, writable: true, configurable: true });
    const safeStorage = await freshSafeStorage();
    safeStorage.set("k", "memory-only-value");
    expect(safeStorage.get("k")).toBe("memory-only-value");
  });

  it("returns null for a key that truly doesn't exist anywhere, without throwing", async () => {
    const backing = fakeStorage({ failSetItem: true });
    Object.defineProperty(window, "localStorage", { value: backing, writable: true, configurable: true });
    const safeStorage = await freshSafeStorage();
    safeStorage.set("flip-it", "x");
    expect(safeStorage.get("does-not-exist")).toBeNull();
  });
});
