/**
 * Centralised URL builders. Always prefer slug; fall back to UUID for legacy
 * rows that have not been backfilled.
 */
import { preferSlug, slugify } from "./slug";

type Identifiable = { id: string; slug?: string | null };

/** Best human label for a candidate, used as a URL prefix on attempt links. */
export type CandidateLike = {
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  external_id?: string | null;
} | null | undefined;

/** Separator between the candidate label and the attempt key in a URL segment. */
export const ATTEMPT_SEG_SEP = "--";

export function candidateSlug(c: CandidateLike): string {
  if (!c) return "";
  const raw =
    c.username ||
    c.name ||
    c.full_name ||
    (c.email ? c.email.split("@")[0] : "") ||
    c.external_id ||
    "";
  return slugify(raw);
}

/** Build the URL segment for an attempt, optionally prefixed with the candidate. */
export function attemptSegment(attempt: Identifiable, candidate?: CandidateLike): string {
  const key = preferSlug(attempt);
  const prefix = candidateSlug(candidate);
  return prefix ? `${prefix}${ATTEMPT_SEG_SEP}${key}` : key;
}

/** Extract the underlying attempt key (slug or UUID) from a URL segment. */
export function parseAttemptSegment(seg: string | undefined | null): string {
  if (!seg) return "";
  const idx = seg.lastIndexOf(ATTEMPT_SEG_SEP);
  return idx >= 0 ? seg.slice(idx + ATTEMPT_SEG_SEP.length) : seg;
}

export const paths = {
  /** B2B / org workspace */
  b2b: {
    assessmentsList: (basePath: string) => `${basePath}/assessments`,
    assessmentNew: (basePath: string) => `${basePath}/assessments/new`,
    assessment: (basePath: string, a: Identifiable) =>
      `${basePath}/assessments/${preferSlug(a)}`,
    assessmentManage: (basePath: string, a: Identifiable) =>
      `${basePath}/assessments/${preferSlug(a)}/manage`,
    attempt: (
      basePath: string,
      a: Identifiable,
      attempt: Identifiable,
      candidate?: CandidateLike,
    ) =>
      `${basePath}/assessments/${preferSlug(a)}/attempts/${attemptSegment(attempt, candidate)}`,
    candidate: (
      basePath: string,
      a: Identifiable,
      attempt: Identifiable,
      candidate?: CandidateLike,
    ) =>
      `${basePath}/assessments/${preferSlug(a)}/candidates/${attemptSegment(attempt, candidate)}`,
  },
  /** Student-facing assessment flow */
  student: {
    lobby: (attempt: Identifiable) => `/assessments/${preferSlug(attempt)}/lobby`,
    preflight: (attempt: Identifiable) =>
      `/assessments/${preferSlug(attempt)}/preflight`,
    play: (attempt: Identifiable, opts?: { preview?: boolean }) =>
      `/assessments/${preferSlug(attempt)}/play${opts?.preview ? "?preview=1" : ""}`,
  },
  /** Legacy /b2b/* fallback (organisation-less URLs) */
  legacy: {
    assessment: (a: Identifiable) => `/b2b/assessments/${preferSlug(a)}`,
    assessmentManage: (a: Identifiable) =>
      `/b2b/assessments/${preferSlug(a)}/manage`,
    attempt: (a: Identifiable, attempt: Identifiable, candidate?: CandidateLike) =>
      `/b2b/assessments/${preferSlug(a)}/attempts/${attemptSegment(attempt, candidate)}`,
    candidate: (a: Identifiable, attempt: Identifiable, candidate?: CandidateLike) =>
      `/b2b/assessments/${preferSlug(a)}/candidates/${attemptSegment(attempt, candidate)}`,
  },
};
