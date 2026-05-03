import { useMemo } from "react";

export interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface NavLike {
  to: string;
  label: string;
  children?: NavLike[];
}
interface GroupLike {
  label: string;
  items: NavLike[];
}

/**
 * Build breadcrumb segments from the admin nav config + current pathname.
 * Handles dynamic contest sub-routes (/admin/contests/:id/edit etc).
 */
export function useAdminBreadcrumb(
  pathname: string,
  groups: GroupLike[]
): BreadcrumbSegment[] {
  return useMemo(() => {
    const crumbs: BreadcrumbSegment[] = [{ label: "Admin", to: "/admin" }];

    // Find the matching top-level item
    let groupLabel: string | null = null;
    let item: NavLike | null = null;
    for (const g of groups) {
      const found = g.items.find(
        (i) => pathname === i.to || pathname.startsWith(i.to + "/")
      );
      if (found) {
        groupLabel = g.label;
        item = found;
        break;
      }
    }

    if (groupLabel && groupLabel !== "Overview") {
      crumbs.push({ label: groupLabel });
    }

    if (item) {
      crumbs.push({ label: item.label, to: item.to });
    }

    // Dynamic contest sub-route
    const m = pathname.match(
      /^\/admin\/contests\/([^/]+)(?:\/(edit|registrations|leaderboard))?\/?$/
    );
    if (m) {
      const id = m[1];
      const sub = m[2];
      if (id === "new") {
        crumbs.push({ label: "New" });
      } else {
        crumbs.push({ label: id.slice(0, 8) });
        if (sub) {
          crumbs.push({
            label:
              sub === "edit"
                ? "Edit"
                : sub === "registrations"
                ? "Registrations"
                : "Leaderboard",
          });
        }
      }
    }

    return crumbs;
  }, [pathname, groups]);
}
