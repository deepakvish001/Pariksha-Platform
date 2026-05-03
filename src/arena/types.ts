export type BattleDifficulty = "easy" | "medium" | "hard";
export type BattleStatus = "pending" | "live" | "ended" | "abandoned";

export interface Battle {
  id: string;
  player_a: string;
  player_b: string;
  problem_slug: string;
  topic: string | null;
  difficulty: BattleDifficulty;
  status: BattleStatus;
  duration_sec: number;
  started_at: string | null;
  ends_at: string | null;
  ended_at: string | null;
  winner_id: string | null;
  end_reason: string | null;
  is_private: boolean;
  invite_code: string | null;
  elo_a_before: number | null;
  elo_b_before: number | null;
  elo_a_after: number | null;
  elo_b_after: number | null;
  created_at: string;
}

export interface PlayerRating {
  user_id: string;
  elo: number;
  peak_elo: number;
  wins: number;
  losses: number;
  draws: number;
  current_streak: number;
  best_streak: number;
  total_battles: number;
  updated_at: string;
}

export interface BattleEvent {
  id: string;
  battle_id: string;
  user_id: string;
  kind: "typing" | "test_run" | "submit" | "passed_tests" | "finished" | "forfeit" | string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface BattleSubmission {
  id: string;
  battle_id: string;
  user_id: string;
  language: string;
  source_code: string;
  passed: number;
  total: number;
  verdict: string;
  runtime_ms: number | null;
  created_at: string;
}

export interface ArenaProfile extends PlayerRating {
  display_name: string | null;
  avatar_url: string | null;
}

export const TOPICS = [
  "arrays",
  "strings",
  "hash-table",
  "two-pointers",
  "binary-search",
  "dp",
  "graphs",
  "trees",
  "greedy",
  "math",
] as const;
export type ArenaTopic = (typeof TOPICS)[number];
