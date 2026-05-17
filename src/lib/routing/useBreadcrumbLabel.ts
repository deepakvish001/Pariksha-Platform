/**
 * Look up a human-friendly label for a dynamic URL segment so breadcrumbs
 * show real entity names instead of UUIDs or path-cased guesses.
 *
 * The hook is intentionally narrow: it knows only the entities the breadcrumb
 * code in OrgShell can encounter. Extend the `kind` union when you start
 * showing more entity types in a breadcrumb.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "./slug";

export type EntityKind = "assessment" | "attempt";

export function useEntityLabel(
  kind: EntityKind,
  idOrSlug: string | undefined,
  scope?: { orgId?: string; assessmentId?: string },
) {
  return useQuery({
    queryKey: ["breadcrumb-label", kind, idOrSlug, scope?.orgId ?? null, scope?.assessmentId ?? null],
    enabled: !!idOrSlug,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const key = idOrSlug!;
      if (kind === "assessment") {
        let q = supabase.from("assessments").select("title");
        q = isUuid(key) ? q.eq("id", key) : q.eq("slug", key);
        if (scope?.orgId) q = q.eq("org_id", scope.orgId);
        const { data } = await q.maybeSingle();
        return data?.title ?? null;
      }
      if (kind === "attempt") {
        let q = supabase
          .from("assessment_attempts")
          .select("candidate_details, invite:assessment_invites(name,email)");
        q = isUuid(key) ? q.eq("id", key) : q.eq("slug", key);
        if (scope?.assessmentId) q = q.eq("assessment_id", scope.assessmentId);
        const { data } = await q.maybeSingle<{
          candidate_details: { fullName?: string; name?: string; email?: string } | null;
          invite: { name: string | null; email: string | null } | null;
        }>();
        const cd = data?.candidate_details ?? {};
        return (
          cd.fullName ||
          cd.name ||
          data?.invite?.name ||
          cd.email ||
          data?.invite?.email ||
          null
        );
      }
      return null;
    },
  });
}
