import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, HeartPulse, Clock,
  ChevronDown, Star, Map as MapIcon, Inbox, ShieldAlert,
  Award, Trophy, Command as CommandIcon, ChevronRight, Pin,
  Bell, Brain, Code2, Newspaper, FileText, MessageCircle,
  GraduationCap, Building2, TrendingUp, BarChart3, Mail, History as HistoryIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { AdminBackdrop } from "./AdminBackdrop";
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
    {
      to: "/admin/problems",
      label: "Coding Problems",
      icon: FileCode2,
      children: [
        { to: "/admin/problems", label: "All problems", icon: FileCode2, end: true },
        { to: "/admin/problems/new", label: "New problem", icon: Sparkles, end: true },
        { to: "/admin/problems/import", label: "Bulk Import", icon: Upload, end: true },
      ],
    },
    {
      to: "/admin/blog",
      label: "Blog",
      icon: Newspaper,
      children: [
        { to: "/admin/blog", label: "All posts", icon: FileText, end: true },
        { to: "/admin/blog/new", label: "New post", icon: Sparkles, end: true },
        { to: "/admin/blog/comments", label: "Comments", icon: MessageCircle, end: true },
        { to: "/admin/blog/audit", label: "Audit log", icon: HistoryIcon, end: true },
      ],
    },
  ]},
  { label: "People", items: [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/roles", label: "Roles", icon: KeyRound },
    { to: "/admin/reports", label: "Reports", icon: Flag },
    { to: "/admin/arena-moderation", label: "Arena Moderation", icon: ShieldAlert },
    { to: "/admin/security", label: "Security Center", icon: ShieldAlert },
  ]},
  { label: "Engagement", items: [
    {
      to: "/admin/contests",
      label: "Contests",
      icon: Trophy,
      children: [
        { to: "/admin/contests", label: "All contests", icon: Trophy, end: true },
        { to: "/admin/contests/new", label: "New contest", icon: Sparkles, end: true },
        { to: "/admin/sideeye", label: "Side-Eye Console", icon: ShieldAlert, end: true },
        { to: "/admin/contests/integrity", label: "Integrity Queue", icon: ShieldAlert, end: true },
      ],
    },
    { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
    { to: "/admin/achievements", label: "Achievements", icon: Award },
    { to: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
    {
      to: "/admin/notifications",
      label: "Notifications",
      icon: Bell,
      children: [
        { to: "/admin/notifications", label: "Outbox", icon: Bell, end: true },
        { to: "/admin/alerts", label: "Contest Alerts", icon: ShieldAlert, end: true },
      ],
    },
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
  { label: "Parikshaa Suite", items: [
    {
      to: "/admin/parikshaa",
      label: "Parikshaa",
      icon: GraduationCap,
      children: [
        { to: "/admin/parikshaa", label: "Dashboard", icon: LayoutGrid, end: true },
        { to: "/admin/parikshaa/users", label: "Users", icon: Users, end: true },
        { to: "/admin/parikshaa/orgs", label: "Companies & Colleges", icon: Building2, end: true },
        { to: "/admin/parikshaa/moderation", label: "Moderation", icon: ShieldAlert, end: true },
        { to: "/admin/parikshaa/leads", label: "Leads & Growth", icon: TrendingUp, end: true },
        { to: "/admin/parikshaa/demo-requests", label: "Demo Requests", icon: Sparkles, end: true },
        { to: "/admin/parikshaa/funnel", label: "Conversion Funnel", icon: BarChart3, end: true },
        { to: "/admin/parikshaa/email-preview", label: "Email Preview", icon: Mail, end: true },
      ],
    },
    
  ]},
  { label: "System", items: [
    { to: "/admin/system-health", label: "System Health", icon: HeartPulse },
    { to: "/admin/cron-jobs", label: "Scheduled Jobs", icon: Clock },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  ]},
];

const TRACKED: BadgeKey[] = ["/admin/reports", "/admin/system-health", "/admin/support"];

const Badge = ({ count, tone = "default" }: { count: number; tone?: "default" | "alert" }) => {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none",
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

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItemOpen = (to: string) =>
    setOpenItems((prev) => ({ ...prev, [to]: !(prev[to] ?? false) }));

  const renderItem = (item: NavItem, opts?: { compact?: boolean; pinnedRow?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.to, item.end, item.match);
    const subItems = resolveDynamicChildren(item, pathname);
    const subActive = subItems.some((s) => isActive(s.to, s.end, s.match));
    const hasChildren = subItems.length > 0;
    // Auto-open when active/sub-active; otherwise honor user toggle (default closed)
    const userOpen = openItems[item.to];
    const expanded = userOpen ?? (active || subActive);
    const showSubNav = !collapsed && hasChildren && expanded && !opts?.pinnedRow;
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
          "group/item relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all duration-150",
          active
            ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5 admin-nav-flash"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {/* Left accent bar */}
        <span
          aria-hidden
          className={cn(
            "absolute -left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
            active ? "bg-primary opacity-100 scale-y-100" : "opacity-0 scale-y-0"
          )}
        />
        <span className="relative flex shrink-0 items-center">
          <Icon
            className={cn(
              "h-[18px] w-[18px] transition-transform",
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
            <span className="truncate text-[14px] tracking-tight">{item.label}</span>
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
                      "h-3.5 w-3.5",
                      isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              )}
              {hasChildren && !opts?.pinnedRow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleItemOpen(item.to);
                  }}
                  className="rounded p-0.5 hover:bg-muted-foreground/10"
                  aria-label={expanded ? "Collapse" : "Expand"}
                  aria-expanded={expanded}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      expanded ? "rotate-0" : "-rotate-90"
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
            <div className="text-muted-foreground"></div>
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
            className="mt-1 ml-7 flex flex-col gap-0.5 border-l border-border/40 pl-3"
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
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      subOn
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <SubIcon className="h-4 w-4 shrink-0" />
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
      <SidebarHeader className="border-b border-border/40 px-2.5 py-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-md shadow-primary/30">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="text-base font-bold tracking-tight">Admin Console</span>
                <span className="text-[11px] text-muted-foreground">Platform control center</span>
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
                <SidebarGroupLabel className="flex h-8 items-center gap-2 px-2.5 text-[12px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Pin className="h-3.5 w-3.5" />
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
                          "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-muted/40",
                          hasActive ? "text-primary" : "text-muted-foreground/80"
                        )}
                      >
                        <span>{group.label}</span>
                        {groupCount > 0 && <Badge count={groupCount} />}
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform duration-200",
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
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar onOpenPalette={() => setPaletteOpen(true)} />
        <SidebarInset className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex h-12 items-center justify-between gap-2 border-b border-border/40 bg-background/70 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
            {/* subtle amber underline glow */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <span aria-hidden className="hidden h-5 w-px bg-border/60 sm:block" />
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-primary to-amber-500 shadow-[0_0_12px_hsl(var(--primary)/0.45)]">
                  <Shield className="h-3 w-3 text-primary-foreground" />
                </span>
                <span className="text-[11px] font-semibold tracking-wide bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Control Center
                </span>
              </div>
              <span aria-hidden className="hidden h-5 w-px bg-border/60 sm:block" />
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
                className="hidden h-7 gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 text-[11px] text-muted-foreground backdrop-blur hover:border-primary/40 hover:text-foreground sm:inline-flex"
              >
                <CommandIcon className="h-3 w-3" />
                <span>Jump</span>
                <kbd className="rounded border border-border/50 bg-muted px-1 text-[10px] font-mono">⌘K</kbd>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
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
          <main className="relative min-w-0 flex-1 px-4 py-6 lg:px-8">
            <AdminBackdrop />
            <div className="relative">{children}</div>
          </main>
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
