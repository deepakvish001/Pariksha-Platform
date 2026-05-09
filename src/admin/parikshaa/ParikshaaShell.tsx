import { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, ShieldAlert, TrendingUp } from "lucide-react";

const NAV = [
  { to: "/admin/parikshaa", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/parikshaa/users", label: "Users", icon: Users },
  { to: "/admin/parikshaa/orgs", label: "Companies & Colleges", icon: Building2 },
  { to: "/admin/parikshaa/moderation", label: "Moderation", icon: ShieldAlert },
  { to: "/admin/parikshaa/leads", label: "Leads & Growth", icon: TrendingUp },
];

export function ParikshaaShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="px-5 py-5 border-b">
          <NavLink to="/admin/parikshaa" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">P</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Parikshaa</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Control Center</div>
            </div>
          </NavLink>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <NavLink to="/admin" className="text-xs text-muted-foreground hover:text-foreground">
            ← Learning admin
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export function ShellHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="border-b bg-card px-6 py-4 flex items-center justify-between gap-4">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
