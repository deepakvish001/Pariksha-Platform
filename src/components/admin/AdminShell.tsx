import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, HeartPulse, Clock,
  ChevronDown, Star, Map as MapIcon, Inbox, ShieldAlert,
  Award, Trophy, Command as CommandIcon, ChevronRight, Pin,
  Bell, Brain, Code2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { useAdminSidebarPrefs } from "@/hooks/admin/useAdminSidebarPrefs";
import { useAdminBreadcrumb } from "@/hooks/admin/useAdminBreadcrumb";
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
  /**
   * When true, the item is only "active" for an exact pathname match.
   * When false/undefined, the item is also active for any pathname that
   * starts with `to + "/"`. This default keeps overlapping routes (e.g.
   * `/admin/contests` vs `/admin/contests/new`) correctly highlighted on
   * the parent item; pair with `end: true` on a child if you want the
   * parent to deactivate when a child is selected.
   */
  end?: boolean;
  /**
   * Optional custom predicate to override the default isActive logic.
   * Receives the current pathname and returns whether this item should be
   * highlighted. Useful for routes with dynamic segments.
   */
  match?: (pathname: string) => boolean;
  /**
   * Optional sub-navigation. Rendered indented beneath the parent only when
   * the parent (or any sub-item) is active. Sub-items follow the same
   * `end` / `match` rules as top-level items.
   */
  children?: NavItem[];
  /**
   * Stable test selector hook for Playwright assertions.
   */
  testId?: string;
}
interface NavGroup { label: string; items: NavItem[] }

/**
 * Resolve a sidebar item's children dynamically from the current pathname.
 * Keeps nested sub-nav highlighting accurate even when route ids change
 * (e.g. /admin/contests/:id/edit, /registrations, /leaderboard).
 */
function resolveDynamicChildren(item: NavItem, pathname: string): NavItem[] {
  if (item.to === "/admin/contests") {
    const base: NavItem[] = [
      {
        to: "/admin/contests",
        label: "All contests",
        icon: Trophy,
        end: true,
        testId: "admin-nav-contests-all",
      },
      {
        to: "/admin/contests/new",
        label: "New contest",
        icon: Sparkles,
        end: true,
        testId: "admin-nav-contests-new",
      },
    ];
    // /admin/contests/:id(/edit|/registrations|/leaderboard)
    const m = pathname.match(/^\/admin\/contests\/([^/]+)(?:\/(edit|registrations|leaderboard))?\/?$/);
    if (m && m[1] !== "new") {
      const id = m[1];
      base.push(
        {
          to: `/admin/contests/${id}/edit`,
          label: "Edit contest",
          icon: SettingsIcon,
          end: true,
          testId: "admin-nav-contests-edit",
        },
        {
          to: `/admin/contests/${id}/registrations`,
          label: "Registrations",
          icon: Users,
          end: true,
          testId: "admin-nav-contests-registrations",
        },
        {
          to: `/admin/contests/${id}/leaderboard`,
          label: "Leaderboard",
          icon: Trophy,
          end: true,
          testId: "admin-nav-contests-leaderboard",
        },
      );
    }
    return base;
  }
  return item.children ?? [];
}

const GROUPS: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  ]},
  { label: "Content", items: [
    { to: "/admin/problems", label: "Coding Problems", icon: FileCode2 },
    { to: "/admin/problems/import", label: "Bulk Import", icon: Upload },
    { to: "/admin/ai-content", label: "AI Content", icon: Sparkles },
    { to: "/admin/featured", label: "Featured / Staff Picks", icon: Star },
    { to: "/admin/roadmaps", label: "Roadmaps Manager", icon: MapIcon },
  ]},
  { label: "People", items: [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/roles", label: "Roles", icon: KeyRound },
    { to: "/admin/reports", label: "Reports", icon: Flag },
    { to: "/admin/arena-moderation", label: "Arena Moderation", icon: ShieldAlert },
    { to: "/admin/security", label: "Security Center", icon: ShieldAlert },
  ]},
  { label: "Engagement", items: [
    { to: "/admin/daily-challenge", label: "Daily Challenge", icon: CalendarClock },
    { to: "/admin/contests", label: "Contests", icon: Trophy },
    { to: "/admin/contests/viva-queue", label: "Viva Queue", icon: ShieldAlert },
    { to: "/admin/contests/dq-signoffs", label: "DQ Sign-offs", icon: ShieldAlert },
    { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
    { to: "/admin/achievements", label: "Achievements", icon: Award },
    { to: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/alerts", label: "Contest Alerts", icon: ShieldAlert },
    { to: "/admin/support", label: "Support Inbox", icon: Inbox },
  ]},
  { label: "User Activity", items: [
    { to: "/admin/quizzes", label: "Quizzes & SRS", icon: Brain },
    { to: "/admin/submissions", label: "Code Submissions", icon: Code2 },
  ]},
  { label: "Platform", items: [
    { to: "/admin/settings", label: "Settings & Flags", icon: SettingsIcon },
    { to: "/admin/storage", label: "Storage", icon: Database },
  ]},
  { label: "System", items: [
    { to: "/admin/system-health", label: "System Health", icon: HeartPulse },
    { to: "/admin/cron-jobs", label: "Scheduled Jobs", icon: Clock },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
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

interface AdminSidebarProps {
  onOpenPalette: () => void;
}

const AdminSidebar = ({ onOpenPalette }: AdminSidebarProps) => {
  const { pathname } = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  const { data: badges, isLoading: badgesLoading, markSeen, clearAll } = useAdminSidebarBadges();
  const prefs = useAdminSidebarPrefs(pathname);

  const isActive = (to: string, end?: boolean, match?: (p: string) => boolean) => {
    if (match) return match(pathname);
    return end ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  };

  const flatItems = useMemo(() => GROUPS.flatMap((g) => g.items), []);
  const findItem = (to: string) => flatItems.find((i) => i.to === to);
  const pinnedItems = prefs.pinned.map(findItem).filter(Boolean) as NavItem[];

  const groupHasActive = (g: NavGroup) =>
    g.items.some((i) => isActive(i.to, i.end, i.match));

  // Auto-open active group + close mobile drawer
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    for (const g of GROUPS) if (groupHasActive(g) && prefs.openGroups[g.label] === false) {
      prefs.setGroupOpen(g.label, true);
    }
    setFlashKey((k) => k + 1);
    if (isMobile) setOpenMobile(false);
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

  const renderItem = (item: NavItem, opts?: { compact?: boolean; pinnedRow?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.to, item.end, item.match);
    const subItems = resolveDynamicChildren(item, pathname);
    const subActive = subItems.some((s) => isActive(s.to, s.end, s.match));
    const showSubNav = !collapsed && subItems.length > 0 && (active || subActive) && !opts?.pinnedRow;
    const detail: BadgeDetail | undefined = badges?.[item.to as BadgeKey];
    const tracked = (TRACKED as string[]).includes(item.to);
    const showSkeleton = tracked && badgesLoading && !detail;
    const unseen = detail?.unseen ?? 0;
    const tone: "default" | "alert" =
      item.to === "/admin/reports" || item.to === "/admin/system-health" ? "alert" : "default";
    const isPinned = prefs.isPinned(item.to);

    const linkEl = (
      <NavLink
        ref={active && !opts?.pinnedRow ? (activeRef as any) : undefined}
        to={item.to}
        end={item.end}
        data-testid={item.testId ?? `admin-nav-${item.to.replace(/^\/admin\/?/, "") || "dashboard"}`}
        key={`${item.to}-${active ? flashKey : "x"}`}
        className={cn(
          "group/item relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150",
          active
            ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5 admin-nav-flash"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {/* Left accent bar */}
        <span
          aria-hidden
          className={cn(
            "absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
            active ? "bg-primary opacity-100 scale-y-100" : "opacity-0 scale-y-0"
          )}
        />
        <span className="relative flex shrink-0 items-center">
          <Icon
            className={cn(
              "h-4 w-4 transition-transform",
              active ? "scale-110" : "group-hover/item:scale-105"
            )}
          />
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
            <span className="truncate text-[13px]">{item.label}</span>
            <span className="ml-auto flex items-center gap-1">
              {showSkeleton ? (
                <Skeleton className="h-4 w-6 rounded-full" />
              ) : (
                <Badge count={unseen} tone={tone} />
              )}
              {!opts?.pinnedRow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prefs.togglePin(item.to);
                  }}
                  className={cn(
                    "rounded p-0.5 opacity-0 transition-opacity hover:bg-muted-foreground/10 group-hover/item:opacity-100",
                    isPinned && "opacity-100"
                  )}
                  aria-label={isPinned ? "Unpin" : "Pin"}
                >
                  <Star
                    className={cn(
                      "h-3 w-3",
                      isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              )}
            </span>
          </>
        )}
      </NavLink>
    );

    const button = (
      <SidebarMenuButton asChild isActive={active || subActive}>
        {linkEl}
      </SidebarMenuButton>
    );

    const wrapped = tracked && !opts?.pinnedRow ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <div className="font-medium">{item.label}</div>
          {showSkeleton ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <div className="text-muted-foreground">{detail?.hint}</div>
          )}
        </TooltipContent>
      </Tooltip>
    ) : collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    ) : (
      button
    );

    return (
      <SidebarMenuItem key={`${opts?.pinnedRow ? "pin-" : ""}${item.to}`}>
        {wrapped}

        {showSubNav && (
          <ul
            data-testid={`admin-subnav-${item.to.replace(/^\/admin\/?/, "")}`}
            className="mt-1 ml-6 flex flex-col gap-0.5 border-l border-border/40 pl-2"
          >
            {subItems.map((sub) => {
              const SubIcon = sub.icon;
              const subOn = isActive(sub.to, sub.end, sub.match);
              return (
                <li key={sub.to}>
                  <NavLink
                    to={sub.to}
                    end={sub.end}
                    data-testid={sub.testId}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                      subOn
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <SubIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-gradient-to-b from-sidebar to-sidebar/95">
      <SidebarHeader className="border-b border-border/40 px-2 py-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-sm shadow-primary/20">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">Admin Console</span>
                <span className="text-[10px] text-muted-foreground">Platform control center</span>
              </div>
              <span className="ml-auto">
                <AdminBadgeSettings onMarkAllRead={clearAll} />
              </span>
            </>
          )}
        </div>
      </SidebarHeader>

      <TooltipProvider delayDuration={250}>
        <SidebarContent className="gap-0">
          {/* Pinned section */}
          {pinnedItems.length > 0 && (
            <SidebarGroup className="py-1">
              {!collapsed && (
                <SidebarGroupLabel className="flex h-7 items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  <Pin className="h-3 w-3" />
                  <span>Pinned</span>
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedItems.map((item) => renderItem(item, { pinnedRow: true }))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {GROUPS.map((group) => {
            const hasActive = groupHasActive(group);
            const persistedOpen = prefs.openGroups[group.label];
            const open = collapsed ? true : (persistedOpen ?? true);
            const groupCount = groupBadgeCount(group);

            return (
              <Collapsible
                key={group.label}
                open={open}
                onOpenChange={(v) => prefs.setGroupOpen(group.label, v)}
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
                        {groupCount > 0 && <Badge count={groupCount} />}
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
                        {group.items.map((item) => renderItem(item))}
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
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const prefs = useAdminSidebarPrefs(pathname);
  const crumbs = useAdminBreadcrumb(pathname, GROUPS);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar onOpenPalette={() => setPaletteOpen(true)} />
        <SidebarInset className="min-w-0 flex-1">
          <div className="sticky top-0 z-10 flex h-11 items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
                    {c.to && i < crumbs.length - 1 ? (
                      <Link to={c.to} className="truncate hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span className={cn("truncate", i === crumbs.length - 1 && "font-medium text-foreground")}>
                        {c.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-7 gap-1.5 px-2 text-[11px] text-muted-foreground sm:inline-flex"
              >
                <CommandIcon className="h-3 w-3" />
                <span>Jump</span>
                <kbd className="rounded border border-border/50 bg-muted px-1 text-[10px] font-mono">⌘K</kbd>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <Radio className="h-3 w-3" />
                      <span className="hidden sm:inline">Live</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Realtime admin sync is active
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        </SidebarInset>
      </div>
      <AdminCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={GROUPS}
        pinned={prefs.pinned}
        recent={prefs.recent}
      />
      <AdminUserDrawer
        userId={drawer.userId}
        open={drawer.open}
        onOpenChange={(v) => adminUserDrawer.setOpen(v)}
      />
    </SidebarProvider>
  );
};
