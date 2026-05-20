import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface TargetCompany {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  timeline_weeks: number;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrepPlan {
  id: string;
  user_id: string;
  target_company_id: string;
  plan: any;
  progress: any;
  model: string | null;
  generated_at: string;
}

export function useTargetCompanies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["target-companies", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TargetCompany[]> => {
      const { data, error } = await supabase
        .from("target_companies" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useCreateTargetCompany() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      company_name: string; role: string; timeline_weeks: number; notes?: string; is_primary?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("target_companies" as any)
        .insert({ ...input, user_id: user!.id })
        .select().maybeSingle();
      if (error) throw error;
      return data as unknown as TargetCompany;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["target-companies", user?.id] });
      toast.success("Target company saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteTargetCompany() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("target_companies" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["target-companies", user?.id] }),
  });
}

export function usePrepPlan(targetId: string | null) {
  return useQuery({
    queryKey: ["prep-plan", targetId],
    enabled: !!targetId,
    queryFn: async (): Promise<PrepPlan | null> => {
      const { data, error } = await supabase
        .from("company_prep_plans" as any)
        .select("*")
        .eq("target_company_id", targetId!)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && (error as any).code !== "PGRST116") throw error;
      return (data as any) ?? null;
    },
  });
}

export function useGeneratePrepPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-prep-plan", {
        body: { target_company_id: targetId },
      });
      if (error) throw error;
      return data?.plan as PrepPlan;
    },
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ["prep-plan", plan?.target_company_id] });
      toast.success("Prep plan generated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to generate plan"),
  });
}
