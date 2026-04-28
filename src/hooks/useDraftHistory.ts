import { useCallback, useEffect, useState } from "react";

export interface DraftSnapshot {
  id: string;
  source: string;
  savedAt: string; // ISO
  /** Approximate length so the picker can show a short summary. */
  length: number;
}

const KEY_PREFIX = "byteskill:coding-draft-history";
const MAX_SNAPSHOTS = 5;
const MIN_DELTA_MS = 60_000; // throttle: 1 snapshot/min max
const MIN_LEN_DELTA = 20; // skip near-identical changes

const buildKey = (slug: string, language: string) =>
  `${KEY_PREFIX}:${slug}:${language}:v1`;

const read = (slug: string, language: string): DraftSnapshot[] => {
  if (typeof window === "undefined" || !slug) return [];
  try {
    const raw = localStorage.getItem(buildKey(slug, language));
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const write = (slug: string, language: string, snaps: DraftSnapshot[]) => {
  try {
    localStorage.setItem(buildKey(slug, language), JSON.stringify(snaps));
  } catch {
    /* ignore quota */
  }
};

export const useDraftHistory = (slug: string | undefined, language: string) => {
  const [snapshots, setSnapshots] = useState<DraftSnapshot[]>(() =>
    slug ? read(slug, language) : [],
  );

  useEffect(() => {
    setSnapshots(slug ? read(slug, language) : []);
  }, [slug, language]);

  const pushSnapshot = useCallback(
    (source: string) => {
      if (!slug) return;
      if (!source || source.trim().length < 8) return;
      const cur = read(slug, language);
      const last = cur[0];
      if (last) {
        const dt = Date.now() - new Date(last.savedAt).getTime();
        if (dt < MIN_DELTA_MS) return;
        if (Math.abs(last.source.length - source.length) < MIN_LEN_DELTA && last.source === source)
          return;
      }
      const next: DraftSnapshot = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        source,
        savedAt: new Date().toISOString(),
        length: source.length,
      };
      const merged = [next, ...cur].slice(0, MAX_SNAPSHOTS);
      write(slug, language, merged);
      setSnapshots(merged);
    },
    [slug, language],
  );

  const clear = useCallback(() => {
    if (!slug) return;
    write(slug, language, []);
    setSnapshots([]);
  }, [slug, language]);

  return { snapshots, pushSnapshot, clear };
};
