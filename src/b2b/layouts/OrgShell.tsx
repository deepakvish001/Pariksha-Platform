import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Library, Users, Settings as SettingsIcon } from "lucide-react";
import "../theme.css";

const NAV = [
  { to: "/b2b/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/b2b/assessments", label: "Assessments", icon: FileText },
  { to: "/b2b/question-bank", label: "Question Bank", icon: Library },
  { to: "/b2b/settings/team", label: "Team", icon: Users },
  { to: "/b2b/settings", label: "Settings", icon: SettingsIcon },
];

export function OrgShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="theme-b2b min-h-screen">
      <div className="flex">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-[hsl(var(--card))] min-h-screen sticky top-0">
          <div className="px-5 py-5 border-b">
            <NavLink to="/b2b/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">P</div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Parikshaa</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assessments</div>
              </div>
            </NavLink>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {NAV.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <NavLink to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to learning app
            </NavLink>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="border-b bg-[hsl(var(--card))] px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">{actions}</div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
