import type { FullProblemPayload } from "@/hooks/useAdminProblems";
import { getExecLimitsForLang } from "@/lib/coding/executionLimits";
import type { LangId } from "@/data/codingProblemsData";

export type SectionStatus = "ok" | "warn" | "error" | "empty";
export type TabId =
  | "basics"
  | "statement"
  | "examples"
  | "constraints"
  | "starter"
  | "reference"
  | "tests"
  | "sql"
  | "limits";

export interface ValidationIssue {
  message: string;
  /** Stable field identifier, e.g. "title", "examples[2].output", "sample_tests[0].input" */
  field?: string;
}

export interface SectionResult {
  status: SectionStatus;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationReport {
  sections: Record<TabId, SectionResult>;
  canPublish: boolean;
  blockingErrors: ValidationIssue[];
}

const empty = (): SectionResult => ({ status: "empty", errors: [], warnings: [] });
const ok = (): SectionResult => ({ status: "ok", errors: [], warnings: [] });

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Matches simple constraint patterns like "1 <= n <= 10^5" or "a.length >= 1"
const CONSTRAINT_HINT_RE = /(<=|>=|<|>|=|≤|≥)/;
// Detects "<lower> <= <var> <= <upper>" style numeric bounds so we can sanity
// check that lower <= upper. Supports plain ints and "10^5" / "1e9" notations.
const NUMERIC_RANGE_RE =
  /(-?\d+(?:\.\d+)?(?:\^\d+|e\d+)?)\s*(?:<=|≤)\s*[A-Za-z_][\w.]*\s*(?:<=|≤)\s*(-?\d+(?:\.\d+)?(?:\^\d+|e\d+)?)/;

const parseNumericLiteral = (raw: string): number | null => {
  const s = raw.trim();
  const caret = s.match(/^(-?\d+(?:\.\d+)?)\^(\d+)$/);
  if (caret) return Number(caret[1]) ** Number(caret[2]);
  const sci = s.match(/^(-?\d+(?:\.\d+)?)e(\d+)$/i);
  if (sci) return Number(sci[1]) * Math.pow(10, Number(sci[2]));
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const finalize = (r: SectionResult, fallback: SectionStatus = "ok"): SectionResult => {
  r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : fallback;
  return r;
};

const trimmedLines = (s: string) => s.split(/\r?\n/).map((l) => l.trim());

const hasTrailingWhitespace = (s: string) => /[ \t]+\r?\n/.test(s) || /[ \t]+$/.test(s);

export const validateProblem = (form: FullProblemPayload): ValidationReport => {
  const sections: Record<TabId, SectionResult> = {
    basics: empty(),
    statement: empty(),
    examples: empty(),
    constraints: empty(),
    starter: empty(),
    reference: empty(),
    tests: empty(),
    sql: empty(),
    limits: ok(),
  };

  // ---------------- Basics ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const title = (form.title ?? "").trim();
    if (!title) r.errors.push({ field: "title", message: "Title is required" });
    else if (title.length < 3) r.errors.push({ field: "title", message: "Title must be at least 3 characters" });
    else if (title.length > 120) r.errors.push({ field: "title", message: "Title must be 120 chars or fewer" });
    else if (title !== form.title) r.warnings.push({ field: "title", message: "Title has leading/trailing whitespace" });

    const slug = form.slug ?? "";
    if (!slug.trim()) r.errors.push({ field: "slug", message: "Slug is required" });
    else if (!SLUG_RE.test(slug))
      r.errors.push({ field: "slug", message: "Slug must be lowercase letters, digits, hyphens (no spaces)" });
    else if (slug.length > 80) r.warnings.push({ field: "slug", message: "Slug is unusually long (>80 chars)" });

    if (!form.topics?.length) r.warnings.push({ field: "topics", message: "Add at least one topic to help discovery" });
    else {
      const seen = new Set<string>();
      form.topics.forEach((t, i) => {
        const norm = t.trim().toLowerCase();
        if (!t.trim()) r.errors.push({ field: `topics[${i}]`, message: `Topic #${i + 1} is empty` });
        else if (seen.has(norm)) r.warnings.push({ field: `topics[${i}]`, message: `Duplicate topic "${t}"` });
        seen.add(norm);
      });
      if (form.topics.length > 8) r.warnings.push({ field: "topics", message: "More than 8 topics may dilute discovery" });
    }
    sections.basics = finalize(r);
  }

  // ---------------- Statement ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const desc = (form.description ?? "").trim();
    if (!desc) r.errors.push({ field: "description", message: "Description is required" });
    else {
      if (desc.length < 50) r.warnings.push({ field: "description", message: "Description is very short (<50 chars)" });
      if (desc.length > 8000) r.warnings.push({ field: "description", message: "Description is very long (>8000 chars)" });
      if (hasTrailingWhitespace(form.description ?? ""))
        r.warnings.push({ field: "description", message: "Description has trailing whitespace on some lines" });
    }
    sections.statement = finalize(r);
  }

  // ---------------- Examples ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const examples = form.examples ?? [];
    const real = examples.filter((e) => e.input || e.output);
    if (real.length === 0) {
      r.errors.push({ field: "examples", message: "Add at least one example" });
    }
    examples.forEach((e, i) => {
      const fid = `examples[${i}]`;
      const hasAny = !!(e.input || e.output || e.explanation);
      if (!hasAny) return;
      if (!e.input?.trim()) r.errors.push({ field: `${fid}.input`, message: `Example ${i + 1}: input is empty` });
      if (!e.output?.trim()) r.errors.push({ field: `${fid}.output`, message: `Example ${i + 1}: output is empty` });
      if (e.input && hasTrailingWhitespace(e.input))
        r.warnings.push({ field: `${fid}.input`, message: `Example ${i + 1}: input has trailing whitespace` });
      if (e.output && hasTrailingWhitespace(e.output))
        r.warnings.push({ field: `${fid}.output`, message: `Example ${i + 1}: output has trailing whitespace` });
      if (e.input && e.input.length > 2000)
        r.warnings.push({ field: `${fid}.input`, message: `Example ${i + 1}: input is very large (>2KB)` });
      if (e.output && e.output.length > 2000)
        r.warnings.push({ field: `${fid}.output`, message: `Example ${i + 1}: output is very large (>2KB)` });
    });
    // Duplicate example inputs
    const seenIn = new Map<string, number>();
    examples.forEach((e, i) => {
      const k = (e.input ?? "").trim();
      if (!k) return;
      if (seenIn.has(k))
        r.warnings.push({ field: `examples[${i}].input`, message: `Example ${i + 1} duplicates example ${(seenIn.get(k) ?? 0) + 1} input` });
      else seenIn.set(k, i);
    });
    sections.examples = finalize(r);
  }

  // ---------------- Constraints & Hints ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const constraints = form.constraints ?? [];
    if (constraints.length === 0) {
      r.warnings.push({ field: "constraints", message: "No constraints listed" });
    } else {
      const seen = new Set<string>();
      let hasNumeric = false;
      constraints.forEach((c, i) => {
        const fid = `constraints[${i}]`;
        const trimmed = c.trim();
        if (!trimmed) {
          r.errors.push({ field: fid, message: `Constraint #${i + 1} is empty` });
          return;
        }
        if (trimmed.length > 200)
          r.warnings.push({ field: fid, message: `Constraint #${i + 1} is very long (>200 chars)` });
        if (trimmed !== c)
          r.warnings.push({ field: fid, message: `Constraint #${i + 1} has leading/trailing whitespace` });
        if (seen.has(trimmed))
          r.warnings.push({ field: fid, message: `Constraint #${i + 1} duplicates an earlier entry` });
        seen.add(trimmed);
        if (CONSTRAINT_HINT_RE.test(trimmed)) hasNumeric = true;

        // Numeric-bound consistency: lower must be <= upper.
        const m = trimmed.match(NUMERIC_RANGE_RE);
        if (m) {
          const lo = parseNumericLiteral(m[1]);
          const hi = parseNumericLiteral(m[2]);
          if (lo != null && hi != null && lo > hi) {
            r.errors.push({
              field: fid,
              message: `Constraint #${i + 1}: lower bound ${m[1]} > upper bound ${m[2]}`,
            });
          }
        }
        // Catch a common formatting slip: mixing < and <= e.g. "1 < n <= 5".
        if (/[^<>=]<\s*[A-Za-z_]/.test(trimmed) && /<=/.test(trimmed))
          r.warnings.push({
            field: fid,
            message: `Constraint #${i + 1}: mixes "<" and "<=" — pick one form for clarity`,
          });
      });
      if (!hasNumeric)
        r.warnings.push({ field: "constraints", message: "No numeric bounds detected (e.g. 1 <= n <= 10^5)" });
    }

    const hints = form.hints ?? [];
    if (hints.length === 0) {
      r.warnings.push({ field: "hints", message: "No hints listed" });
    } else {
      const seenHints = new Set<string>();
      hints.forEach((h, i) => {
        const fid = `hints[${i}]`;
        const trimmed = h.trim();
        if (!trimmed) {
          r.errors.push({ field: fid, message: `Hint #${i + 1} is empty` });
          return;
        }
        if (trimmed.length < 8)
          r.warnings.push({ field: fid, message: `Hint #${i + 1} is very short (<8 chars)` });
        if (trimmed.length > 400)
          r.warnings.push({ field: fid, message: `Hint #${i + 1} is too long (>400 chars) — split it up` });
        if (h !== trimmed)
          r.warnings.push({ field: fid, message: `Hint #${i + 1} has leading/trailing whitespace` });
        if (/\n{3,}/.test(h))
          r.warnings.push({ field: fid, message: `Hint #${i + 1} contains excessive blank lines` });
        const norm = trimmed.toLowerCase();
        if (seenHints.has(norm))
          r.warnings.push({ field: fid, message: `Hint #${i + 1} duplicates an earlier hint` });
        seenHints.add(norm);
      });
      if (hints.length > 5)
        r.warnings.push({ field: "hints", message: "More than 5 hints may over-spoil the problem" });
    }
    sections.constraints = finalize(r);
  }

  const isSqlOnly = !!form.sql_spec;

  // ---------------- Starter ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const entries = Object.entries(form.starter_code ?? {});
    const langs = entries.filter(([, v]) => (v ?? "").trim().length > 0);
    const refLangSet = new Set(
      Object.entries(form.reference_solution ?? {})
        .filter(([, v]) => (v ?? "").trim().length > 0)
        .map(([k]) => k),
    );
    if (!isSqlOnly) {
      if (langs.length === 0)
        r.errors.push({ field: "starter_code", message: "Provide starter code for at least one language" });
      else if (langs.length < 2)
        r.warnings.push({ field: "starter_code", message: "Consider adding starters for more languages" });
      langs.forEach(([lang, code]) => {
        const fid = `starter_code.${lang}`;
        if (code.trim().length < 10)
          r.warnings.push({ field: fid, message: `Starter for ${lang} looks too short` });
        if (hasTrailingWhitespace(code))
          r.warnings.push({ field: fid, message: `Starter for ${lang} has trailing whitespace` });
        if (/TODO|FIXME/i.test(code))
          r.warnings.push({ field: fid, message: `Starter for ${lang} still contains TODO/FIXME` });
        // Per-language consistency: if a reference exists for any language, every
        // starter should ideally have a matching reference for the same language.
        if (refLangSet.size > 0 && !refLangSet.has(lang))
          r.warnings.push({
            field: fid,
            message: `Starter exists for ${lang} but no matching reference solution`,
          });
      });
    }
    const baseStatus: SectionStatus = langs.length || isSqlOnly ? "ok" : "empty";
    sections.starter = finalize(r, baseStatus);
  }

  // ---------------- Reference ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const refEntries = Object.entries(form.reference_solution ?? {}).filter(([, v]) => (v ?? "").trim().length > 0);
    const starterLangSet = new Set(
      Object.entries(form.starter_code ?? {})
        .filter(([, v]) => (v ?? "").trim().length > 0)
        .map(([k]) => k),
    );
    if (!isSqlOnly) {
      if (refEntries.length === 0)
        r.errors.push({ field: "reference_solution", message: "Provide a reference solution for at least one language" });
      const refLangs = new Set(refEntries.map(([k]) => k));
      const overlap = [...starterLangSet].some((l) => refLangs.has(l));
      if (starterLangSet.size > 0 && refLangs.size > 0 && !overlap)
        r.warnings.push({ field: "reference_solution", message: "No language has both starter and reference" });
      refEntries.forEach(([lang, code]) => {
        const fid = `reference_solution.${lang}`;
        if (code.trim().length < 20)
          r.warnings.push({ field: fid, message: `Reference for ${lang} looks too short` });
        if (/TODO|FIXME/i.test(code))
          r.warnings.push({ field: fid, message: `Reference for ${lang} contains TODO/FIXME` });
        if (hasTrailingWhitespace(code))
          r.warnings.push({ field: fid, message: `Reference for ${lang} has trailing whitespace` });
        // Per-language consistency: surface references that lack a starter.
        if (starterLangSet.size > 0 && !starterLangSet.has(lang))
          r.warnings.push({
            field: fid,
            message: `Reference exists for ${lang} but no matching starter — learners will start from scratch`,
          });
      });
    }
    const baseStatus: SectionStatus = refEntries.length || isSqlOnly ? "ok" : "empty";
    sections.reference = finalize(r, baseStatus);
  }

  // ---------------- Tests ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (!isSqlOnly) {
      const samples = form.sample_tests ?? [];
      const hidden = form.hidden_tests ?? [];
      if (samples.length === 0) r.errors.push({ field: "sample_tests", message: "Add at least one sample test" });
      if (hidden.length === 0) r.errors.push({ field: "hidden_tests", message: "Add at least one hidden test" });
      if (hidden.length < 3) r.warnings.push({ field: "hidden_tests", message: "Fewer than 3 hidden tests — coverage may be weak" });

      const checkSet = (arr: { input: string; expected: string }[], kind: "sample_tests" | "hidden_tests", label: string) => {
        const seen = new Map<string, number>();
        arr.forEach((t, i) => {
          const fid = `${kind}[${i}]`;
          if (!t.input?.trim() && !t.expected?.trim()) {
            r.errors.push({ field: fid, message: `${label} #${i + 1} is empty` });
            return;
          }
          if (!t.input?.trim())
            r.errors.push({ field: `${fid}.input`, message: `${label} #${i + 1}: input is empty` });
          if (!t.expected?.trim())
            r.warnings.push({ field: `${fid}.expected`, message: `${label} #${i + 1}: expected output is empty` });
          if (t.input && hasTrailingWhitespace(t.input))
            r.warnings.push({ field: `${fid}.input`, message: `${label} #${i + 1}: input has trailing whitespace` });
          if (t.expected && hasTrailingWhitespace(t.expected))
            r.warnings.push({ field: `${fid}.expected`, message: `${label} #${i + 1}: expected has trailing whitespace` });
          if (t.input && t.input.length > 100_000)
            r.warnings.push({ field: `${fid}.input`, message: `${label} #${i + 1}: input >100KB may exceed limits` });
          const key = (t.input ?? "").trim();
          if (key) {
            if (seen.has(key))
              r.warnings.push({ field: `${fid}.input`, message: `${label} #${i + 1} duplicates ${label.toLowerCase()} #${(seen.get(key) ?? 0) + 1}` });
            else seen.set(key, i);
          }
        });
        return seen;
      };

      const sampleInputs = checkSet(samples, "sample_tests", "Sample");
      checkSet(hidden, "hidden_tests", "Hidden");

      hidden.forEach((t, i) => {
        const k = (t.input ?? "").trim();
        if (k && sampleInputs.has(k))
          r.warnings.push({ field: `hidden_tests[${i}].input`, message: `Hidden #${i + 1} input matches sample #${(sampleInputs.get(k) ?? 0) + 1}` });
      });

      // Cross-check: each example input ideally appears as a sample test
      (form.examples ?? []).forEach((e, i) => {
        const k = (e.input ?? "").trim();
        if (k && !sampleInputs.has(k))
          r.warnings.push({ field: "sample_tests", message: `Example ${i + 1} input is not covered by a sample test` });
      });
    }
    const baseStatus: SectionStatus = isSqlOnly ? "ok" : (form.sample_tests?.length ?? 0) > 0 ? "ok" : "empty";
    sections.tests = finalize(r, baseStatus);
  }

  // ---------------- SQL spec ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (isSqlOnly) {
      const s = form.sql_spec!;
      if (!s.schema_sql?.trim()) r.errors.push({ field: "sql_spec.schema_sql", message: "Schema SQL is required" });
      else if (!/create\s+table/i.test(s.schema_sql))
        r.warnings.push({ field: "sql_spec.schema_sql", message: "Schema doesn't appear to define any tables" });
      if (!s.seed_sql?.trim()) r.warnings.push({ field: "sql_spec.seed_sql", message: "Seed SQL is empty" });
      if (!s.reference_query?.trim())
        r.errors.push({ field: "sql_spec.reference_query", message: "Reference query is required" });
      else if (!/select/i.test(s.reference_query))
        r.warnings.push({ field: "sql_spec.reference_query", message: "Reference query has no SELECT" });
      sections.sql = finalize(r);
    } else {
      sections.sql = { status: "empty", errors: [], warnings: [] };
    }
  }

  // ---------------- Limits ----------------
  // Cross-checks the configured CPU/memory budget against the per-language Fermion
  // grading caps for every language that actually has starter or reference code (or SQL).
  // Anything above the language cap will be silently capped at grading time, so we
  // surface a per-field warning naming each affected language.
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const cpuSec = form.cpu_time_limit_sec;
    const memKb = form.memory_limit_kb;

    // Required + sane absolute bounds.
    if (cpuSec == null || cpuSec <= 0)
      r.errors.push({ field: "cpu_time_limit_sec", message: "CPU time limit must be > 0" });
    else {
      if (cpuSec < 0.25)
        r.errors.push({ field: "cpu_time_limit_sec", message: "CPU limit < 0.25s is below grader resolution" });
      if (cpuSec < 0.5)
        r.warnings.push({ field: "cpu_time_limit_sec", message: "CPU limit < 0.5s may cause flaky verdicts" });
      if (cpuSec > 10)
        r.warnings.push({ field: "cpu_time_limit_sec", message: "CPU limit > 10s slows grading and is rarely useful" });
    }
    if (memKb == null || memKb <= 0) {
      r.errors.push({ field: "memory_limit_kb", message: "Memory limit is required" });
    } else {
      if (memKb < 16_000)
        r.warnings.push({ field: "memory_limit_kb", message: "Memory < 16 MB is unusually low — may break interpreted languages" });
      if (!Number.isInteger(memKb))
        r.errors.push({ field: "memory_limit_kb", message: "Memory limit must be an integer KB value" });
    }

    // Determine which languages this problem actually targets so we only cross-check those.
    const isSqlOnly = !!form.sql_spec;
    const targetLangs: LangId[] = isSqlOnly
      ? (["sql"] as LangId[])
      : (Array.from(
          new Set([
            ...Object.entries(form.starter_code ?? {})
              .filter(([, v]) => (v ?? "").trim().length > 0)
              .map(([k]) => k as LangId),
            ...Object.entries(form.reference_solution ?? {})
              .filter(([, v]) => (v ?? "").trim().length > 0)
              .map(([k]) => k as LangId),
          ]),
        ));

    if (cpuSec && cpuSec > 0 && targetLangs.length > 0) {
      const requestedCpuMs = cpuSec * 1000;
      const cpuOver: { lang: LangId; capMs: number }[] = [];
      const cpuTight: { lang: LangId; capMs: number }[] = [];
      targetLangs.forEach((lang) => {
        const caps = getExecLimitsForLang(lang); // raw language cap (no overrides)
        if (requestedCpuMs > caps.cpuMs) cpuOver.push({ lang, capMs: caps.cpuMs });
        else if (caps.cpuMs - requestedCpuMs < 250) cpuTight.push({ lang, capMs: caps.cpuMs });
      });
      cpuOver.forEach(({ lang, capMs }) => {
        r.warnings.push({
          field: "cpu_time_limit_sec",
          message: `CPU ${cpuSec}s will be capped to ${(capMs / 1000).toFixed(1)}s for ${lang} at grading`,
        });
      });
      cpuTight.forEach(({ lang, capMs }) => {
        r.warnings.push({
          field: "cpu_time_limit_sec",
          message: `CPU budget for ${lang} is within 0.25s of its cap (${(capMs / 1000).toFixed(1)}s) — fast solutions may TLE intermittently`,
        });
      });
    }

    if (memKb && memKb > 0 && targetLangs.length > 0) {
      const memOver: { lang: LangId; capKb: number }[] = [];
      const memTight: { lang: LangId; capKb: number }[] = [];
      targetLangs.forEach((lang) => {
        const caps = getExecLimitsForLang(lang);
        if (memKb > caps.memKb) memOver.push({ lang, capKb: caps.memKb });
        else if (caps.memKb - memKb < 16_000) memTight.push({ lang, capKb: caps.memKb });
      });
      memOver.forEach(({ lang, capKb }) => {
        r.warnings.push({
          field: "memory_limit_kb",
          message: `Memory ${Math.round(memKb / 1024)} MB will be capped to ${Math.round(capKb / 1024)} MB for ${lang} at grading`,
        });
      });
      memTight.forEach(({ lang, capKb }) => {
        r.warnings.push({
          field: "memory_limit_kb",
          message: `Memory budget for ${lang} is within 16 MB of its cap (${Math.round(capKb / 1024)} MB)`,
        });
      });
    }

    // Internal consistency between CPU and memory budgets.
    if (cpuSec && memKb) {
      if (cpuSec < 1 && memKb > 256_000)
        r.warnings.push({
          field: "memory_limit_kb",
          message: "High memory (>256 MB) with very low CPU (<1s) is unusual — pick a preset or rebalance",
        });
      if (cpuSec > 5 && memKb < 64_000)
        r.warnings.push({
          field: "memory_limit_kb",
          message: "Long CPU (>5s) with tight memory (<64 MB) is unusual — long-running solutions usually need RAM",
        });
    }

    sections.limits = finalize(r);
  }

  const blocking: ValidationIssue[] = [];
  Object.values(sections).forEach((s) => blocking.push(...s.errors));

  return {
    sections,
    canPublish: blocking.length === 0,
    blockingErrors: blocking,
  };
};

export const TAB_LABELS: Record<TabId, string> = {
  basics: "Basics",
  statement: "Statement",
  examples: "Examples",
  constraints: "Constraints & Hints",
  starter: "Starter Code",
  reference: "Reference Solution",
  tests: "Tests",
  sql: "SQL Spec",
  limits: "Limits",
};

/**
 * Map a field id (e.g. "examples[2].output", "sql_spec.schema_sql", "title")
 * back to the editor tab it belongs to. Used by the publish checklist for jumps.
 */
export const fieldToTab = (field: string): TabId | null => {
  if (!field) return null;
  if (field === "title" || field === "slug" || field.startsWith("topics")) return "basics";
  if (field === "description") return "statement";
  if (field.startsWith("examples")) return "examples";
  if (field.startsWith("constraints") || field.startsWith("hints")) return "constraints";
  if (field.startsWith("starter_code")) return "starter";
  if (field.startsWith("reference_solution")) return "reference";
  if (field.startsWith("sample_tests") || field.startsWith("hidden_tests")) return "tests";
  if (field.startsWith("sql_spec")) return "sql";
  if (field === "cpu_time_limit_sec" || field === "memory_limit_kb") return "limits";
  return null;
};

