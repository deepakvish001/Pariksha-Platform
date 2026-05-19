import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Library, Users, Settings as SettingsIcon, Menu, Home, ChevronRight, GraduationCap } from "lucide-react";
import { useOrgBasePath, useCurrentOrg } from "../context/OrgContext";
import { useCan, type Capability } from "../hooks/usePermissions";
import { B2BBackdrop } from "../components/B2BBackdrop";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEntityLabel } from "@/lib/routing/useBreadcrumbLabel";
import { DualRoleBanner } from "../components/DualRoleBanner";
import "../theme.css";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
};

function SidebarBody({
  nav,
  homeHref,
  orgName,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  homeHref: string;
  orgName: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = (pathname || "/").replace(/\/+$/, "").toLowerCase() || "/";

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl">
      <div className="px-5 py-5 border-b border-[hsl(var(--border))]/60 shrink-0">
        <NavLink to={homeHref} onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/70 text-[hsl(var(--primary-foreground))] grid place-items-center font-bold shadow-md shadow-[hsl(var(--primary))]/20 group-hover:scale-105 transition-transform">
            P
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Parikshaa</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {orgName}
            </div>
          </div>
        </NavLink>
      </div>
      <div className="px-5 pt-4 pb-1.5 shrink-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Workspace
        </div>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1 b2b-scroll b2b-scroll-slim">
        {nav.map((n) => {
          const target = n.to.replace(/\/+$/, "").toLowerCase() || "/";
          const active = n.exact
            ? current === target
            : current === target || current.startsWith(target + "/");
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))] shadow-sm ring-1 ring-[hsl(var(--primary))]/20"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]/70 hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-all ${
                  active
                    ? "bg-[hsl(var(--primary))] opacity-100"
                    : "bg-transparent opacity-0 group-hover:bg-[hsl(var(--primary))]/40 group-hover:opacity-100"
                }`}
              />
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{n.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[hsl(var(--border))]/60 shrink-0">
        <NavLink
          to="/learn"
          onClick={onNavigate}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--secondary))]/60 transition-colors"
        >
          ← Back to learning app
        </NavLink>
      </div>
    </div>
  );
}

export function OrgShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  const { pathname } = useLocation();
  const base = useOrgBasePath();
  const { org } = useCurrentOrg();
  const canEditSettings = useCan(org?.id, "org.editSettings").allowed;
  const canManageMembers = useCan(org?.id, "members.invite").allowed;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isLegacy = base === "/b2b";
  type NavCfg = NavItem & { requires?: Capability };
  const NAV_ALL: NavCfg[] = isLegacy
    ? [
        { to: "/b2b/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false },
        { to: "/b2b/assessments", label: "Assessments", icon: FileText, exact: false },
        { to: "/b2b/students", label: "Students", icon: GraduationCap, exact: false },
        { to: "/b2b/placements", label: "Placements", icon: Briefcase, exact: false },
        { to: "/b2b/question-bank", label: "Question Bank", icon: Library, exact: false },
        { to: "/b2b/settings/team", label: "Team", icon: Users, exact: false, requires: "members.invite" },
        { to: "/b2b/settings", label: "Settings", icon: SettingsIcon, exact: true, requires: "org.editSettings" },
      ]
    : [
        { to: base, label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: `${base}/assessments`, label: "Assessments", icon: FileText, exact: false },
        { to: `${base}/students`, label: "Students", icon: GraduationCap, exact: false },
        { to: `${base}/placements`, label: "Placements", icon: Briefcase, exact: false },
        { to: `${base}/question-bank`, label: "Question Bank", icon: Library, exact: false },
        { to: `${base}/team`, label: "Team", icon: Users, exact: false, requires: "members.invite" },
        { to: `${base}/settings`, label: "Settings", icon: SettingsIcon, exact: true, requires: "org.editSettings" },
      ];

  const NAV: NavItem[] = NAV_ALL.filter((n) => {
    if (!n.requires) return true;
    if (n.requires === "members.invite") return canManageMembers;
    if (n.requires === "org.editSettings") return canEditSettings;
    return true;
  });
  const homeHref = isLegacy ? "/b2b/dashboard" : base;
  const orgName = org?.name ?? "Assessments";

  // Build breadcrumbs from the path segments after the org base.
  const baseTrim = base.replace(/\/+$/, "");
  const rest = pathname.startsWith(baseTrim)
    ? pathname.slice(baseTrim.length).replace(/^\/+|\/+$/g, "")
    : "";
  const segments = rest ? rest.split("/") : [];

  // Locate the assessment + attempt segments (if any) so we can resolve
  // their UUID/slug to a real human label rather than "#ea972d".
  const assessmentsIdx = segments.indexOf("assessments");
  const assessmentSeg =
    assessmentsIdx >= 0 &&
    segments[assessmentsIdx + 1] &&
    segments[assessmentsIdx + 1] !== "new"
      ? segments[assessmentsIdx + 1]
      : undefined;
  const attemptsIdx = segments.indexOf("attempts");
  const attemptSeg =
    attemptsIdx > 0 && segments[attemptsIdx + 1] ? segments[attemptsIdx + 1] : undefined;

  const { data: assessmentLabel } = useEntityLabel("assessment", assessmentSeg, {
    orgId: org?.id,
  });
  const { data: attemptLabel } = useEntityLabel("attempt", attemptSeg, {
    assessmentId: undefined, // assessment id not yet resolved from slug — best-effort lookup
  });

  const humanize = (s: string) =>
    decodeURIComponent(s)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const labelForSegment = (seg: string, fullPath: string) => {
    const match = NAV.find(
      (n) => n.to.replace(/\/+$/, "").toLowerCase() === fullPath.toLowerCase(),
    );
    if (match) return match.label;
    if (seg === assessmentSeg && assessmentLabel) return assessmentLabel;
    if (seg === attemptSeg && attemptLabel) return attemptLabel;
    // UUID-ish fallback while the lookup is in flight
    if (/^[0-9a-f]{8}-[0-9a-f-]+$/i.test(seg)) return `#${seg.slice(0, 6)}`;
    return humanize(seg);
  };
  const crumbs = segments.map((seg, i) => {
    const full = `${baseTrim}/${segments.slice(0, i + 1).join("/")}`;
    return { label: labelForSegment(seg, full), to: full };
  });

  return (
    <div className="theme-b2b relative h-screen overflow-hidden">
      <B2BBackdrop variant="subtle" />
      <div className="relative flex h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[hsl(var(--border))] h-screen">
          <SidebarBody nav={NAV} homeHref={homeHref} orgName={orgName} pathname={pathname} />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 border-r border-[hsl(var(--border))] theme-b2b"
          >
            <VisuallyHidden>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden>
            <SidebarBody
              nav={NAV}
              homeHref={homeHref}
              orgName={orgName}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="flex-1 min-w-0 flex flex-col h-screen">
          <header className="shrink-0 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]/85 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
            <div className="px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-1 h-9 w-9"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <div className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 leading-none mb-1">
                    {orgName}
                  </div>
                  <h1 className="text-[15px] sm:text-lg lg:text-xl font-semibold tracking-tight leading-tight truncate text-[hsl(var(--foreground))]">
                    {title}
                  </h1>
                </div>
              </div>

              {actions ? (
                <div className="flex items-center gap-2 shrink-0 pl-3 sm:pl-4 sm:border-l sm:border-[hsl(var(--border))]/60 [&_button]:h-9 [&_a]:h-9">
                  {actions}
                </div>
              ) : null}
            </div>
            <nav
              aria-label="Breadcrumb"
              className="px-4 sm:px-6 lg:px-8 py-2 border-t border-[hsl(var(--border))]/40 bg-[hsl(var(--background))]/60 overflow-x-auto b2b-scroll b2b-scroll-slim"
            >
              <ol className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <li className="flex items-center">
                  <NavLink
                    to={homeHref}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-[hsl(var(--secondary))]/60 transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Home</span>
                  </NavLink>
                </li>
                {crumbs.map((c, i) => {
                  const isLast = i === crumbs.length - 1;
                  return (
                    <li key={c.to} className="flex items-center gap-1.5">
                      <ChevronRight
                        className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0"
                        aria-hidden="true"
                      />
                      {isLast ? (
                        <span
                          aria-current="page"
                          className="px-1.5 py-0.5 font-medium text-foreground truncate max-w-[180px] sm:max-w-[260px]"
                        >
                          {c.label}
                        </span>
                      ) : (
                        <NavLink
                          to={c.to}
                          className="px-1.5 py-0.5 rounded hover:text-foreground hover:bg-[hsl(var(--secondary))]/60 transition-colors truncate max-w-[160px]"
                        >
                          {c.label}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 b2b-scroll">
            <DualRoleBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
