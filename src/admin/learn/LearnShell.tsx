import { ReactNode, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileCode2,
  Users,
  CalendarClock,
  Sparkles,
  Flag,
  Megaphone,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/admin/learn", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/learn/problems", label: "Problems", icon: FileCode2 },
  { to: "/admin/learn/users", label: "Users", icon: Users },
  { to: "/admin/learn/daily", label: "Daily Challenge", icon: CalendarClock },
  { to: "/admin/learn/ai-content", label: "AI Content", icon: Sparkles },
  { to: "/admin/learn/reports", label: "Reports", icon: Flag },
  { to: "/admin/learn/broadcast", label: "Broadcast", icon: Megaphone },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 p-2 space-y-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
        const Icon = n.icon;
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.exact}
            onClick={onNavigate}
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
  );
}

function Brand() {
  return (
    <NavLink to="/admin/learn" className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
        L
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Learn Admin</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Lean Panel
        </div>
      </div>
    </NavLink>
  );
}

export function LearnShell() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r bg-card sticky top-0 h-screen transition-all ${
          desktopCollapsed ? "w-14" : "w-60"
        }`}
      >
        <div className="px-3 py-4 border-b flex items-center justify-between gap-2">
          {!desktopCollapsed && <Brand />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setDesktopCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {desktopCollapsed ? (
          <nav className="flex-1 p-2 space-y-1">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.exact}
                  title={n.label}
                  className={`flex items-center justify-center h-9 rounded-md transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </NavLink>
              );
            })}
          </nav>
        ) : (
          <NavList pathname={pathname} />
        )}
        {!desktopCollapsed && (
          <div className="p-3 border-t">
            <NavLink to="/admin" className="text-xs text-muted-foreground hover:text-foreground">
              → Full admin
            </NavLink>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center justify-between px-3 py-3 border-b bg-card sticky top-0 z-20">
          <Brand />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="px-4 py-4 border-b flex items-center justify-between">
                <Brand />
              </div>
              <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <div className="p-3 border-t">
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  → Full admin
                </NavLink>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function LearnHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="border-b bg-card px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}
