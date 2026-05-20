import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Radio,
  Filter,
  BarChart3,
  Mail,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminBackdrop } from "@/components/admin/AdminBackdrop";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

interface NavSubItem {
  to: string;
  label: string;
}
interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: NavSubItem[];
}
interface NavGroup {
  label: string;
  items: NavItem[];
}


const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin/parikshaa", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/parikshaa/users", label: "Users", icon: Users },
      {
        to: "/admin/parikshaa/orgs",
        label: "Companies & Colleges",
        icon: Building2,
        children: [
          { to: "/admin/parikshaa/orgs?tab=company", label: "Companies" },
          { to: "/admin/parikshaa/orgs?tab=college", label: "Colleges" },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/admin/parikshaa/moderation",
        label: "Moderation",
        icon: ShieldAlert,
        children: [
          { to: "/admin/parikshaa/moderation?tab=reports", label: "Reports" },
          { to: "/admin/parikshaa/moderation?tab=ai", label: "AI content" },
        ],
      },
      { to: "/admin/parikshaa/experiences", label: "Experiences", icon: ShieldAlert },
      { to: "/admin/parikshaa/leads", label: "Leads & Growth", icon: TrendingUp },
      { to: "/admin/parikshaa/demo-requests", label: "Demo Requests", icon: Sparkles },
      { to: "/admin/parikshaa/funnel", label: "Conversion Funnel", icon: BarChart3 },
      { to: "/admin/parikshaa/email-preview", label: "Email Preview", icon: Mail },
      { to: "/admin/parikshaa/proctoring", label: "Proctoring Review", icon: Filter },
    ],
  },
  {
    label: "Maintenance",
    items: [
      {
        to: "/admin/parikshaa/invite-source-backfill",
        label: "Invite Source Backfill",
        icon: Wrench,
      },
    ],
  },
];

const ParikshaaSidebar = () => {
  const { pathname } = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const groupHasActive = (g: NavGroup) =>
    g.items.some((i) => isActive(i.to, i.end));

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, true])),
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of GROUPS) if (groupHasActive(g)) next[g.label] = true;
      return next;
    });
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.to, item.end);
    const hasChildren = !!item.children?.length;
    const showSubNav = !collapsed && hasChildren && active;

    const link = (
      <NavLink
        ref={active ? (activeRef as any) : undefined}
        to={item.to}
        end={item.end}
        className={cn(
          "group/item relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150",
          active
            ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
            active ? "bg-primary opacity-100 scale-y-100" : "opacity-0 scale-y-0",
          )}
        />
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            active ? "scale-110" : "group-hover/item:scale-105",
          )}
        />
        {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
      </NavLink>
    );

    const button = (
      <SidebarMenuButton asChild isActive={active}>
        {link}
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={item.to}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ) : (
          button
        )}

        {showSubNav && (
          <ul className="mt-1 ml-6 flex flex-col gap-0.5 border-l border-border/40 pl-2">
            {item.children!.map((sub) => {
              const subOn = pathname + (typeof window !== "undefined" ? window.location.search : "") === sub.to;
              return (
                <li key={sub.to}>
                  <Link
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                      subOn
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-current opacity-60" />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-gradient-to-b from-sidebar to-sidebar/95"
    >
      <SidebarHeader className="border-b border-border/40 px-2 py-3">
        <NavLink
          to="/admin/parikshaa"
          className={cn("flex items-center gap-2.5", collapsed && "justify-center")}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-sm shadow-primary/20">
            <span className="text-sm font-bold text-primary-foreground">P</span>
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Parikshaa</span>
              <span className="text-[10px] text-muted-foreground">Control Center</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <TooltipProvider delayDuration={250}>
        <SidebarContent className="gap-0">
          {GROUPS.map((group) => {
            const hasActive = groupHasActive(group);
            const open = collapsed ? true : (openGroups[group.label] ?? true);

            return (
              <Collapsible
                key={group.label}
                open={open}
                onOpenChange={(v) =>
                  setOpenGroups((prev) => ({ ...prev, [group.label]: v }))
                }
              >
                <SidebarGroup className="py-1">
                  {!collapsed && (
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel
                        className={cn(
                          "flex h-7 cursor-pointer items-center gap-2 rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-muted/40",
                          hasActive ? "text-primary" : "text-muted-foreground/70",
                        )}
                      >
                        <span>{group.label}</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-3.5 w-3.5 transition-transform duration-200",
                            open ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                  )}

                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <SidebarGroupContent>
                      <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
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

/**
 * Build breadcrumbs from the current pathname by walking the URL segments
 * after `/admin/parikshaa`. Each intermediate crumb is clickable and the
 * last crumb represents the current page (non-clickable, highlighted).
 */
const ROOT = "/admin/parikshaa";
const SEGMENT_LABELS: Record<string, string> = {
  users: "Users",
  orgs: "Companies & Colleges",
  moderation: "Moderation",
  leads: "Leads & Growth",
  "demo-requests": "Demo Requests",
  funnel: "Conversion Funnel",
  "email-preview": "Email Preview",
  "invite-source-backfill": "Invite Source Backfill",
  proctoring: "Proctoring Review",
};

const buildCrumbs = (pathname: string) => {
  const crumbs: { label: string; to?: string }[] = [
    { label: "Parikshaa", to: ROOT },
  ];
  const rest = pathname.replace(/^\/admin\/parikshaa\/?/, "");
  if (!rest) return crumbs;
  const segments = rest.split("/").filter(Boolean);
  let acc = ROOT;
  segments.forEach((seg, idx) => {
    acc += "/" + seg;
    const label =
      SEGMENT_LABELS[seg] ??
      seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({
      label,
      to: idx < segments.length - 1 ? acc : undefined,
    });
  });
  return crumbs;
};

export function ParikshaaShell() {
  const { pathname } = useLocation();
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <ParikshaaSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex h-12 items-center justify-between gap-2 border-b border-border/40 bg-background/70 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <span aria-hidden className="hidden h-5 w-px bg-border/60 sm:block" />
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-primary to-amber-500 shadow-[0_0_12px_hsl(var(--primary)/0.45)]">
                  <span className="text-[10px] font-bold text-primary-foreground">P</span>
                </span>
                <span className="text-[11px] font-semibold tracking-wide bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Parikshaa
                </span>
              </div>
              <span aria-hidden className="hidden h-5 w-px bg-border/60 sm:block" />
              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
              >
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
                    {c.to && i < crumbs.length - 1 ? (
                      <Link to={c.to} className="truncate hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "truncate",
                          i === crumbs.length - 1 && "font-medium text-foreground",
                        )}
                      >
                        {c.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="hidden h-7 items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 text-[11px] text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
              >
                <ArrowLeft className="h-3 w-3" />
                Learning admin
              </Link>
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
                    Realtime sync is active
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <main className="relative min-w-0 flex-1 px-4 py-6 lg:px-8">
            <AdminBackdrop />
            <div className="relative">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

/**
 * Backwards-compatible page header for existing Parikshaa pages.
 * Wraps AdminPageHeader so the look matches /admin pages.
 */
export function ShellHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <AdminPageHeader title={title} actions={actions} />;
}
