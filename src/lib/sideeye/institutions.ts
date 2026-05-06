import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProctorRole =
  | "proctor_viewer"
  | "proctor_reviewer"
  | "proctor_admin"
  | "institution_admin";

export interface InstitutionMembership {
  institution_id: string;
  role: ProctorRole;
  institution_name: string;
  institution_slug: string;
}

const RANK: Record<ProctorRole, number> = {
  proctor_viewer: 1,
  proctor_reviewer: 2,
  proctor_admin: 3,
  institution_admin: 4,
};

export function hasAtLeast(role: ProctorRole | undefined | null, min: ProctorRole): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

/** Hook: list institutions the current user belongs to + their role. */
export function useMyInstitutions() {
  const [data, setData] = useState<InstitutionMembership[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) { setData([]); setLoading(false); } return; }
      const { data: rows, error } = await supabase
        .from("institution_members" as never)
        .select("institution_id, role, institutions(name, slug)" as never)
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error || !rows) { setData([]); setLoading(false); return; }
      setData((rows as any[]).map((r) => ({
        institution_id: r.institution_id,
        role: r.role,
        institution_name: r.institutions?.name ?? "",
        institution_slug: r.institutions?.slug ?? "",
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}

/** Hook: returns the user's role in a given institution (or null). */
export function useInstitutionRole(institutionId: string | null | undefined) {
  const [role, setRole] = useState<ProctorRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!institutionId) { setRole(null); setLoading(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) { setRole(null); setLoading(false); } return; }
      const { data, error } = await supabase
        .from("institution_members" as never)
        .select("role" as never)
        .eq("institution_id", institutionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setRole(error || !data ? null : ((data as any).role as ProctorRole));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [institutionId]);

  return { role, loading, can: (min: ProctorRole) => hasAtLeast(role, min) };
}
