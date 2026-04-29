import type { PlanTask } from "@/hooks/useStudyPlan";

export type Difficulty = "easy" | "medium" | "hard";

const ORDER: Difficulty[] = ["easy", "medium", "hard"];

const stepDifficulty = (d: Difficulty, delta: number): Difficulty => {
  const idx = ORDER.indexOf(d);
  const next = Math.max(0, Math.min(ORDER.length - 1, idx + delta));
  return ORDER[next];
};

/**
 * Compute the next recommended task based on the latest completed task's score.
 * Score convention (matches updateTaskStatus): 0..100. Falls back to status alone.
 *
 * Logic:
 *  - score >= 80 (or status done with no score after a streak of 2 dones) → bump difficulty +1
 *  - score <= 40 (or task skipped / unfinished) → drop difficulty -1, prefer same topic for reinforcement
 *  - otherwise keep same difficulty
 */
export interface NextRecommendation {
  task: PlanTask;
  reason: string;
  difficultyDelta: -1 | 0 | 1;
}

export const getNextRecommendation = (
  tasks: PlanTask[]
): NextRecommendation | null => {
  if (tasks.length === 0) return null;

  // Find pending tasks (today + future), keep order
  const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10);
  const upcoming = tasks
    .filter((t) => t.status === "pending" && t.day_date >= todayIso)
    .sort((a, b) => (a.day_date.localeCompare(b.day_date) || a.order_index - b.order_index));

  if (upcoming.length === 0) return null;

  // Most recent finished task (done or skipped) — newest by completed_at or day
  const finished = tasks
    .filter((t) => t.status !== "pending")
    .sort((a, b) => {
      const ad = a.completed_at ?? a.day_date;
      const bd = b.completed_at ?? b.day_date;
      return bd.localeCompare(ad);
    });
  const last = finished[0];

  let delta: -1 | 0 | 1 = 0;
  let reason = "Continuing your scheduled plan";
  let preferTopic: string | null = null;

  if (last) {
    const score = last.score ?? null;
    if (last.status === "skipped" || (score !== null && score <= 40)) {
      delta = -1;
      preferTopic = last.topic;
      reason = `Last attempt on "${last.topic}" was tough — easing difficulty and reinforcing the topic`;
    } else if (score !== null && score >= 80) {
      delta = 1;
      reason = `Strong run on "${last.topic}" (${score}%) — pushing difficulty up`;
    } else if (last.status === "done") {
      // Streak of 2+ recent dones bumps difficulty
      const recentTwo = finished.slice(0, 2);
      if (recentTwo.length === 2 && recentTwo.every((t) => t.status === "done")) {
        delta = 1;
        reason = `2 in a row completed — leveling up difficulty`;
      } else {
        reason = `Nice work on "${last.topic}" — staying at the same level`;
      }
    }
  }

  // Pick the best matching upcoming task
  const targetDiff = last ? stepDifficulty(last.difficulty as Difficulty, delta) : (upcoming[0].difficulty as Difficulty);

  // 1) same topic + target difficulty (if reinforcing)
  if (preferTopic) {
    const m = upcoming.find((t) => t.topic === preferTopic && t.difficulty === targetDiff);
    if (m) return { task: m, reason, difficultyDelta: delta };
    const m2 = upcoming.find((t) => t.topic === preferTopic);
    if (m2) return { task: m2, reason, difficultyDelta: delta };
  }
  // 2) target difficulty
  const m3 = upcoming.find((t) => t.difficulty === targetDiff);
  if (m3) return { task: m3, reason, difficultyDelta: delta };
  // 3) fallback first upcoming
  return { task: upcoming[0], reason, difficultyDelta: delta };
};
