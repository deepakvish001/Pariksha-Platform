import type { QuestionType } from "../../hooks/useQuestions";

export type Language = "javascript" | "typescript" | "python" | "java" | "cpp";
export type Difficulty = "easy" | "medium" | "hard";
export type SqlDialect = "postgres" | "mysql" | "sqlite";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export const SQL_DIALECTS: { value: SqlDialect; label: string }[] = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
];

export type CodingExample = { input: string; output: string; explanation?: string };

export type CodingMeta = {
  status?: "draft" | "published";
  difficulty?: Difficulty;
  tags?: string[];
  time_limit_ms?: number;
  est_minutes?: number;
  constraints?: string[];
  examples?: CodingExample[];
  function_signature?: string;
  starter_code?: Partial<Record<Language, string>>;
  allowed_languages?: Language[];
  reference_solution?: { language: Language; code: string };
  complexity?: { time?: string; space?: string };
  hints?: string[];
};

export type CodingTestCase = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
  weight: number;
  label?: string;
  explanation?: string;
};

export type SqlMeta = {
  status?: "draft" | "published";
  difficulty?: Difficulty;
  tags?: string[];
  dialect?: SqlDialect;
  schema_ddl?: string;
  seed_sql?: string;
  reference_query?: string;
  order_sensitive?: boolean;
  hints?: string[];
};

export const TYPE_CARDS: {
  value: QuestionType;
  label: string;
  description: string;
  bestFor: string;
  icon: "code" | "list" | "database" | "pen" | "check" | "shuffle" | "type" | "hash" | "blank";
}[] = [
  { value: "coding",      label: "Coding",            description: "Full algorithmic problem with tests and starter code",  bestFor: "Engineering screens, DSA practice",      icon: "code" },
  { value: "sql",         label: "SQL",               description: "Schema, seed data, and a reference query",              bestFor: "Data analyst / backend roles",           icon: "database" },
  { value: "mcq",         label: "Multiple choice",   description: "One or many correct options with rationale",            bestFor: "Knowledge checks, fundamentals",         icon: "list" },
  { value: "true_false",  label: "True / False",      description: "Quick correctness call on a statement",                  bestFor: "Concept warm-ups",                       icon: "check" },
  { value: "short_answer",label: "Short answer",      description: "Free-text input matched to accepted variants",          bestFor: "Definitions, terminology",               icon: "type" },
  { value: "numerical",   label: "Numerical",         description: "Numeric answer with tolerance and unit",                 bestFor: "Quant, finance, physics",                icon: "hash" },
  { value: "matching",    label: "Matching",          description: "Pair left items to right items",                         bestFor: "Mapping concepts, translations",         icon: "shuffle" },
  { value: "fill_blanks", label: "Fill in the blanks",description: "Inline blanks placed in the prompt",                     bestFor: "Code completion, syntax recall",         icon: "blank" },
  { value: "subjective",  label: "Subjective",        description: "Long-form response, graded manually",                    bestFor: "System design, case studies",            icon: "pen" },
];

export type { QuestionType };
