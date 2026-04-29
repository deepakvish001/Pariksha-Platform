import type { PlanTask } from "@/hooks/useStudyPlan";

const pad = (n: number) => String(n).padStart(2, "0");

/** Format a Date as YYYYMMDDTHHMMSS (floating local time, per RFC5545). */
const fmtLocal = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const fmtUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/** Escape per RFC5545: backslash, comma, semicolon, newline. */
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

interface Opts {
  /** Local hour to start the first task each day (24h). Default 9. */
  startHour?: number;
  /** Days from today to include. Default 28. */
  days?: number;
}

/**
 * Build an iCalendar (.ics) string for the next N days of a study plan.
 * Tasks are stacked sequentially starting at `startHour` each day, using est_minutes.
 */
export const buildPlanIcs = (tasks: PlanTask[], opts: Opts = {}): string => {
  const startHour = opts.startHour ?? 9;
  const days = opts.days ?? 28;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const todayIso = today.toISOString().slice(0, 10);

  const inRange = tasks
    .filter((t) => t.day_date >= todayIso && t.day_date < cutoffIso && t.status !== "skipped")
    .sort((a, b) => (a.day_date === b.day_date ? a.order_index - b.order_index : a.day_date.localeCompare(b.day_date)));

  // Group by day so we can stack sequentially
  const byDay = new Map<string, PlanTask[]>();
  for (const t of inRange) {
    const list = byDay.get(t.day_date) ?? [];
    list.push(t);
    byDay.set(t.day_date, list);
  }

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Byteskill//My Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Byteskill — My Plan",
  ];

  for (const [dayIso, dayTasks] of byDay) {
    const [y, m, d] = dayIso.split("-").map(Number);
    let cursor = new Date(y, m - 1, d, startHour, 0, 0, 0);
    for (const t of dayTasks) {
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + t.est_minutes * 60_000);
      cursor = end;
      const summary = `${t.topic} — ${t.title}`;
      const desc =
        `Difficulty: ${t.difficulty}\n` +
        `Estimated: ${t.est_minutes} min` +
        (t.source_url ? `\nResource: ${t.source_url}` : "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${t.id}@byteskill.app`,
        `DTSTAMP:${fmtUtc(now)}`,
        `DTSTART:${fmtLocal(start)}`,
        `DTEND:${fmtLocal(end)}`,
        `SUMMARY:${esc(summary)}`,
        `DESCRIPTION:${esc(desc)}`,
        ...(t.source_url ? [`URL:${esc(t.source_url)}`] : []),
        `CATEGORIES:${esc(t.difficulty.toUpperCase())},STUDY`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  // RFC5545 requires CRLF line endings
  return lines.join("\r\n");
};

export const downloadPlanIcs = (tasks: PlanTask[], opts: Opts = {}) => {
  const ics = buildPlanIcs(tasks, opts);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `byteskill-plan-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
