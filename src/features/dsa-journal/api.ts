import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type {
  JournalDay,
  JournalEntry,
  JournalRevision,
  EntryWithDay,
} from "./types";
import { scheduleNext, todayISO } from "./srs";

const TABLES = {
  days: "practice_journal_days",
  entries: "practice_journal_entries",
  revisions: "practice_journal_revisions",
} as const;

const QK = {
  all: ["dsa-journal"] as const,
  days: () => ["dsa-journal", "days"] as const,
  day: (date: string) => ["dsa-journal", "day", date] as const,
  entries: (dayId: string | null) => ["dsa-journal", "entries", dayId] as const,
  due: () => ["dsa-journal", "due"] as const,
  all_entries: () => ["dsa-journal", "all-entries"] as const,
  revisions: (entryId: string) =>
    ["dsa-journal", "revisions", entryId] as const,
};

/** Ensure a day row exists for the given date and return it. */
export const useEnsureDay = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string): Promise<JournalDay> => {
      if (!user) throw new Error("Not signed in");
      const { data: existing } = await supabase
        .from(TABLES.days as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();
      if (existing) return existing as JournalDay;
      const { data, error } = await supabase
        .from(TABLES.days as any)
        .insert({ user_id: user.id, log_date: date })
        .select("*")
        .single();
      if (error) throw error;
      return data as JournalDay;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.days() });
    },
  });
};

export const useDays = (limit = 90) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.days(),
    enabled: !!user,
    queryFn: async (): Promise<JournalDay[]> => {
      const { data, error } = await supabase
        .from(TABLES.days as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("log_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as JournalDay[];
    },
  });
};

export const useDayEntries = (dayId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.entries(dayId),
    enabled: !!user && !!dayId,
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await supabase
        .from(TABLES.entries as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("day_id", dayId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
};

export const useAllEntries = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.all_entries(),
    enabled: !!user,
    queryFn: async (): Promise<EntryWithDay[]> => {
      const { data, error } = await supabase
        .from(TABLES.entries as any)
        .select("*, day:practice_journal_days(log_date)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as EntryWithDay[];
    },
  });
};

export const useDueRevisions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.due(),
    enabled: !!user,
    queryFn: async (): Promise<JournalEntry[]> => {
      const today = todayISO();
      const { data, error } = await supabase
        .from(TABLES.entries as any)
        .select("*")
        .eq("user_id", user!.id)
        .is("mastered_at", null)
        .not("next_revision_at", "is", null)
        .lte("next_revision_at", today)
        .order("next_revision_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
};

export interface EntryInput {
  day_id: string;
  title: string;
  links?: { label: string; url: string }[];
  topic?: string | null;
  pattern?: string | null;
  algorithm?: string | null;
  difficulty?: "Easy" | "Medium" | "Hard" | null;
  personal_difficulty?: number | null;
  time_taken_min?: number | null;
  attempts?: number;
  solved_clean?: boolean;
  mistakes?: string | null;
  learnings?: string | null;
  notes_md?: string | null;
  status?: "solved" | "partial" | "stuck";
  tags?: string[];
}

export const useCreateEntry = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EntryInput): Promise<JournalEntry> => {
      if (!user) throw new Error("Not signed in");
      const sched = scheduleNext(
        { ease_factor: 2.5, interval_days: 1 },
        { solved_clean: !!input.solved_clean },
      );
      const payload = {
        user_id: user.id,
        attempts: 1,
        solved_clean: false,
        status: "solved",
        tags: [],
        links: [],
        ...input,
        ease_factor: sched.ease_factor,
        interval_days: sched.interval_days,
        next_revision_at: sched.next_revision_at,
      };
      const { data, error } = await supabase
        .from(TABLES.entries as any)
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      toast.success("Problem logged");
      qc.invalidateQueries({ queryKey: QK.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save entry"),
  });
};

export const useUpdateEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<JournalEntry>;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.entries as any)
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });
};

export const useDeleteEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.entries as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: QK.all });
    },
  });
};

export const useEntryRevisions = (entryId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.revisions(entryId),
    enabled: !!user && !!entryId,
    queryFn: async (): Promise<JournalRevision[]> => {
      const { data, error } = await supabase
        .from(TABLES.revisions as any)
        .select("*")
        .eq("entry_id", entryId)
        .order("revised_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalRevision[];
    },
  });
};

export const useLogRevision = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entry: JournalEntry;
      attempts: number;
      time_taken_min: number | null;
      solved_clean: boolean;
      note: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { entry, attempts, time_taken_min, solved_clean, note } = input;

      const { error: revErr } = await supabase
        .from(TABLES.revisions as any)
        .insert({
          user_id: user.id,
          entry_id: entry.id,
          attempts,
          time_taken_min,
          solved_clean,
          note,
        });
      if (revErr) throw revErr;

      const sched = scheduleNext(
        { ease_factor: entry.ease_factor, interval_days: entry.interval_days },
        { solved_clean },
      );

      // Master if cleanly solved in 1 attempt and interval already long.
      const becomesMastered =
        solved_clean && attempts === 1 && entry.interval_days >= 16;

      const patch: Partial<JournalEntry> = {
        ease_factor: sched.ease_factor,
        interval_days: sched.interval_days,
        next_revision_at: becomesMastered ? null : sched.next_revision_at,
        mastered_at: becomesMastered ? new Date().toISOString() : null,
      };
      const { error: upErr } = await supabase
        .from(TABLES.entries as any)
        .update(patch)
        .eq("id", entry.id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      toast.success("Revision logged");
      qc.invalidateQueries({ queryKey: QK.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not log revision"),
  });
};

/** Convenient lookup of "today's day row" given the existing days list. */
export const useTodayDay = () => {
  const days = useDays();
  const today = todayISO();
  const ensure = useEnsureDay();
  const todayRow = days.data?.find((d) => d.log_date === today) ?? null;
  const ensureToday = useCallback(() => ensure.mutateAsync(today), [ensure, today]);
  return { todayRow, today, ensureToday, ensuring: ensure.isPending };
};
