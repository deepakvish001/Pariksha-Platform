import { ReactNode, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentOrg, useOrgBasePath } from "../context/OrgContext";
import { useCan, type Capability } from "../hooks/usePermissions";

/**
 * Route guard that only renders children if the current user has `cap`
 * in the currently-resolved org workspace. On deny, redirects to the
 * workspace dashboard and toasts a clear permission message.
 *
 * Pair with <OrgWorkspace> so `useCurrentOrg()` is populated.
 */
export function RequireOrgCapability({
  cap,
  children,
  fallbackPath,
}: {
  cap: Capability;
  children: ReactNode;
  fallbackPath?: string;
}) {
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const base = useOrgBasePath();
  const { allowed, isLoading } = useCan(org?.id, cap);
  const toastedRef = useRef(false);

  const deny = !orgLoading && !isLoading && !allowed;

  useEffect(() => {
    if (deny && !toastedRef.current) {
      toastedRef.current = true;
      toast.error("You don't have permission to view this page.");
    }
  }, [deny]);

  if (orgLoading || isLoading) return null;
  if (!allowed) return <Navigate to={fallbackPath ?? base} replace />;
  return <>{children}</>;
}
