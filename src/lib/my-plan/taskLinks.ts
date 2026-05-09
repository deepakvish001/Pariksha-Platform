import type { PlanTask } from "@/hooks/useStudyPlan";

/** Resolve a plan task to a route in the app where the user can actually do the work. */
export const resolveTaskLink = (task: PlanTask): string | null => {
  if (task.source_url) return task.source_url;

  const topicSlug = (task.topic || "").trim().toLowerCase().replace(/\s+/g, "-");
  const idSlug = (task.source_id || "").trim();

  switch (task.source_type) {
    case "coding":
      return idSlug ? `/library/problems/${idSlug}` : `/library/problems`;
    case "dsa":
      return idSlug
        ? `/library/dsa-questions?topic=${encodeURIComponent(idSlug)}`
        : topicSlug
          ? `/library/dsa-questions?topic=${encodeURIComponent(topicSlug)}`
          : `/library/dsa-questions`;
    case "sql":
      return `/library/sql-questions${idSlug ? `?topic=${encodeURIComponent(idSlug)}` : ""}`;
    case "quiz":
      return idSlug ? `/library/quiz?category=${encodeURIComponent(idSlug)}` : `/library/quiz`;
    case "concept":
      return `/learn/roadmaps`;
    default:
      return null;
  }
};

export const taskLinkLabel = (task: PlanTask): string => {
  switch (task.source_type) {
    case "coding": return "Open problem";
    case "dsa": return "Open DSA";
    case "sql": return "Open SQL";
    case "quiz": return "Take quiz";
    case "concept": return "Open roadmap";
    default: return "Open";
  }
};
