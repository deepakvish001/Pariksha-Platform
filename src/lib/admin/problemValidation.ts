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
        if (seen.has(trimmed))
          r.warnings.push({ field: fid, message: `Constraint #${i + 1} duplicates an earlier entry` });
        seen.add(trimmed);
        if (CONSTRAINT_HINT_RE.test(trimmed)) hasNumeric = true;
      });
      if (!hasNumeric)
        r.warnings.push({ field: "constraints", message: "No numeric bounds detected (e.g. 1 <= n <= 10^5)" });
    }

    const hints = form.hints ?? [];
    if (hints.length === 0) {
      r.warnings.push({ field: "hints", message: "No hints listed" });
    } else {
      hints.forEach((h, i) => {
        if (!h.trim()) r.errors.push({ field: `hints[${i}]`, message: `Hint #${i + 1} is empty` });
        else if (h.trim().length < 8)
          r.warnings.push({ field: `hints[${i}]`, message: `Hint #${i + 1} is very short` });
      });
    }
    sections.constraints = finalize(r);
  }

  const isSqlOnly = !!form.sql_spec;

  // ---------------- Starter ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const entries = Object.entries(form.starter_code ?? {});
    const langs = entries.filter(([, v]) => (v ?? "").trim().length > 0);
    if (!isSqlOnly) {
      if (langs.length === 0)
        r.errors.push({ field: "starter_code", message: "Provide starter code for at least one language" });
      else if (langs.length < 2)
        r.warnings.push({ field: "starter_code", message: "Consider adding starters for more languages" });
      langs.forEach(([lang, code]) => {
        if (code.length < 10)
          r.warnings.push({ field: `starter_code.${lang}`, message: `Starter for ${lang} looks too short` });
      });
    }
    const baseStatus: SectionStatus = langs.length || isSqlOnly ? "ok" : "empty";
    sections.starter = finalize(r, baseStatus);
  }

  // ---------------- Reference ----------------
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const refEntries = Object.entries(form.reference_solution ?? {}).filter(([, v]) => (v ?? "").trim().length > 0);
    if (!isSqlOnly) {
      if (refEntries.length === 0)
        r.errors.push({ field: "reference_solution", message: "Provide a reference solution for at least one language" });
      const starterLangs = new Set(
        Object.entries(form.starter_code ?? {})
          .filter(([, v]) => (v ?? "").trim().length > 0)
          .map(([k]) => k),
      );
      const refLangs = new Set(refEntries.map(([k]) => k));
      const overlap = [...starterLangs].some((l) => refLangs.has(l));
      if (starterLangs.size > 0 && refLangs.size > 0 && !overlap)
        r.warnings.push({ field: "reference_solution", message: "No language has both starter and reference" });
      refEntries.forEach(([lang, code]) => {
        if (code.length < 20)
          r.warnings.push({ field: `reference_solution.${lang}`, message: `Reference for ${lang} looks too short` });
        if (/TODO|FIXME/i.test(code))
          r.warnings.push({ field: `reference_solution.${lang}`, message: `Reference for ${lang} contains TODO/FIXME` });
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
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const cpu = form.cpu_time_limit_sec;
    const mem = form.memory_limit_kb;
    if (cpu == null || cpu <= 0)
      r.errors.push({ field: "cpu_time_limit_sec", message: "CPU time limit must be > 0" });
    else {
      if (cpu < 0.5) r.warnings.push({ field: "cpu_time_limit_sec", message: "CPU limit < 0.5s may cause flakiness" });
      if (cpu > 10) r.warnings.push({ field: "cpu_time_limit_sec", message: "CPU limit > 10s may slow grading" });
      if (cpu > 5) r.warnings.push({ field: "cpu_time_limit_sec", message: "CPU limit > 5s exceeds Fermion safe max (will be capped)" });
    }
    if (mem == null || mem <= 0)
      r.errors.push({ field: "memory_limit_kb", message: "Memory limit is required" });
    else {
      if (mem < 16_000) r.warnings.push({ field: "memory_limit_kb", message: "Memory < 16 MB is unusually low" });
      if (mem > 512_000) r.warnings.push({ field: "memory_limit_kb", message: "Memory > 512 MB exceeds Fermion safe max (will be capped)" });
    }
    // Consistency: heavy memory + tiny CPU is a smell
    if (cpu && mem && cpu < 1 && mem > 256_000)
      r.warnings.push({ field: "memory_limit_kb", message: "High memory with very low CPU limit is unusual" });
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
