import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StudyProfile } from "./useStudyProfile";
import type { PlatformStat } from "./usePlatformStats";

export type PlanTaskStatus = "pending" | "in_progress" | "partial" | "done" | "skipped";

export interface PlanTask {
  id: string;
  plan_id: string;
  user_id: string;
  day_date: string;
  order_index: number;
  topic: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  est_minutes: number;
  actual_minutes: number | null;
  source_type: string | null;
  source_id: string | null;
  source_url: string | null;
  status: PlanTaskStatus;
  score: number | null;
  completed_at: string | null;
  started_at: string | null;
  locked: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  plan: { summary?: string; weak_areas?: string[] };
  is_active: boolean;
  generated_at: string;
}

const todayIso = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
};

export const useStudyPlan = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: planRow } = await supabase
      .from("user_study_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPlan((planRow as StudyPlan) ?? null);

    if (planRow) {
      const { data: tRows } = await supabase
        .from("user_study_plan_tasks")
        .select("*")
        .eq("plan_id", planRow.id)
        .order("day_date")
        .order("order_index");
      setTasks((tRows as PlanTask[]) ?? []);
    } else {
      setTasks([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const generate = useCallback(
    async (
      profile: StudyProfile,
      platformStats: PlatformStat[],
      completedTopics: string[],
      opts?: { fromDayOffset?: number; preserveLocked?: boolean }
    ) => {
      if (!user) throw new Error("Not signed in");
      setGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-study-plan", {
          body: {
            profile: {
              goal: profile.goal,
              target_date: profile.target_date,
              weekday_minutes: profile.weekday_minutes,
              weekend_minutes: profile.weekend_minutes,
              level: profile.level,
              topics_known: profile.topics_known,
            },
            platform_stats: platformStats.map((s) => ({
              platform: s.platform,
              rating: s.rating,
              solved: { easy: s.solved_easy, medium: s.solved_medium, hard: s.solved_hard, total: s.solved_total },
            })),
            completed_topics: completedTopics,
            partial: opts?.fromDayOffset != null ? { from_day_offset: opts.fromDayOffset } : undefined,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const aiPlan = data.plan as {
          summary: string;
          weak_areas: string[];
          days: Array<{
            day_offset: number;
            tasks: Array<{
              topic: string;
              title: string;
              difficulty: "easy" | "medium" | "hard";
              est_minutes: number;
              source_type: string;
              source_id?: string | null;
              source_url?: string | null;
            }>;
          }>;
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromOffset = opts?.fromDayOffset ?? 0;

        let activePlanId: string;

        if (fromOffset === 0) {
          // Full re-plan: deactivate everything and start fresh
          await supabase.from("user_study_plans").update({ is_active: false })
            .eq("user_id", user.id).eq("is_active", true);

          const { data: newPlan, error: pErr } = await supabase
            .from("user_study_plans")
            .insert({
              user_id: user.id,
              plan: { summary: aiPlan.summary, weak_areas: aiPlan.weak_areas },
              model: "google/gemini-3-flash-preview",
              is_active: true,
            })
            .select().single();
          if (pErr) throw pErr;
          activePlanId = newPlan.id;
        } else {
          // Partial re-plan: keep existing plan, delete unlocked tasks from cutoff onward
          if (!plan) throw new Error("No active plan to re-plan");
          activePlanId = plan.id;
          const cutoff = new Date(today);
          cutoff.setDate(cutoff.getDate() + fromOffset);
          const cutoffIso = cutoff.toISOString().slice(0, 10);
          let del = supabase.from("user_study_plan_tasks").delete()
            .eq("plan_id", plan.id).gte("day_date", cutoffIso);
          if (opts?.preserveLocked) del = del.eq("locked", false);
          const { error: delErr } = await del;
          if (delErr) throw delErr;

          // Update summary/weak areas on the existing plan
          await supabase.from("user_study_plans")
            .update({ plan: { summary: aiPlan.summary, weak_areas: aiPlan.weak_areas } })
            .eq("id", plan.id);
        }

        const taskRows = aiPlan.days.flatMap((day) =>
          day.tasks.map((t, idx) => {
            const d = new Date(today);
            d.setDate(d.getDate() + day.day_offset);
            return {
              plan_id: activePlanId,
              user_id: user.id,
              day_date: d.toISOString().slice(0, 10),
              order_index: idx,
              topic: t.topic,
              title: t.title,
              difficulty: t.difficulty,
              est_minutes: t.est_minutes,
              source_type: t.source_type,
              source_id: t.source_id ?? null,
              source_url: t.source_url ?? null,
              status: "pending" as const,
            };
          })
        );
        if (taskRows.length > 0) {
          const { error: tErr } = await supabase.from("user_study_plan_tasks").insert(taskRows);
          if (tErr) throw tErr;
        }
        await refresh();
      } finally {
        setGenerating(false);
      }
    },
    [user, plan, refresh]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: PlanTaskStatus, score?: number) => {
      const patch: Record<string, unknown> = { status };
      if (status === "done") patch.completed_at = new Date().toISOString();
      if (status === "in_progress") patch.started_at = new Date().toISOString();
      if (score !== undefined) patch.score = score;
      await supabase.from("user_study_plan_tasks").update(patch).eq("id", taskId);
      setTasks((cur) =>
        cur.map((t) => (t.id === taskId ? { ...t, ...patch, status } as PlanTask : t))
      );
    },
    []
  );

  const moveTaskToDay = useCallback(async (taskId: string, newDay: string) => {
    setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, day_date: newDay } : t)));
    const { error } = await supabase
      .from("user_study_plan_tasks").update({ day_date: newDay }).eq("id", taskId);
    if (error) { await refresh(); throw error; }
  }, [refresh]);

  const toggleLock = useCallback(async (taskId: string, locked: boolean) => {
    setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, locked } : t)));
    const { error } = await supabase
      .from("user_study_plan_tasks").update({ locked }).eq("id", taskId);
    if (error) { await refresh(); throw error; }
  }, [refresh]);

  const setActualMinutes = useCallback(async (taskId: string, minutes: number) => {
    setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, actual_minutes: minutes } : t)));
    const { error } = await supabase
      .from("user_study_plan_tasks").update({ actual_minutes: minutes }).eq("id", taskId);
    if (error) { await refresh(); throw error; }
  }, [refresh]);

  const addAdhocTask = useCallback(
    async (input: {
      title: string; topic: string; difficulty: "easy" | "medium" | "hard";
      est_minutes: number; day_date: string;
      scheduled_start?: string | null;
      scheduled_end?: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      if (!plan) throw new Error("Generate a plan first");
      const sameDay = tasks.filter((t) => t.day_date === input.day_date);
      const order_index = sameDay.length;
      const { data, error } = await supabase.from("user_study_plan_tasks").insert({
        plan_id: plan.id,
        user_id: user.id,
        day_date: input.day_date,
        order_index,
        topic: input.topic,
        title: input.title,
        difficulty: input.difficulty,
        est_minutes: input.est_minutes,
        source_type: "custom",
        status: "pending" as const,
        scheduled_start: input.scheduled_start ?? null,
        scheduled_end: input.scheduled_end ?? null,
      }).select().single();
      if (error) throw error;
      setTasks((cur) => [...cur, data as PlanTask]);
    },
    [user, plan, tasks]
  );

  /** Bulk-update the status of many tasks at once. Returns previous statuses for undo. */
  const bulkUpdateStatus = useCallback(
    async (taskIds: string[], status: PlanTaskStatus) => {
      if (taskIds.length === 0) return [];
      const previous = tasks
        .filter((t) => taskIds.includes(t.id))
        .map((t) => ({ id: t.id, status: t.status, completed_at: t.completed_at }));
      const patch: Record<string, unknown> = { status };
      if (status === "done") patch.completed_at = new Date().toISOString();
      else if (status === "pending") patch.completed_at = null;
      // Optimistic
      setTasks((cur) =>
        cur.map((t) =>
          taskIds.includes(t.id) ? { ...t, ...patch, status } as PlanTask : t
        )
      );
      const { error } = await supabase
        .from("user_study_plan_tasks")
        .update(patch)
        .in("id", taskIds);
      if (error) { await refresh(); throw error; }
      return previous;
    },
    [tasks, refresh]
  );

  /** Restore a snapshot returned from bulkUpdateStatus. */
  const restoreStatuses = useCallback(
    async (snapshot: Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>) => {
      if (snapshot.length === 0) return;
      // Optimistic restore
      setTasks((cur) =>
        cur.map((t) => {
          const s = snapshot.find((x) => x.id === t.id);
          return s ? { ...t, status: s.status, completed_at: s.completed_at } : t;
        })
      );
      // Group by (status, completed_at) so we can update in batches
      const byKey = new Map<string, { status: PlanTaskStatus; completed_at: string | null; ids: string[] }>();
      for (const s of snapshot) {
        const key = `${s.status}|${s.completed_at ?? ""}`;
        const e = byKey.get(key) ?? { status: s.status, completed_at: s.completed_at, ids: [] };
        e.ids.push(s.id);
        byKey.set(key, e);
      }
      await Promise.all(
        Array.from(byKey.values()).map((g) =>
          supabase.from("user_study_plan_tasks")
            .update({ status: g.status, completed_at: g.completed_at })
            .in("id", g.ids)
        )
      );
    },
    []
  );

  /** Snapshot of (id, day_date) for undoing moves. */
  type DaySnapshot = Array<{ id: string; day_date: string }>;

  /** Bulk move many tasks to a new day. Returns prior day_dates for undo. */
  const bulkMoveToDay = useCallback(
    async (taskIds: string[], newDay: string): Promise<DaySnapshot> => {
      if (taskIds.length === 0) return [];
      const previous: DaySnapshot = tasks
        .filter((t) => taskIds.includes(t.id))
        .map((t) => ({ id: t.id, day_date: t.day_date }));
      setTasks((cur) =>
        cur.map((t) => (taskIds.includes(t.id) ? { ...t, day_date: newDay } : t))
      );
      const { error } = await supabase
        .from("user_study_plan_tasks")
        .update({ day_date: newDay })
        .in("id", taskIds);
      if (error) { await refresh(); throw error; }
      return previous;
    },
    [tasks, refresh]
  );

  /** Restore per-task day_date from a snapshot. */
  const restoreDays = useCallback(async (snapshot: DaySnapshot) => {
    if (snapshot.length === 0) return;
    setTasks((cur) =>
      cur.map((t) => {
        const s = snapshot.find((x) => x.id === t.id);
        return s ? { ...t, day_date: s.day_date } : t;
      })
    );
    const byDay = new Map<string, string[]>();
    for (const s of snapshot) {
      const arr = byDay.get(s.day_date) ?? [];
      arr.push(s.id);
      byDay.set(s.day_date, arr);
    }
    await Promise.all(
      Array.from(byDay.entries()).map(([day, ids]) =>
        supabase.from("user_study_plan_tasks").update({ day_date: day }).in("id", ids)
      )
    );
  }, []);

  /** Move all overdue (pending/in_progress) tasks to today and the next few days, respecting time budget. */
  const catchUp = useCallback(
    async (weekdayBudget: number, weekendBudget: number) => {
      const today = todayIso();
      const overdue = tasks.filter(
        (t) => t.day_date < today && (t.status === "pending" || t.status === "in_progress")
      );
      if (overdue.length === 0) return 0;

      // Build a queue of next 14 days with remaining capacity
      const days: { iso: string; remaining: number }[] = [];
      const t0 = new Date();
      t0.setHours(0, 0, 0, 0);
      for (let i = 0; i < 14; i++) {
        const d = new Date(t0);
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const budget = isWeekend ? weekendBudget : weekdayBudget;
        const used = tasks
          .filter((tt) => tt.day_date === iso && tt.status !== "skipped")
          .reduce((s, tt) => s + tt.est_minutes, 0);
        days.push({ iso, remaining: Math.max(0, budget - used) });
      }

      const updates: { id: string; day_date: string }[] = [];
      for (const task of overdue) {
        const slot = days.find((d) => d.remaining >= task.est_minutes) ?? days[days.length - 1];
        slot.remaining = Math.max(0, slot.remaining - task.est_minutes);
        updates.push({ id: task.id, day_date: slot.iso });
      }

      // Apply in parallel
      await Promise.all(
        updates.map((u) =>
          supabase.from("user_study_plan_tasks").update({ day_date: u.day_date }).eq("id", u.id)
        )
      );
      await refresh();
      return updates.length;
    },
    [tasks, refresh]
  );

  return {
    plan, tasks, loading, generating,
    generate, updateTaskStatus, moveTaskToDay, toggleLock, setActualMinutes, catchUp,
    addAdhocTask, bulkUpdateStatus, restoreStatuses, refresh,
  };
};
