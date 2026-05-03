import { Outlet, NavLink } from "react-router-dom";
import { Swords, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const NAV = [
  { to: "/arena", label: "Arena Hub", icon: Home, end: true },
];

export function ArenaLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4">
              <SidebarTrigger />
              <NavLink to="/arena" className="flex items-center gap-2 font-bold tracking-wide">
                <Swords className="h-5 w-5 text-primary" />
                <span className="gradient-text">BATTLE ARENA</span>
              </NavLink>
              <nav className="flex items-center gap-1 ml-2 overflow-x-auto">
                {NAV.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition whitespace-nowrap",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </header>
          <main className="container py-6">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
