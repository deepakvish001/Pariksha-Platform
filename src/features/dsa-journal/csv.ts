import type { EntryWithDay, JournalEntry } from "./types";

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("|") : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const ENTRY_CSV_HEADERS = [
  "date",
  "title",
  "source",
  "links",
  "topic",
  "pattern",
  "algorithm",
  "difficulty",
  "status",
  "attempts",
  "solved_clean",
  "time_taken_min",
  "confidence",
  "time_complexity",
  "space_complexity",
  "tags",
  "companies",
  "favorite",
  "mistakes",
  "learnings",
  "notes",
  "next_revision_at",
  "mastered",
] as const;

export function entriesToCsv(entries: EntryWithDay[]): string {
  const rows = [ENTRY_CSV_HEADERS.join(",")];
  for (const e of entries) {
    rows.push(
      [
        e.day?.log_date ?? e.created_at.slice(0, 10),
        e.title,
        e.source ?? "",
        (e.links ?? []).map((l) => l.url).join("|"),
        e.topic ?? "",
        e.pattern ?? "",
        e.algorithm ?? "",
        e.difficulty ?? "",
        e.status,
        e.attempts,
        e.solved_clean,
        e.time_taken_min ?? "",
        e.confidence ?? "",
        e.time_complexity ?? "",
        e.space_complexity ?? "",
        e.tags ?? [],
        e.companies ?? [],
        e.is_favorite,
        e.mistakes ?? "",
        e.learnings ?? "",
        e.notes_md ?? "",
        e.next_revision_at ?? "",
        e.mastered_at ? "yes" : "",
      ]
        .map(esc)
        .join(","),
    );
  }
  return rows.join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function entriesToMarkdownSummary(
  entries: JournalEntry[],
  date: string,
): string {
  if (entries.length === 0) return `**${date}** — no problems logged today.`;
  const lines = [`**${date} — ${entries.length} problem${entries.length === 1 ? "" : "s"} solved**`, ""];
  for (const e of entries) {
    const meta = [
      e.difficulty,
      e.topic,
      e.pattern,
      e.time_taken_min != null ? `${e.time_taken_min}m` : null,
      e.solved_clean ? "clean" : `${e.attempts} attempts`,
    ]
      .filter(Boolean)
      .join(" · ");
    const link = e.links?.[0]?.url;
    lines.push(`- ${link ? `[${e.title}](${link})` : e.title}${meta ? ` — ${meta}` : ""}`);
  }
  return lines.join("\n");
}
