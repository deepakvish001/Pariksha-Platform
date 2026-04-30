import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin:badge-prefs:v1";
const SEEN_KEY = "admin:badge-seen:v1";

export type BadgeKey = "/admin/reports" | "/admin/ai-content" | "/admin/system-health";

export interface BadgePrefs {
  enabled: Record<BadgeKey, boolean>;
  refreshSeconds: number; // 15..600
}

export const DEFAULT_PREFS: BadgePrefs = {
  enabled: {
    "/admin/reports": true,
    "/admin/ai-content": true,
    "/admin/system-health": true,
  },
  refreshSeconds: 60,
};

const read = (): BadgePrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      enabled: { ...DEFAULT_PREFS.enabled, ...(parsed.enabled ?? {}) },
      refreshSeconds: Math.min(600, Math.max(15, Number(parsed.refreshSeconds) || 60)),
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

export const useAdminBadgePrefs = () => {
  const [prefs, setPrefs] = useState<BadgePrefs>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<BadgePrefs>) => {
    setPrefs((prev) => {
      const next: BadgePrefs = {
        enabled: { ...prev.enabled, ...(patch.enabled ?? {}) },
        refreshSeconds:
          patch.refreshSeconds !== undefined
            ? Math.min(600, Math.max(15, patch.refreshSeconds))
            : prev.refreshSeconds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { prefs, update };
};

// ── Mark-as-read tracking
export type SeenMap = Partial<Record<BadgeKey, string>>; // ISO timestamp

const readSeen = (): SeenMap => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
};

export const useAdminBadgeSeen = () => {
  const [seen, setSeen] = useState<SeenMap>(readSeen);

  const markSeen = useCallback((key: BadgeKey) => {
    setSeen((prev) => {
      const next = { ...prev, [key]: new Date().toISOString() };
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    const now = new Date().toISOString();
    const next: SeenMap = {
      "/admin/reports": now,
      "/admin/ai-content": now,
      "/admin/system-health": now,
    };
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
  }, []);

  return { seen, markSeen, clearAll };
};
