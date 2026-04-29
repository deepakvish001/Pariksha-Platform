import type { FullProblemPayload } from "@/hooks/useAdminProblems";

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

export interface SectionResult {
  status: SectionStatus;
  errors: string[];
  warnings: string[];
}

export interface ValidationReport {
  sections: Record<TabId, SectionResult>;
  canPublish: boolean;
  blockingErrors: string[];
}

const ok = (): SectionResult => ({ status: "ok", errors: [], warnings: [] });
const empty = (): SectionResult => ({ status: "empty", errors: [], warnings: [] });

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  const blocking: string[] = [];

  // Basics
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (!form.title?.trim()) r.errors.push("Title is required");
    else if (form.title.trim().length < 3) r.errors.push("Title must be at least 3 characters");
    else if (form.title.length > 120) r.errors.push("Title must be 120 chars or fewer");
    if (!form.slug?.trim()) r.errors.push("Slug is required");
    else if (!SLUG_RE.test(form.slug)) r.errors.push("Slug must be lowercase letters, digits, hyphens");
    if (!form.topics?.length) r.warnings.push("Add at least one topic to help discovery");
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : "ok";
    sections.basics = r;
  }

  // Statement
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const desc = (form.description ?? "").trim();
    if (!desc) r.errors.push("Description is required");
    else if (desc.length < 50) r.warnings.push("Description is very short (<50 chars)");
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : "ok";
    sections.statement = r;
  }

  // Examples
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const real = (form.examples ?? []).filter((e) => e.input || e.output);
    if (real.length === 0) r.errors.push("Add at least one example");
    real.forEach((e, i) => {
      if (!e.output) r.warnings.push(`Example ${i + 1} has no output`);
    });
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : "ok";
    sections.examples = r;
  }

  // Constraints/Hints (optional, but warn if empty)
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (!form.constraints?.length) r.warnings.push("No constraints listed");
    if (!form.hints?.length) r.warnings.push("No hints listed");
    r.status = r.warnings.length ? "warn" : "ok";
    sections.constraints = r;
  }

  const isSqlOnly = !!form.sql_spec;

  // Starter
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const langs = Object.entries(form.starter_code ?? {}).filter(([, v]) => (v ?? "").trim().length > 0);
    if (!isSqlOnly) {
      if (langs.length === 0) r.errors.push("Provide starter code for at least one language");
      else if (langs.length < 2) r.warnings.push("Consider adding starters for more languages");
    }
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : langs.length || isSqlOnly ? "ok" : "empty";
    sections.starter = r;
  }

  // Reference
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    const langs = Object.entries(form.reference_solution ?? {}).filter(([, v]) => (v ?? "").trim().length > 0);
    if (!isSqlOnly) {
      if (langs.length === 0) r.errors.push("Provide a reference solution for at least one language");
      // Ensure at least one starter language has a matching reference
      const starterLangs = new Set(
        Object.entries(form.starter_code ?? {})
          .filter(([, v]) => (v ?? "").trim().length > 0)
          .map(([k]) => k),
      );
      const refLangs = new Set(langs.map(([k]) => k));
      const overlap = [...starterLangs].some((l) => refLangs.has(l));
      if (starterLangs.size > 0 && refLangs.size > 0 && !overlap)
        r.warnings.push("No language has both starter and reference");
    }
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : langs.length || isSqlOnly ? "ok" : "empty";
    sections.reference = r;
  }

  // Tests
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (!isSqlOnly) {
      if ((form.sample_tests ?? []).length === 0) r.errors.push("Add at least one sample test");
      if ((form.hidden_tests ?? []).length === 0) r.errors.push("Add at least one hidden test");
      const sampleInputs = new Set((form.sample_tests ?? []).map((t) => t.input.trim()));
      const dup = (form.hidden_tests ?? []).some((t) => sampleInputs.has(t.input.trim()));
      if (dup) r.warnings.push("A hidden test has the same input as a sample test");
      (form.sample_tests ?? []).forEach((t, i) => {
        if (!t.expected) r.warnings.push(`Sample test #${i + 1} has empty expected output`);
      });
    }
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : isSqlOnly ? "ok" : (form.sample_tests?.length ?? 0) > 0 ? "ok" : "empty";
    sections.tests = r;
  }

  // SQL spec
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (isSqlOnly) {
      const s = form.sql_spec!;
      if (!s.schema_sql?.trim()) r.errors.push("Schema SQL is required");
      if (!s.seed_sql?.trim()) r.warnings.push("Seed SQL is empty");
      if (!s.reference_query?.trim()) r.errors.push("Reference query is required");
      r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : "ok";
    } else {
      r.status = "empty";
    }
    sections.sql = r;
  }

  // Limits
  {
    const r: SectionResult = { status: "ok", errors: [], warnings: [] };
    if (!form.cpu_time_limit_sec || form.cpu_time_limit_sec <= 0)
      r.errors.push("CPU time limit must be > 0");
    if (form.cpu_time_limit_sec && form.cpu_time_limit_sec > 10)
      r.warnings.push("CPU limit > 10s may slow grading");
    if (!form.memory_limit_kb || form.memory_limit_kb < 16000)
      r.warnings.push("Memory limit looks very low");
    r.status = r.errors.length ? "error" : r.warnings.length ? "warn" : "ok";
    sections.limits = r;
  }

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
