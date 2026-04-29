import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StudyProfile } from "./useStudyProfile";
import type { PlatformStat } from "./usePlatformStats";

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
  source_type: string | null;
  source_id: string | null;
  source_url: string | null;
  status: "pending" | "done" | "skipped";
  score: number | null;
  completed_at: string | null;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  plan: { summary?: string; weak_areas?: string[] };
  is_active: boolean;
  generated_at: string;
}

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generate = useCallback(
    async (profile: StudyProfile, platformStats: PlatformStat[], completedTopics: string[]) => {
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
              solved: {
                easy: s.solved_easy,
                medium: s.solved_medium,
                hard: s.solved_hard,
                total: s.solved_total,
              },
            })),
            completed_topics: completedTopics,
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
            }>;
          }>;
        };

        // Deactivate old plans
        await supabase
          .from("user_study_plans")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("is_active", true);

        const { data: newPlan, error: pErr } = await supabase
          .from("user_study_plans")
          .insert({
            user_id: user.id,
            plan: { summary: aiPlan.summary, weak_areas: aiPlan.weak_areas },
            model: "google/gemini-3-flash-preview",
            is_active: true,
          })
          .select()
          .single();
        if (pErr) throw pErr;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskRows = aiPlan.days.flatMap((day) =>
          day.tasks.map((t, idx) => {
            const d = new Date(today);
            d.setDate(d.getDate() + day.day_offset);
            return {
              plan_id: newPlan.id,
              user_id: user.id,
              day_date: d.toISOString().slice(0, 10),
              order_index: idx,
              topic: t.topic,
              title: t.title,
              difficulty: t.difficulty,
              est_minutes: t.est_minutes,
              source_type: t.source_type,
              status: "pending",
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
    [user, refresh]
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: PlanTask["status"], score?: number) => {
      const patch: Record<string, unknown> = { status };
      if (status === "done") patch.completed_at = new Date().toISOString();
      if (score !== undefined) patch.score = score;
      await supabase.from("user_study_plan_tasks").update(patch).eq("id", taskId);
      setTasks((cur) =>
        cur.map((t) => (t.id === taskId ? { ...t, ...patch, status } as PlanTask : t))
      );
    },
    []
  );

  return { plan, tasks, loading, generating, generate, updateTaskStatus, refresh };
};
