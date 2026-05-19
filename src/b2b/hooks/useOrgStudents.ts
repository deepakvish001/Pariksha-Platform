import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgStudentStatus = "invited" | "active" | "suspended" | "alumni";

export type OrgStudent = {
  id: string;
  org_id: string;
  email: string;
  user_id: string | null;
  full_name: string | null;
  roll_number: string | null;
  branch: string | null;
  batch_year: number | null;
  section: string | null;
  status: OrgStudentStatus;
  enrolled_at: string;
  activated_at: string | null;
  last_active_at: string | null;
};

export type EnrollInput = {
  email: string;
  full_name?: string | null;
  roll_number?: string | null;
  branch?: string | null;
  batch_year?: number | null;
  section?: string | null;
};

export function useOrgStudents(orgId?: string) {
  return useQuery({
    queryKey: ["org-students", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgStudent[]> => {
      const { data, error } = await supabase
        .from("org_students")
        .select("*")
        .eq("org_id", orgId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgStudent[];
    },
  });
}

export function useOrgStudent(studentId?: string) {
  return useQuery({
    queryKey: ["org-student", studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<OrgStudent | null> => {
      const { data, error } = await supabase
        .from("org_students")
        .select("*")
        .eq("id", studentId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as OrgStudent | null;
    },
  });
}

export function useEnrollStudents(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (students: EnrollInput[]) => {
      if (!orgId) throw new Error("Missing org");
      const { data, error } = await supabase.functions.invoke("enroll-students", {
        body: { org_id: orgId, students },
      });
      if (error) throw error;
      return data as { ok: true; inserted: number; updated: number; total: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-students", orgId] }),
  });
}

export function useUpdateOrgStudent(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<OrgStudent> }) => {
      const { error } = await supabase.from("org_students").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-students", orgId] }),
  });
}

export function useDeleteOrgStudent(orgId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-students", orgId] }),
  });
}

/** Returns the org_students rows owned by the signed-in user (their enrollments). */
export function useMyEnrollments(userId?: string) {
  return useQuery({
    queryKey: ["my-enrollments", userId],
    enabled: !!userId,
    queryFn: async (): Promise<(OrgStudent & { org: { id: string; name: string; slug: string; type: string; logo_url: string | null; brand_color: string | null } })[]> => {
      const { data, error } = await supabase
        .from("org_students")
        .select("*, org:organizations(id,name,slug,type,logo_url,brand_color)")
        .eq("user_id", userId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}
