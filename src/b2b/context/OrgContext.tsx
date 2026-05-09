import { createContext, ReactNode, useContext, useMemo } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Organization, useMyOrganizations } from "../hooks/useOrg";

type OrgContextValue = {
  org: Organization;
  basePath: string; // e.g. /companies/acme  or  /colleges/iit-delhi
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function useCurrentOrg(): { org: Organization | null; isLoading: boolean } {
  const ctx = useContext(OrgContext);
  const { data: orgs, isLoading } = useMyOrganizations();
  if (ctx) return { org: ctx.org, isLoading: false };
  return { org: orgs?.[0] ?? null, isLoading };
}

export function useOrgBasePath(): string {
  const ctx = useContext(OrgContext);
  if (ctx) return ctx.basePath;
  // Legacy /b2b/* fallback
  return "/b2b";
}

export function OrgProvider({
  org,
  basePath,
  children,
}: {
  org: Organization;
  basePath: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ org, basePath }), [org, basePath]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * Route guard for /companies/:slug/* and /colleges/:slug/*.
 * Resolves the org by (type, slug), checks the user is a member, then renders
 * the nested route tree with OrgContext populated. On any failure → /404.
 */
export function OrgWorkspace({ expectedType }: { expectedType: "company" | "college" }) {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["b2b", "org-by-slug", expectedType, slug, user?.id],
    enabled: !!slug && !authLoading,
    queryFn: async (): Promise<{ org: Organization; isMember: boolean } | null> => {
      const dbType = expectedType; // 'company' | 'college'
      const { data: org, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("type", dbType)
        .ilike("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!org) return null;

      // Membership check
      let isMember = false;
      if (user?.id) {
        const { count } = await supabase
          .from("org_members")
          .select("user_id", { count: "exact", head: true })
          .eq("org_id", org.id)
          .eq("user_id", user.id);
        isMember = (count ?? 0) > 0;
      }
      return { org: org as Organization, isMember };
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="theme-b2b min-h-screen grid place-items-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]"></p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  // Hide existence of slug from non-members (and treat missing org the same way).
  if (isError || !data || !data.isMember) {
    return <Navigate to="/404" replace />;
  }

  const basePath =
    expectedType === "company" ? `/companies/${data.org.slug}` : `/colleges/${data.org.slug}`;

  return (
    <OrgProvider org={data.org} basePath={basePath}>
      <Outlet />
    </OrgProvider>
  );
}
