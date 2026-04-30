import { NavLink, useLocation } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid, History,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, Activity, Download, HeartPulse, Clock,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const groupHasActive = (g: NavGroup) => g.items.some((i) => isActive(i.to, i.end));

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, true]))
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 px-3 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Admin Console</span>}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {GROUPS.map((group) => {
          const hasActive = groupHasActive(group);
          const open = collapsed ? true : (openMap[group.label] ?? true);

          return (
            <Collapsible
              key={group.label}
              open={open}
              onOpenChange={(v) => setOpenMap((m) => ({ ...m, [group.label]: v }))}
              className="group/collap"
            >
              <SidebarGroup className="py-1">
                {!collapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-muted/40",
                        hasActive ? "text-primary" : "text-muted-foreground/70"
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          open ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent
                  className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                >
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.to, item.end);
                        return (
                          <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                              <NavLink
                                to={item.to}
                                end={item.end}
                                className={cn(
                                  "flex items-center gap-2 rounded-md transition-colors",
                                  active
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};

export const AdminShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-4rem)] w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
