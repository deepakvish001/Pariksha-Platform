import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Library, Users, Settings as SettingsIcon, ShieldAlert } from "lucide-react";
import { useOrgBasePath, useCurrentOrg } from "../context/OrgContext";
import { useCanProctor } from "../hooks/usePermissions";
import { B2BBackdrop } from "../components/B2BBackdrop";
import "../theme.css";

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
  const { canProctor } = useCanProctor(org?.id);

  const isLegacy = base === "/b2b";
  const NAV_ALL = isLegacy
    ? [
        { to: "/b2b/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false, requiresProctor: false },
        { to: "/b2b/assessments", label: "Assessments", icon: FileText, exact: false, requiresProctor: false },
        { to: "/b2b/proctoring", label: "Proctoring", icon: ShieldAlert, exact: false, requiresProctor: true },
        { to: "/b2b/question-bank", label: "Question Bank", icon: Library, exact: false, requiresProctor: false },
        { to: "/b2b/settings/team", label: "Team", icon: Users, exact: false, requiresProctor: false },
        { to: "/b2b/settings", label: "Settings", icon: SettingsIcon, exact: true, requiresProctor: false },
      ]
    : [
        { to: base, label: "Dashboard", icon: LayoutDashboard, exact: true, requiresProctor: false },
        { to: `${base}/assessments`, label: "Assessments", icon: FileText, exact: false, requiresProctor: false },
        { to: `${base}/proctoring`, label: "Proctoring", icon: ShieldAlert, exact: false, requiresProctor: true },
        { to: `${base}/question-bank`, label: "Question Bank", icon: Library, exact: false, requiresProctor: false },
        { to: `${base}/team`, label: "Team", icon: Users, exact: false, requiresProctor: false },
        { to: `${base}/settings`, label: "Settings", icon: SettingsIcon, exact: true, requiresProctor: false },
      ];

  const NAV = NAV_ALL.filter((n) => !n.requiresProctor || canProctor);

  const homeHref = isLegacy ? "/b2b/dashboard" : base;

  return (
    <div className="theme-b2b relative h-screen overflow-hidden">
      <B2BBackdrop variant="subtle" />
      <div className="relative flex h-screen">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl h-screen">
          <div className="px-5 py-5 border-b shrink-0">
            <NavLink to={homeHref} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">
                P
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Parikshaa</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Assessments
                </div>
              </div>
            </NavLink>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {(() => {
              // Normalize pathname: lowercase + strip trailing slash so the
              // active check never partially matches sibling routes (e.g.
              // /b2b/proctoring vs /b2b/proctoring-archive) or breaks on
              // trailing-slash variants.
              const current = (pathname || "/").replace(/\/+$/, "").toLowerCase() || "/";
              return NAV.map((n) => {
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
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-[hsl(var(--primary-foreground))]"
                        : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{n.label}</span>
                </NavLink>
              );
              });
            })()}
          </nav>
          <div className="p-3 border-t">
            <NavLink to="/learn" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to learning app
            </NavLink>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl shadow-sm">
            <div className="px-6 h-16 flex items-center justify-between gap-4">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">
                {title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
