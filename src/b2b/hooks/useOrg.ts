import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Organization = {
  id: string;
  name: string;
  type: "college" | "company";
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  owner_id: string;
  created_at: string;
};

export function useMyOrganizations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["b2b", "orgs", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Organization[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Organization[];
    },
  });
}

export function useActiveOrg(orgId?: string) {
  return useQuery({
    queryKey: ["b2b", "org", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<Organization | null> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Organization | null;
    },
  });
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
