import { NavLink, useLocation } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid, History,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, Activity, Download, HeartPulse, Clock,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useAdminSidebarBadges } from "@/hooks/admin/useAdminSidebarBadges";

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

const Badge = ({ count, tone = "default" }: { count: number; tone?: "default" | "alert" }) => {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
        tone === "alert"
          ? "bg-destructive text-destructive-foreground"
          : "bg-primary/15 text-primary"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const { data: badges } = useAdminSidebarBadges();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const groupHasActive = (g: NavGroup) => g.items.some((i) => isActive(i.to, i.end));

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, true]))
  );

  // Auto-expand the active group on route change.
  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const g of GROUPS) {
        if (groupHasActive(g)) next[g.label] = true;
      }
      return next;
    });
    // close mobile drawer after navigation
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Compute aggregated group badges (sum of item badges in that group).
  const groupBadgeCount = (g: NavGroup) =>
    g.items.reduce((acc, i) => acc + (badges?.[i.to as keyof typeof badges] ?? 0), 0);

  // Scroll active item into view on route change.
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

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
          const groupCount = groupBadgeCount(group);

          return (
            <Collapsible
              key={group.label}
              open={open}
              onOpenChange={(v) => setOpenMap((m) => ({ ...m, [group.label]: v }))}
            >
              <SidebarGroup className="py-1">
                {!collapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        "flex h-7 cursor-pointer items-center gap-2 rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-muted/40",
                        hasActive ? "text-primary" : "text-muted-foreground/70"
                      )}
                    >
                      <span>{group.label}</span>
                      {groupCount > 0 && !open && <Badge count={groupCount} />}
                      <ChevronDown
                        className={cn(
                          "ml-auto h-3.5 w-3.5 transition-transform duration-200",
                          open ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.to, item.end);
                        const itemCount = badges?.[item.to as keyof typeof badges] ?? 0;
                        const tone: "default" | "alert" =
                          item.to === "/admin/reports" || item.to === "/admin/system-health"
                            ? "alert"
                            : "default";
                        return (
                          <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={
                                itemCount ? `${item.label} (${itemCount})` : item.label
                              }
                            >
                              <NavLink
                                ref={active ? (activeRef as any) : undefined}
                                to={item.to}
                                end={item.end}
                                className={cn(
                                  "flex items-center gap-2 rounded-md transition-colors",
                                  active
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <span className="relative flex shrink-0 items-center">
                                  <Icon className="h-4 w-4" />
                                  {collapsed && itemCount > 0 && (
                                    <span
                                      className={cn(
                                        "absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                                        tone === "alert" ? "bg-destructive" : "bg-primary"
                                      )}
                                    />
                                  )}
                                </span>
                                {!collapsed && (
                                  <>
                                    <span className="truncate">{item.label}</span>
                                    <Badge count={itemCount} tone={tone} />
                                  </>
                                )}
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
