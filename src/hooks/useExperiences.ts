import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ExperienceRound = {
  name: string;
  type?: string;
  questions?: string;
  duration?: string;
};

export type Experience = {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  year: number;
  experience_type: "on_campus" | "off_campus" | "internship" | "referral";
  difficulty: string;
  offer_status: "selected" | "rejected" | "waitlisted" | "in_progress";
  ctc_lpa: number | null;
  location: string | null;
  rounds: ExperienceRound[];
  tips: string | null;
  overall_text: string;
  status: "pending" | "approved" | "rejected";
  moderation_notes: string | null;
  upvotes: number;
  views: number;
  created_at: string;
  updated_at: string;
};

export type ExperienceFilters = {
  company?: string;
  year?: number;
  role?: string;
  experience_type?: Experience["experience_type"];
  sort?: "recent" | "top";
};

export function useExperiences(filters: ExperienceFilters = {}) {
  return useQuery({
    queryKey: ["experiences", filters],
    queryFn: async () => {
      let q = supabase
        .from("interview_experiences")
        .select("*")
        .eq("status", "approved");

      if (filters.company) q = q.ilike("company_name", `%${filters.company}%`);
      if (filters.year) q = q.eq("year", filters.year);
      if (filters.role) q = q.ilike("role", `%${filters.role}%`);
      if (filters.experience_type) q = q.eq("experience_type", filters.experience_type);

      q = filters.sort === "top"
        ? q.order("upvotes", { ascending: false }).order("created_at", { ascending: false })
        : q.order("created_at", { ascending: false });

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data as unknown as Experience[];
    },
  });
}

export function useExperience(id?: string) {
  return useQuery({
    queryKey: ["experience", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      // fire and forget view increment
      if (data) {
        supabase
          .from("interview_experiences")
          .update({ views: (data as any).views + 1 })
          .eq("id", id!)
          .then(() => {});
      }
      return data as unknown as Experience | null;
    },
  });
}

export function useMyExperiences(userId?: string) {
  return useQuery({
    queryKey: ["my-experiences", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Experience[];
    },
  });
}

export function useSubmitExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Experience> & { user_id: string }) => {
      const { data, error } = await supabase
        .from("interview_experiences")
        .insert({ ...payload, status: "pending" } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Submitted for review", description: "Our team will review your experience shortly." });
      qc.invalidateQueries({ queryKey: ["my-experiences"] });
    },
    onError: (e: any) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ experienceId, userId, voted }: { experienceId: string; userId: string; voted: boolean }) => {
      if (voted) {
        const { error } = await supabase
          .from("experience_votes")
          .delete()
          .eq("experience_id", experienceId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("experience_votes")
          .insert({ experience_id: experienceId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experiences"] });
      qc.invalidateQueries({ queryKey: ["experience"] });
      qc.invalidateQueries({ queryKey: ["my-vote"] });
    },
  });
}

export function useMyVote(experienceId?: string, userId?: string) {
  return useQuery({
    queryKey: ["my-vote", experienceId, userId],
    enabled: !!experienceId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("experience_votes")
        .select("id")
        .eq("experience_id", experienceId!)
        .eq("user_id", userId!)
        .maybeSingle();
      return !!data;
    },
  });
}
