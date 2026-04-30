import { z } from "zod";

/**
 * Single source of truth for gamification rule schemas.
 * MUST stay in sync with the `admin_set_gamification_rule` RPC allow-list.
 */
export interface RuleSpec {
  key: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  integer: boolean;
  default: number;
}

export const GAMIFICATION_RULES: RuleSpec[] = [
  { key: "xp_per_quiz_correct",   label: "XP per quiz correct answer",  hint: "Awarded for each right answer in a quiz",                  min: 0,    max: 100,    integer: true,  default: 5 },
  { key: "xp_per_problem_easy",   label: "XP per easy problem solved",  hint: "First-time accept on an easy problem",                     min: 0,    max: 500,    integer: true,  default: 10 },
  { key: "xp_per_problem_medium", label: "XP per medium problem solved",hint: "First-time accept on a medium problem",                   min: 0,    max: 500,    integer: true,  default: 25 },
  { key: "xp_per_problem_hard",   label: "XP per hard problem solved",  hint: "First-time accept on a hard problem",                     min: 0,    max: 1000,   integer: true,  default: 50 },
  { key: "xp_per_srs_review",     label: "XP per SRS review",           hint: "Awarded for each spaced-repetition review completed",     min: 0,    max: 100,    integer: true,  default: 2 },
  { key: "xp_per_streak_day",     label: "XP per daily streak",         hint: "Awarded each day a user keeps their study streak",        min: 0,    max: 500,    integer: true,  default: 15 },
  { key: "xp_per_achievement",    label: "XP per achievement",          hint: "Awarded when a user unlocks an achievement",              min: 0,    max: 1000,   integer: true,  default: 30 },
  { key: "level_xp_multiplier",   label: "Level XP multiplier",         hint: "XP needed for next level = level × multiplier × 100",     min: 0.1,  max: 10,     integer: false, default: 1 },
  { key: "daily_xp_cap",          label: "Daily XP cap",                hint: "Maximum XP a user can earn per day (0 = no cap)",         min: 0,    max: 100000, integer: true,  default: 0 },
  { key: "weekly_xp_cap",         label: "Weekly XP cap",               hint: "Maximum XP a user can earn per week (0 = no cap)",        min: 0,    max: 500000, integer: true,  default: 0 },
];

export const RULE_BY_KEY: Record<string, RuleSpec> = Object.fromEntries(
  GAMIFICATION_RULES.map((r) => [r.key, r])
);

export const stripPrefix = (k: string) => k.replace(/^gamification\./, "");

export const noteSchema = z
  .string()
  .trim()
  .max(500, { message: "Note must be 500 characters or fewer" })
  .optional();

export const buildValueSchema = (spec: RuleSpec) => {
  let s = z
    .number({ invalid_type_error: "Value must be a number" })
    .finite("Value must be a finite number")
    .min(spec.min, { message: `Value must be ≥ ${spec.min}` })
    .max(spec.max, { message: `Value must be ≤ ${spec.max}` });
  if (spec.integer) s = s.int("Value must be a whole number");
  return s;
};

export interface ValidationResult {
  ok: boolean;
  value?: number;
  error?: string;
}

export const validateRuleInput = (
  key: string,
  rawValue: string,
  rawNote?: string
): ValidationResult => {
  const short = stripPrefix(key.trim());
  const spec = RULE_BY_KEY[short];
  if (!spec) return { ok: false, error: `Unknown rule key: ${short}` };

  if (!rawValue?.toString().trim()) return { ok: false, error: "Value is required" };
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return { ok: false, error: "Value must be a number" };

  const valueSchema = buildValueSchema(spec);
  const v = valueSchema.safeParse(parsed);
  if (!v.success) return { ok: false, error: v.error.issues[0]?.message ?? "Invalid value" };

  const n = noteSchema.safeParse(rawNote);
  if (!n.success) return { ok: false, error: n.error.issues[0]?.message ?? "Invalid note" };

  return { ok: true, value: parsed };
};
