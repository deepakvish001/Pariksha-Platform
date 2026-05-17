/**
 * Centralised URL builders. Always prefer slug; fall back to UUID for legacy
 * rows that have not been backfilled.
 */
import { preferSlug } from "./slug";

type Identifiable = { id: string; slug?: string | null };

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
    ) =>
      `${basePath}/assessments/${preferSlug(a)}/attempts/${preferSlug(attempt)}`,
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
    attempt: (a: Identifiable, attempt: Identifiable) =>
      `/b2b/assessments/${preferSlug(a)}/attempts/${preferSlug(attempt)}`,
  },
};
