import type { Assessment } from "../hooks/useAssessments";

export type ScheduleState = "draft" | "scheduled" | "live" | "closed" | "archived";

export function getScheduleState(a: Pick<Assessment, "status" | "starts_at" | "ends_at">, now = Date.now()): ScheduleState {
  if (a.status === "archived") return "archived";
  if (a.status === "draft") return "draft";
  const start = a.starts_at ? new Date(a.starts_at).getTime() : null;
  const end = a.ends_at ? new Date(a.ends_at).getTime() : null;
  if (start && now < start) return "scheduled";
  if (end && now > end) return "closed";
  return "live";
}

function relative(ms: number) {
  const abs = Math.abs(ms);
  const min = Math.round(abs / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.round(hr / 24);
  return `${d}d`;
}

export function formatWindow(
  a: Pick<Assessment, "status" | "starts_at" | "ends_at">,
  now = Date.now()
): string {
  const state = getScheduleState(a, now);
  const start = a.starts_at ? new Date(a.starts_at).getTime() : null;
  const end = a.ends_at ? new Date(a.ends_at).getTime() : null;
  switch (state) {
    case "draft":
      return "Draft — not published";
    case "archived":
      return "Archived";
    case "scheduled":
      return start ? `Opens in ${relative(start - now)}` : "Scheduled";
    case "live":
      return end ? `Live · ${relative(end - now)} left` : "Live · open-ended";
    case "closed":
      return end ? `Closed ${relative(now - end)} ago` : "Closed";
  }
}

export function bucketAssessments<T extends Pick<Assessment, "status" | "starts_at" | "ends_at">>(
  list: T[],
  now = Date.now()
) {
  const live: T[] = [];
  const upcoming: T[] = [];
  const drafts: T[] = [];
  const closed: T[] = [];
  for (const a of list) {
    const s = getScheduleState(a, now);
    if (s === "live") live.push(a);
    else if (s === "scheduled") upcoming.push(a);
    else if (s === "draft") drafts.push(a);
    else closed.push(a);
  }
  return { live, upcoming, drafts, closed };
}
