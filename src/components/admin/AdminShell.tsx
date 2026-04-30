import { Link, useLocation } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid, History,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, Activity, Download, HeartPulse, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}
interface NavGroup { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  ]},
  { label: "Content", items: [
    { to: "/admin/problems", label: "Coding Problems", icon: FileCode2 },
    { to: "/admin/problems/import", label: "Bulk Import", icon: Upload },
    { to: "/admin/publish-history", label: "Publish History", icon: History },
    { to: "/admin/ai-content", label: "AI Content", icon: Sparkles },
  ]},
  { label: "People", items: [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/roles", label: "Roles", icon: KeyRound },
    { to: "/admin/reports", label: "Reports", icon: Flag },
  ]},
  { label: "Engagement", items: [
    { to: "/admin/daily-challenge", label: "Daily Challenge", icon: CalendarClock },
    { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  ]},
  { label: "Platform", items: [
    { to: "/admin/settings", label: "Settings & Flags", icon: SettingsIcon },
    { to: "/admin/storage", label: "Storage", icon: Database },
  ]},
  { label: "System", items: [
    { to: "/admin/system-health", label: "System Health", icon: HeartPulse },
    { to: "/admin/cron-jobs", label: "Scheduled Jobs", icon: Clock },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { to: "/admin/edge-logs", label: "Edge Logs", icon: Activity },
    { to: "/admin/exports", label: "Exports", icon: Download },
  ]},
];

export const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-60 shrink-0">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Admin</h2>
          </div>
          <nav className="flex flex-col gap-4">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {group.label}
                </p>
                <div className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};
