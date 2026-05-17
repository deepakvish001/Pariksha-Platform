import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "@/lib/routing/slug";

export type AssessmentStatus = "draft" | "published" | "archived";

export type Assessment = {
  id: string;
  slug: string | null;
  org_id: string;
  title: string;
  description: string | null;
  duration_min: number;
  starts_at: string | null;
  ends_at: string | null;
  max_attempts: number;
  proctoring_enabled: boolean;
  proctoring_config: Record<string, unknown> | null;
  show_results_to_candidate: boolean;
  status: AssessmentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export function useAssessments(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "assessments", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<Assessment[]> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Assessment[];
    },
  });
}

export function useAssessment(id?: string) {
  return useQuery({
    queryKey: ["b2b", "assessment", id],
    enabled: !!id,
    queryFn: async (): Promise<Assessment | null> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Assessment | null;
    },
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      title: string;
      description?: string;
      duration_min?: number;
      proctoring_enabled?: boolean;
      show_results_to_candidate?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("assessments")
        .insert({
          org_id: input.org_id,
          title: input.title,
          description: input.description ?? null,
          duration_min: input.duration_min ?? 60,
          proctoring_enabled: input.proctoring_enabled ?? false,
          show_results_to_candidate: input.show_results_to_candidate ?? true,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["b2b", "assessments", a.org_id] });
    },
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Assessment> }) => {
      const { data, error } = await supabase
        .from("assessments")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(patch as any)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["b2b", "assessment", a.id] });
      qc.invalidateQueries({ queryKey: ["b2b", "assessments", a.org_id] });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, org_id }: { id: string; org_id: string }) => {
      const { error } = await supabase.from("assessments").delete().eq("id", id);
      if (error) throw error;
      return { id, org_id };
    },
    onSuccess: ({ org_id }) => {
      qc.invalidateQueries({ queryKey: ["b2b", "assessments", org_id] });
    },
  });
}

// Sections
export type Section = {
  id: string;
  assessment_id: string;
  title: string;
  weight: number;
  order_index: number;
};

export function useSections(assessmentId?: string) {
  return useQuery({
    queryKey: ["b2b", "sections", assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<Section[]> => {
      const { data, error } = await supabase
        .from("assessment_sections")
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Section[];
    },
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { assessment_id: string; title: string; order_index?: number }) => {
      const { data, error } = await supabase
        .from("assessment_sections")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as Section;
    },
    onSuccess: (s) => qc.invalidateQueries({ queryKey: ["b2b", "sections", s.assessment_id] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assessment_id }: { id: string; assessment_id: string }) => {
      const { error } = await supabase.from("assessment_sections").delete().eq("id", id);
      if (error) throw error;
      return { id, assessment_id };
    },
    onSuccess: ({ assessment_id }) =>
      qc.invalidateQueries({ queryKey: ["b2b", "sections", assessment_id] }),
  });
}

// Section <-> question linking
export function useSectionQuestions(sectionId?: string) {
  return useQuery({
    queryKey: ["b2b", "section-questions", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("section_questions")
        .select("id, order_index, weight_override, question:questions(*)")
        .eq("section_id", sectionId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddQuestionToSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { section_id: string; question_id: string; order_index?: number }) => {
      const { data, error } = await supabase
        .from("section_questions")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row: any) => qc.invalidateQueries({ queryKey: ["b2b", "section-questions", row.section_id] }),
  });
}

export function useRemoveQuestionFromSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, section_id }: { id: string; section_id: string }) => {
      const { error } = await supabase.from("section_questions").delete().eq("id", id);
      if (error) throw error;
      return { id, section_id };
    },
    onSuccess: ({ section_id }) =>
      qc.invalidateQueries({ queryKey: ["b2b", "section-questions", section_id] }),
  });
}
