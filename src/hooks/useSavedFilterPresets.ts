import { useCallback, useEffect, useState } from "react";

/**
 * A saved filter preset for /library/problems.
 * Stores a fully-encoded query string (without the leading "?").
 */
export interface FilterPreset {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

const KEY = "byteskill:coding-saved-filters:v1";

const read = (): FilterPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((p) => p && p.id && p.name) : [];
  } catch {
    return [];
  }
};

const write = (presets: FilterPreset[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota */
  }
};

export const useSavedFilterPresets = () => {
  const [presets, setPresets] = useState<FilterPreset[]>(read);

  useEffect(() => {
    write(presets);
  }, [presets]);

  const save = useCallback((name: string, query: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const preset: FilterPreset = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed.slice(0, 60),
      query,
      createdAt: new Date().toISOString(),
    };
    setPresets((prev) => [preset, ...prev].slice(0, 20));
    return preset;
  }, []);

  const remove = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed.slice(0, 60) } : p)),
    );
  }, []);

  return { presets, save, remove, rename };
};
