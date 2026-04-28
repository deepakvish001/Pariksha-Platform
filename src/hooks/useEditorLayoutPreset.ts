import { useCallback, useEffect, useState } from "react";

const KEY = "byteskill:coding-editor-layout-preset:v1";

export type LayoutPresetId = "default" | "leet" | "note-taking" | "debug";

export interface LayoutPreset {
  id: LayoutPresetId;
  label: string;
  description: string;
  /** [leftPct, rightPct] for the outer horizontal split. */
  horizontal: [number, number];
  /** [editorPct, bottomPct] for the right column vertical split. */
  vertical: [number, number];
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "default",
    label: "Default",
    description: "Balanced problem and editor split.",
    horizontal: [45, 55],
    vertical: [65, 35],
  },
  {
    id: "leet",
    label: "Leet",
    description: "Compact problem, generous editor.",
    horizontal: [35, 65],
    vertical: [70, 30],
  },
  {
    id: "note-taking",
    label: "Note-taking",
    description: "Wide problem pane for reading and notes.",
    horizontal: [60, 40],
    vertical: [75, 25],
  },
  {
    id: "debug",
    label: "Debug",
    description: "Big editor and large test/output panel.",
    horizontal: [30, 70],
    vertical: [50, 50],
  },
];

export const DEFAULT_PRESET: LayoutPresetId = "default";

const isPresetId = (v: unknown): v is LayoutPresetId =>
  v === "default" || v === "leet" || v === "note-taking" || v === "debug";

type PresetMap = Record<string, LayoutPresetId>;

const readMap = (): PresetMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: PresetMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (isPresetId(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
};

const writeMap = (map: PresetMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const buildKey = (slug: string | undefined, language: string) =>
  `${slug ?? "_"}::${language}`;

export const getPreset = (id: LayoutPresetId): LayoutPreset =>
  LAYOUT_PRESETS.find((p) => p.id === id) ?? LAYOUT_PRESETS[0];

/**
 * Persists a chosen layout preset per (problem slug, language).
 * Falls back to "default" when nothing is stored.
 */
export const useEditorLayoutPreset = (
  slug: string | undefined,
  language: string,
) => {
  const [map, setMap] = useState<PresetMap>(readMap);

  useEffect(() => {
    setMap(readMap());
  }, [slug, language]);

  const k = buildKey(slug, language);
  const presetId: LayoutPresetId = map[k] ?? DEFAULT_PRESET;
  const preset = getPreset(presetId);
  const isCustomized = presetId !== DEFAULT_PRESET;

  const setPreset = useCallback(
    (id: LayoutPresetId) => {
      setMap((prev) => {
        const next = { ...prev, [k]: id };
        writeMap(next);
        return next;
      });
    },
    [k],
  );

  const reset = useCallback(() => {
    setMap((prev) => {
      if (!(k in prev)) return prev;
      const next = { ...prev };
      delete next[k];
      writeMap(next);
      return next;
    });
  }, [k]);

  return { presetId, preset, setPreset, reset, isCustomized };
};
