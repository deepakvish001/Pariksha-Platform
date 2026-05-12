import { useCallback, useEffect, useState } from "react";

const LS_SETTINGS = "dsaPatterns:settings:v1";

export type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday

export interface DsaPatternSettings {
  /** Minimum patterns completed in a day for it to count toward a streak. */
  dailyThreshold: number;
  /** First day of the week for week-based stats. */
  weekStart: WeekStart;
}

export const DEFAULT_SETTINGS: DsaPatternSettings = {
  dailyThreshold: 1,
  weekStart: 1,
};

const load = (): DsaPatternSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const v = JSON.parse(raw);
    return {
      dailyThreshold: Math.max(1, Math.min(20, Number(v?.dailyThreshold) || 1)),
      weekStart: v?.weekStart === 0 ? 0 : 1,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const useDsaPatternSettings = () => {
  const [settings, setSettings] = useState<DsaPatternSettings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SETTINGS) setSettings(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<DsaPatternSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, update };
};
