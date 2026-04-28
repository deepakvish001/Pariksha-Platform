// Mirrors the per-language runtime defaults used in the
// `run-code` and `submit-code` Supabase Edge Functions so the UI can show
// users the exact CPU / wall / memory limits that will be applied before
// they hit Run or Submit. Keep these values in sync with the edge functions.
import type { LangId } from "@/data/codingProblemsData";

export interface ExecLimits {
  language: string; // Fermion language label
  cpuMs: number;
  wallMs: number;
  memKb: number;
}

const FERMION_SAFE_MAX = { cpuMs: 5000, wallMs: 6500, memKb: 512_000 };

const RUNTIME_DEFAULTS: Record<string, ExecLimits> = {
  C:      { language: "C",      cpuMs: 2000, wallMs: 5000, memKb: 512_000 },
  Cpp:    { language: "Cpp",    cpuMs: 2000, wallMs: 5000, memKb: 512_000 },
  Java:   { language: "Java",   cpuMs: 3000, wallMs: 6000, memKb: 512_000 },
  Python: { language: "Python", cpuMs: 3000, wallMs: 6000, memKb: 262_144 },
  NodeJs: { language: "NodeJs", cpuMs: 3000, wallMs: 6000, memKb: 262_144 },
  Go:     { language: "Go":     cpuMs: 3000, wallMs: 6000, memKb: 262_144 },
  SQLite: { language: "SQLite", cpuMs: 2000, wallMs: 4000, memKb: 131_072 },
};

const LANGID_TO_FERMION: Record<LangId, string> = {
  python: "Python",
  cpp: "Cpp",
  java: "Java",
  javascript: "NodeJs",
  typescript: "NodeJs",
  c: "C",
  go: "Go",
  sql: "SQLite",
};

const cap = (l: ExecLimits): ExecLimits => ({
  language: l.language,
  cpuMs: Math.min(l.cpuMs, FERMION_SAFE_MAX.cpuMs),
  wallMs: Math.min(l.wallMs, FERMION_SAFE_MAX.wallMs),
  memKb: Math.min(l.memKb, FERMION_SAFE_MAX.memKb),
});

export const getExecLimitsForLang = (
  langId: LangId,
  overrides?: { cpuSec?: number; memKb?: number },
): ExecLimits => {
  const fermionLang = LANGID_TO_FERMION[langId] ?? "Python";
  const base = RUNTIME_DEFAULTS[fermionLang] ?? RUNTIME_DEFAULTS.Python;
  const requestedCpuMs =
    typeof overrides?.cpuSec === "number" ? overrides.cpuSec * 1000 : base.cpuMs;
  const requestedMemKb =
    typeof overrides?.memKb === "number" ? overrides.memKb : base.memKb;
  const cpuMs = Math.min(requestedCpuMs, base.cpuMs);
  return cap({
    language: fermionLang,
    cpuMs,
    wallMs: Math.max(base.wallMs, cpuMs),
    memKb: Math.min(requestedMemKb, base.memKb),
  });
};

export const formatLimits = (l: ExecLimits): string =>
  `CPU ${(l.cpuMs / 1000).toFixed(1)}s · Wall ${(l.wallMs / 1000).toFixed(1)}s · Mem ${Math.round(l.memKb / 1024)} MB`;
