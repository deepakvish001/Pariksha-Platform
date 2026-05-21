export type Difficulty = "Easy" | "Medium" | "Hard";
export type EntryStatus = "solved" | "partial" | "stuck";
export type Language =
  | "Python"
  | "C++"
  | "Java"
  | "JavaScript"
  | "TypeScript"
  | "Go"
  | "Rust"
  | "C#"
  | "Other";

export interface JournalLink {
  label: string;
  url: string;
}

export interface JournalDay {
  id: string;
  user_id: string;
  log_date: string;
  mood: number | null;
  focus_minutes: number | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  day_id: string;
  title: string;
  links: JournalLink[];
  topic: string | null;
  pattern: string | null;
  algorithm: string | null;
  difficulty: Difficulty | null;
  personal_difficulty: number | null;
  time_taken_min: number | null;
  attempts: number;
  solved_clean: boolean;
  mistakes: string | null;
  learnings: string | null;
  notes_md: string | null;
  status: EntryStatus;
  tags: string[];
  next_revision_at: string | null;
  ease_factor: number;
  interval_days: number;
  mastered_at: string | null;
  created_at: string;
  updated_at: string;
  // Practice Hub additions
  code_snippet: string | null;
  language: Language | null;
  time_complexity: string | null;
  space_complexity: string | null;
  companies: string[];
  confidence: number | null;
  is_favorite: boolean;
  snoozed_until: string | null;
  source: string | null;
  archived_at: string | null;
  // Session tracking
  started_at: string | null;
  ended_at: string | null;
  session_label: string | null;
}

export interface JournalRevision {
  id: string;
  user_id: string;
  entry_id: string;
  revised_on: string;
  attempts: number;
  time_taken_min: number | null;
  solved_clean: boolean;
  note: string | null;
  created_at: string;
}

export interface EntryWithDay extends JournalEntry {
  day?: Pick<JournalDay, "log_date">;
}
