import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FocusState {
  active: boolean;
  taskId: string | null;
  taskTitle: string | null;
  phase: "work" | "break";
  /** seconds remaining in the current phase */
  remaining: number;
  cyclesCompleted: number;
  startedAt: number | null;
}

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const initial: FocusState = {
  active: false,
  taskId: null,
  taskTitle: null,
  phase: "work",
  remaining: WORK_SECONDS,
  cyclesCompleted: 0,
  startedAt: null,
};

export const useFocusSession = () => {
  const { user } = useAuth();
  const [state, setState] = useState<FocusState>(initial);
  const sessionRowId = useRef<string | null>(null);
  const totalWorkMs = useRef(0); // cumulative work time across cycles in this run

  // Tick every second when active
  useEffect(() => {
    if (!state.active) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (!s.active) return s;
        if (s.remaining > 1) return { ...s, remaining: s.remaining - 1 };
        // Phase transition
        if (s.phase === "work") {
          totalWorkMs.current += WORK_SECONDS * 1000;
          return { ...s, phase: "break", remaining: BREAK_SECONDS, cyclesCompleted: s.cyclesCompleted + 1 };
        }
        return { ...s, phase: "work", remaining: WORK_SECONDS };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.active]);

  const start = useCallback(async (taskId: string, taskTitle: string) => {
    if (!user) return;
    totalWorkMs.current = 0;
    sessionRowId.current = null;
    const { data } = await supabase.from("user_study_focus_sessions")
      .insert({ user_id: user.id, task_id: taskId, started_at: new Date().toISOString() })
      .select("id").single();
    sessionRowId.current = data?.id ?? null;
    setState({
      active: true, taskId, taskTitle,
      phase: "work", remaining: WORK_SECONDS,
      cyclesCompleted: 0, startedAt: Date.now(),
    });
  }, [user]);

  const pause = useCallback(() => setState((s) => ({ ...s, active: false })), []);
  const resume = useCallback(() => setState((s) => ({ ...s, active: true })), []);

  const stop = useCallback(async (markTaskDone?: (taskId: string) => Promise<void> | void) => {
    if (!user || !sessionRowId.current) {
      setState(initial);
      return;
    }
    const elapsedMs = state.startedAt ? Date.now() - state.startedAt : 0;
    const partialPhaseMs = state.phase === "work"
      ? (WORK_SECONDS - state.remaining) * 1000
      : 0; // ignore break for actual work time
    const totalMs = totalWorkMs.current + partialPhaseMs;
    const actual_minutes = Math.max(1, Math.round(totalMs / 60000));

    await supabase.from("user_study_focus_sessions").update({
      ended_at: new Date().toISOString(),
      actual_minutes,
      completed_cycles: state.cyclesCompleted,
    }).eq("id", sessionRowId.current);

    if (markTaskDone && state.taskId && state.cyclesCompleted >= 1) {
      await markTaskDone(state.taskId);
    }
    sessionRowId.current = null;
    totalWorkMs.current = 0;
    setState(initial);
    return { actual_minutes, cycles: state.cyclesCompleted, taskId: state.taskId, elapsedMs };
  }, [user, state]);

  return { state, start, pause, resume, stop };
};
