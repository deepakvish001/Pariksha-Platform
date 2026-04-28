import { useCallback, useEffect, useState } from "react";
import type { FormatOnSubmit } from "@/hooks/useEditorPrefs";

const KEY = "byteskill:coding-format-on-submit-overrides:v1";

type OverrideMap = Record<string, FormatOnSubmit>;

const isMode = (v: unknown): v is FormatOnSubmit =>
  v === "off" || v === "format" || v === "format+lint";

const readMap = (): OverrideMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: OverrideMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isMode(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
};

const writeMap = (map: OverrideMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const buildKey = (slug: string | undefined, language: string) =>
  `${slug ?? "_"}::${language}`;

/**
 * Per-(problem, language) override of the global "format on submit"
 * preference. When no override is set for the current key, the global
 * preference is used. Setting an override persists it across sessions so
 * a user's choice for "two-sum / python" remains stable when they switch
 * tasks and come back.
 */
export const useFormatOnSubmitOverride = (
  slug: string | undefined,
  language: string,
  globalPref: FormatOnSubmit,
) => {
  const [map, setMap] = useState<OverrideMap>(readMap);

  // Re-read on key change in case other tabs/components updated storage.
  useEffect(() => {
    setMap(readMap());
  }, [slug, language]);

  const k = buildKey(slug, language);
  const override = map[k];
  const effective: FormatOnSubmit = override ?? globalPref;

  const setOverride = useCallback(
    (mode: FormatOnSubmit | null) => {
      setMap((prev) => {
        const next = { ...prev };
        if (mode === null) delete next[k];
        else next[k] = mode;
        writeMap(next);
        return next;
      });
    },
    [k],
  );

  return {
    /** The effective mode to use (override if set, otherwise global). */
    effective,
    /** The explicit override for this (problem, language), or null. */
    override: override ?? null,
    /** Persist a per-(problem, language) override. Pass null to clear. */
    setOverride,
  };
};
