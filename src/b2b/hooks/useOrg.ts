import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ProctoringProfile = "off" | "basic" | "strict";

export type Organization = {
  id: string;
  name: string;
  type: "college" | "company";
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  owner_id: string;
  created_at: string;
  default_duration_min: number | null;
  default_proctoring: ProctoringProfile | null;
  default_pass_mark: number | null;
  allow_retake_default: boolean | null;
  auto_release_results: boolean | null;
  allowed_email_domains: string[] | null;
  require_mfa: boolean | null;
  team_session_minutes: number | null;
  notify_emails: string[] | null;
  slack_webhook_url: string | null;
  daily_summary_enabled: boolean | null;
  proctoring_alert_emails: string[] | null;
};

const ORG_QUERY_OPTS = {
  // Org membership / org record is stable per session; fetch once and rely on
  // explicit invalidation after create/join/leave/edit. Prevents permission
  // re-checks on every navigation or click inside the workspace.
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;

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
    ...ORG_QUERY_OPTS,
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
    ...ORG_QUERY_OPTS,
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
