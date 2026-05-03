import { NavLink, useLocation } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid, History,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, Activity, Download, HeartPulse, Clock,
  ChevronDown, Star, Library, Map as MapIcon, Inbox, ShieldAlert,
  Award, Trophy, Gamepad2,
  Bell, Brain, FileText, Code2, MessageSquare, Mail, Share2, Send, LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminSidebarBadges, BadgeDetail } from "@/hooks/admin/useAdminSidebarBadges";
import { BadgeKey } from "@/hooks/admin/useAdminBadgePrefs";
import { AdminBadgeSettings } from "./AdminBadgeSettings";
import { AdminUserDrawer } from "./AdminUserDrawer";
import { adminUserDrawer, useAdminUserDrawerStore } from "@/hooks/admin/useAdminUserDrawerStore";
import { useAdminRealtimeSync } from "@/hooks/admin/useAdminRealtimeSync";
import { Radio } from "lucide-react";

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
    { to: "/admin/featured", label: "Featured / Staff Picks", icon: Star },
    { to: "/admin/library-curation", label: "Library Curation", icon: Library },
    { to: "/admin/roadmaps", label: "Roadmaps Manager", icon: MapIcon },
  ]},
  { label: "People", items: [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/roles", label: "Roles", icon: KeyRound },
    { to: "/admin/rls-tester", label: "RLS Tester", icon: ShieldAlert },
    { to: "/admin/reports", label: "Reports", icon: Flag },
  ]},
  { label: "Engagement", items: [
    { to: "/admin/daily-challenge", label: "Daily Challenge", icon: CalendarClock },
    { to: "/admin/contests", label: "Contests", icon: Trophy },
    { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
    { to: "/admin/scheduled-broadcasts", label: "Scheduled Broadcasts", icon: Send },
    { to: "/admin/achievements", label: "Achievements", icon: Award },
    { to: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
    { to: "/admin/gamification", label: "Gamification Rules", icon: Gamepad2 },
  ]},
  { label: "User Activity", items: [
    { to: "/admin/quizzes", label: "Quizzes & SRS", icon: Brain },
    { to: "/admin/submissions", label: "Code Submissions", icon: Code2 },
    { to: "/admin/resumes", label: "Resumes", icon: FileText },
    { to: "/admin/conversations", label: "AI Conversations", icon: MessageSquare },
    { to: "/admin/outreach", label: "Cold Outreach", icon: Mail },
    { to: "/admin/folders", label: "Shared Folders", icon: Share2 },
  ]},
  { label: "Communications", items: [
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/support", label: "Support Inbox", icon: Inbox },
  ]},
  { label: "Platform", items: [
    { to: "/admin/settings", label: "Settings & Flags", icon: SettingsIcon },
    { to: "/admin/storage", label: "Storage", icon: Database },
  ]},
  { label: "Security", items: [
    { to: "/admin/security", label: "Security Center", icon: ShieldAlert },
    { to: "/admin/sessions", label: "Sessions", icon: LogOut },
  ]},
  { label: "System", items: [
    { to: "/admin/system-health", label: "System Health", icon: HeartPulse },
    { to: "/admin/cron-jobs", label: "Scheduled Jobs", icon: Clock },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { to: "/admin/edge-logs", label: "Edge Logs", icon: Activity },
    { to: "/admin/exports", label: "Exports", icon: Download },
  ]},
];

const TRACKED: BadgeKey[] = ["/admin/reports", "/admin/ai-content", "/admin/system-health", "/admin/support"];

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

  const { data: badges, isLoading: badgesLoading, markSeen, clearAll } = useAdminSidebarBadges();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const groupHasActive = (g: NavGroup) => g.items.some((i) => isActive(i.to, i.end));

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, true]))
  );

  // Auto-expand active group + close mobile drawer + flash key
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const g of GROUPS) if (groupHasActive(g)) next[g.label] = true;
      return next;
    });
    setFlashKey((k) => k + 1);
    if (isMobile) setOpenMobile(false);

    // mark-as-read for tracked routes when visited
    const matched = TRACKED.find((t) => isActive(t));
    if (matched) markSeen(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const groupBadgeCount = (g: NavGroup) =>
    g.items.reduce((acc, i) => {
      const det = badges?.[i.to as BadgeKey];
      return acc + (det?.unseen ?? 0);
    }, 0);

  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm font-semibold">Admin Console</span>
              <span className="ml-auto">
                <AdminBadgeSettings onMarkAllRead={clearAll} />
              </span>
            </>
          )}
        </div>
      </SidebarHeader>

      <TooltipProvider delayDuration={250}>
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
                          const detail: BadgeDetail | undefined = badges?.[item.to as BadgeKey];
                          const tracked = (TRACKED as string[]).includes(item.to);
                          const showSkeleton = tracked && badgesLoading && !detail;
                          const unseen = detail?.unseen ?? 0;
                          const total = detail?.total ?? 0;
                          const tone: "default" | "alert" =
                            item.to === "/admin/reports" || item.to === "/admin/system-health"
                              ? "alert"
                              : "default";

                          const linkEl = (
                            <NavLink
                              ref={active ? (activeRef as any) : undefined}
                              to={item.to}
                              end={item.end}
                              key={`${item.to}-${active ? flashKey : "x"}`}
                              className={cn(
                                "flex items-center gap-2 rounded-md transition-colors",
                                active
                                  ? "bg-primary/10 text-primary font-medium admin-nav-flash"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <span className="relative flex shrink-0 items-center">
                                <Icon className="h-4 w-4" />
                                {collapsed && unseen > 0 && (
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
                                  {showSkeleton ? (
                                    <Skeleton className="ml-auto h-4 w-6 rounded-full" />
                                  ) : (
                                    <Badge count={unseen} tone={tone} />
                                  )}
                                </>
                              )}
                            </NavLink>
                          );

                          return (
                            <SidebarMenuItem key={item.to}>
                              <SidebarMenuButton asChild isActive={active}>
                                {tracked ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                                    <TooltipContent side="right" className="text-xs">
                                      <div className="font-medium">{item.label}</div>
                                      {showSkeleton ? (
                                        <div className="text-muted-foreground">Loading…</div>
                                      ) : (
                                        <>
                                          <div className="text-muted-foreground">
                                            {detail?.hint}
                                          </div>
                                          {unseen > 0 && unseen !== total && (
                                            <div className="text-muted-foreground">
                                              {unseen} new since last visit
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  linkEl
                                )}
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
      </TooltipProvider>
    </Sidebar>
  );
};

export const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const drawer = useAdminUserDrawerStore();
  useAdminRealtimeSync();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <div className="sticky top-0 z-10 flex h-11 items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Radio className="h-3 w-3" />
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        </SidebarInset>
      </div>
      <AdminUserDrawer
        userId={drawer.userId}
        open={drawer.open}
        onOpenChange={(v) => adminUserDrawer.setOpen(v)}
      />
    </SidebarProvider>
  );
};
