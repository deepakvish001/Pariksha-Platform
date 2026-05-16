import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { createPortal } from "react-dom";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Lock,
  Check,
  BookmarkCheck,
  ListChecks,
  Puzzle,
  Cpu,
  Wrench,
  AlertTriangle,
  Briefcase,
  Mic,
  Coffee,
  Target,
  Flame,
  Globe,
  Box,
  Type as TypeIcon,
  Grid3x3,
  Layers,
  GitBranch,
  Search as SearchIcon,
  Link2,
  Lightbulb,
  CalendarRange,
  Shuffle,
  Network,
  Activity,
  Zap,
  KeyRound,
  Hammer,
  Menu,
  PanelLeft,
  PanelLeftClose,
  X as XIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { DSA_TOPICS as TOPICS, type Diff, type DsaProblem as Problem } from "@/data/dsaStudioData";
import CommonPatternsView from "@/components/dsa/CommonPatternsView";
import CodeTricksView from "@/components/dsa/CodeTricksView";

const REFERENCE: { id: string; label: string; icon: any; count?: number; badge?: string }[] = [
  { id: "patterns", label: "Common Patterns", icon: Puzzle, count: 43 },
  { id: "tricks", label: "Code Tricks", icon: Wrench },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle },
];

const TABS: { id: string; label: string; icon: any; accent: string; badge?: string }[] = [
  { id: "problems", label: "Problems", icon: ListChecks, accent: "text-sky-400" },
  { id: "patterns", label: "Common Patterns", icon: Puzzle, accent: "text-emerald-400" },
  { id: "tricks", label: "Code Tricks", icon: Wrench, accent: "text-amber-400" },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle, accent: "text-orange-400" },
];

const TAB_PATHS: Record<string, string> = {
  problems: "/learn/dsa-studio/problems",
  patterns: "/learn/dsa-studio/patterns",
  tricks: "/learn/dsa-studio/tricks",
  edge: "/learn/dsa-studio/edge",
};

const pathToTab = (pathname: string): string => {
  if (pathname.endsWith("/patterns")) return "patterns";
  if (pathname.endsWith("/tricks")) return "tricks";
  if (pathname.endsWith("/edge")) return "edge";
  if (pathname.endsWith("/problems")) return "problems";
  return "hub";
};

const SEQUENCE = [
  "Arrays", "Strings", "Matrix", "Stack", "Queue", "Binary Search", "Linked List", "Greedy",
  "Intervals", "Backtracking", "Tree", "Heap", "Graph", "Dynamic Programming", "Bit Manipulation", "Trie", "Design",
];

const PRIORITY_LEVELS = [
  { dot: "bg-rose-500", label: "P1 — Must Do", desc: "High interview frequency, core patterns" },
  { dot: "bg-amber-400", label: "P2 — Important", desc: "Commonly asked, good to know" },
  { dot: "bg-zinc-500", label: "P3 — Good to Know", desc: "Warmup / low frequency" },
];

const diffStyles: Record<Diff, string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

type PriorityFilter = "all" | "p1" | "p1p2" | "p3" | "free";
type StatusFilter = "all" | "todo" | "solved" | "saved";

const LS_PREFS = "dsaStudio:prefs:v1";
const LS_SOLVED = "dsaStudio:solved:v1";
const LS_SAVED = "dsaStudio:saved:v1";
const LS_SCROLL = "dsaStudio:scroll:v1";

const loadJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

interface Prefs {
  activeTopic: string;
  activeTab: string;
  search: string;
  priority: PriorityFilter;
  status?: StatusFilter;
}

const DEFAULT_PREFS: Prefs = {
  activeTopic: "arrays",
  activeTab: "problems",
  search: "",
  priority: "all",
  status: "all",
};

export default function DsaStudio() {
  const initial = loadJSON<Prefs>(LS_PREFS, DEFAULT_PREFS);
  const [activeTopic, setActiveTopic] = useState(initial.activeTopic);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);
  const setActiveTab = (id: string) => {
    navigate(TAB_PATHS[id] ?? TAB_PATHS.problems);
  };
  const [search, setSearch] = useState(initial.search);
  const [priority, setPriority] = useState<PriorityFilter>(initial.priority);
  const [status, setStatus] = useState<StatusFilter>(initial.status ?? "all");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const qaMode = searchParams.get("qa") === "1";
  const toggleQa = () => {
    const next = new URLSearchParams(searchParams);
    if (qaMode) next.delete("qa"); else next.set("qa", "1");
    setSearchParams(next, { replace: true });
  };

  const [solved, setSolved] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(LS_SOLVED, [])),
  );
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(LS_SAVED, [])),
  );

  useEffect(() => {
    window.localStorage.setItem(
      LS_PREFS,
      JSON.stringify({ activeTopic, activeTab, search, priority, status }),
    );
  }, [activeTopic, activeTab, search, priority, status]);

  useEffect(() => {
    window.localStorage.setItem(LS_SOLVED, JSON.stringify(Array.from(solved)));
  }, [solved]);
  useEffect(() => {
    window.localStorage.setItem(LS_SAVED, JSON.stringify(Array.from(saved)));
  }, [saved]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasActiveFilters = search.trim() !== "" || priority !== "all" || status !== "all";
  const clearAllFilters = () => { setSearch(""); setPriority("all"); setStatus("all"); };

  // Ref to scrollable main container (the right-side scroll area)
  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Restore scroll position on mount; persist on scroll & unmount
  useEffect(() => {
    const raw = window.localStorage.getItem(LS_SCROLL);
    const y = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(y) && y > 0) {
      const id = window.setTimeout(() => {
        mainScrollRef.current?.scrollTo({ top: y, behavior: "auto" });
      }, 50);
      return () => window.clearTimeout(id);
    }
  }, []);

  // Enable smooth scrolling and header-aware scroll padding while this page is mounted
  useEffect(() => {
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = prevBehavior;
    };
  }, []);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        window.localStorage.setItem(LS_SCROLL, String(el.scrollTop));
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.localStorage.setItem(LS_SCROLL, String(el.scrollTop));
    };
  }, []);

  // Measure header height -> CSS var so sticky offsets adapt to viewport
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(57);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--dsa-header-h", `${h}px`);
      setHeaderH((prev) => (prev === h ? prev : h));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  const toggleSet = (setter: typeof setSolved) => (slug: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  const toggleSolved = toggleSet(setSolved);
  const toggleSaved = toggleSet(setSaved);

  const matchesPriority = (p: Problem) => {
    switch (priority) {
      case "all": return true;
      case "p1": return p.priority === "P1";
      case "p1p2": return p.priority === "P1" || p.priority === "P2";
      case "p3": return p.priority === "P3";
      case "free": return !!p.free;
    }
  };

  const matchesStatus = (p: Problem) => {
    switch (status) {
      case "all": return true;
      case "todo": return !solved.has(p.slug);
      case "solved": return solved.has(p.slug);
      case "saved": return saved.has(p.slug);
    }
  };

  const filteredByTopic = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TOPICS.map((t) => {
      const groups = t.groups
        .map((g) => ({
          ...g,
          problems: g.problems.filter((p) => {
            if (!matchesPriority(p)) return false;
            if (!matchesStatus(p)) return false;
            if (!q) return true;
            return p.title.toLowerCase().includes(q) || String(p.id).includes(q);
          }),
        }))
        .filter((g) => g.problems.length);
      const rendered = groups.reduce((s, g) => s + g.problems.length, 0);
      const total = t.groups.reduce((s, g) => s + g.problems.length, 0);
      const solvedInTopic = t.groups.reduce(
        (s, g) => s + g.problems.filter((p) => solved.has(p.slug)).length,
        0,
      );
      return { topic: t, groups, rendered, total, solvedInTopic };
    });
  }, [search, priority, status, solved, saved]);

  const totalRendered = useMemo(
    () => filteredByTopic.reduce((s, t) => s + t.rendered, 0),
    [filteredByTopic],
  );
  const totalSolved = solved.size;
  const totalSaved = saved.size;

  const grandTotal = useMemo(
    () => TOPICS.reduce((s, t) => s + t.groups.reduce((x, g) => x + g.problems.length, 0), 0),
    [],
  );
  const difficultyTotals = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 } as Record<Diff, number>;
    for (const t of TOPICS) for (const g of t.groups) for (const p of g.problems) counts[p.difficulty]++;
    return counts;
  }, []);
  const qaMismatches = useMemo(
    () =>
      TOPICS
        .map((t) => {
          const actual = t.groups.reduce((x, g) => x + g.problems.length, 0);
          return { id: t.id, label: t.label, expected: t.count, actual };
        })
        .filter((r) => r.expected !== r.actual),
    [],
  );
  const mismatchIds = useMemo(() => new Set(qaMismatches.map((m) => m.id)), [qaMismatches]);

  // Scroll-spy: track which topic section is most visible and highlight in sidebar
  const topicSectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isProgrammaticScroll = useRef(false);
  useEffect(() => {
    const rootEl = mainScrollRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.topicId;
          if (id) setActiveTopic(id);
          return;
        }
        const triggerY = 16;
        const candidates = Object.entries(topicSectionRefs.current)
          .filter(([, el]) => !!el)
          .map(([id, el]) => ({ id, top: (el as HTMLElement).getBoundingClientRect().top }))
          .filter((c) => c.top <= triggerY)
          .sort((a, b) => b.top - a.top);
        if (candidates[0]) setActiveTopic(candidates[0].id);
      },
      {
        root: rootEl ?? null,
        rootMargin: `0px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 1],
      },
    );
    Object.values(topicSectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filteredByTopic, headerH]);

  const handleTopicClick = (id: string) => {
    setActiveTopic(id);
    const el = topicSectionRefs.current[id];
    const scroller = mainScrollRef.current;
    if (!el || !scroller) return;
    const offset = 12;
    const y = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
    isProgrammaticScroll.current = true;
    scroller.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    window.setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { /* noop */ }
      isProgrammaticScroll.current = false;
    }, 600);
  };

  const showSidebar = activeTab === "problems";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setMobileNavOpen(false);
    };
    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => mobileCloseRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      mobileToggleRef.current?.focus({ preventScroll: true });
    };
  }, [mobileNavOpen]);

  const handleSidebarTopicClick = (id: string) => {
    setMobileNavOpen(false);
    handleTopicClick(id);
  };

  const sidebarItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Keep the active sidebar item visible inside its scroll container
  useEffect(() => {
    const btn = sidebarItemRefs.current[activeTopic];
    if (!btn) return;
    const parent = btn.closest("[data-dsa-sidebar-scroll]") as HTMLElement | null;
    if (!parent) return;
    const bRect = btn.getBoundingClientRect();
    const pRect = parent.getBoundingClientRect();
    if (bRect.top < pRect.top + 8 || bRect.bottom > pRect.bottom - 8) {
      btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeTopic]);

  const sidebarContent = (
    <nav aria-label="Learning path topics" className="p-4 space-y-6">
      <div>
        <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Learning Path
        </p>
        <ul className="space-y-0.5">
          {TOPICS.map((t) => {
            const Icon = t.icon;
            const active = t.id === activeTopic;
            return (
              <li key={t.id}>
                <button
                  ref={(el) => { sidebarItemRefs.current[t.id] = el; }}
                  onClick={() => handleSidebarTopicClick(t.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{t.label}</span>
                  <span className={cn("text-xs", active ? "text-primary" : "text-muted-foreground/70")}>
                    {t.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Reference
        </p>
        <ul className="space-y-0.5">
          {REFERENCE.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.id}>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{r.label}</span>
                  {r.count !== undefined && (
                    <span className="text-xs text-muted-foreground/70">{r.count}</span>
                  )}
                  {r.badge && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {r.badge}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <Helmet>
        <title>DSA Studio — Pattern-Based Problem Practice | Parikshaa</title>
        <meta name="description" content="Practice data structures and algorithms by pattern. Sliding window, two pointers, graphs, DP and more — with curated problems, hints, and progress tracking." />
        <meta property="og:title" content="DSA Studio — Pattern-Based Problem Practice" />
        <meta property="og:description" content="Master DSA patterns with curated problems, hints, and tracked progress." />
        <link rel="canonical" href="https://www.parikshaa.org/learn/dsa-studio" />
      </Helmet>
      {/* Skip to content link (a11y) */}
      <a
        href="#dsa-main-content"
        onClick={(e) => {
          e.preventDefault();
          const el = mainScrollRef.current;
          if (!el) return;
          el.scrollTo({ top: 0, behavior: "smooth" });
          el.focus({ preventScroll: true });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header
        ref={headerRef}
        className="flex-none z-30 border-b border-border/40 bg-background/95 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            {showSidebar && (
              <>
                <button
                  ref={mobileToggleRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileNavOpen((v) => !v);
                  }}
                  aria-label={mobileNavOpen ? "Close topics menu" : "Open topics menu"}
                  aria-expanded={mobileNavOpen}
                  aria-controls="dsa-mobile-sidebar"
                  className="lg:hidden relative z-[60] inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  {mobileNavOpen ? <XIcon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopNavOpen((v) => !v)}
                  aria-label={desktopNavOpen ? "Hide learning path" : "Show learning path"}
                  aria-expanded={desktopNavOpen}
                  aria-controls="dsa-desktop-sidebar"
                  className="hidden lg:inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {desktopNavOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </button>
              </>
            )}
            <Link to="/learn" className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                DSA Studio
              </h1>
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
            <span>Total: <span className="text-foreground font-semibold">{grandTotal}</span></span>
            <span className="opacity-40">|</span>
            <span>Easy: <span className="text-emerald-400 font-semibold">{difficultyTotals.Easy}</span></span>
            <span className="opacity-40">|</span>
            <span>Medium: <span className="text-amber-400 font-semibold">{difficultyTotals.Medium}</span></span>
            <span className="opacity-40">|</span>
            <span>Hard: <span className="text-rose-400 font-semibold">{difficultyTotals.Hard}</span></span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 grid place-items-center text-sm font-bold text-white">
            DV
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Sidebar - independent scroll, sits beside main. Only shown on /problems. */}
        {showSidebar && desktopNavOpen && (
          <aside
            id="dsa-desktop-sidebar"
            aria-label="Topics navigation"
            data-dsa-sidebar-scroll
            className="hidden lg:block flex-none w-64 h-full border-r border-border/40 overflow-y-auto overscroll-contain bg-background"
          >
            {sidebarContent}
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {showSidebar && mobileNavOpen && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <button
              type="button"
              aria-label="Close topics menu"
              className="absolute inset-0 h-full w-full bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              id="dsa-mobile-sidebar"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dsa-mobile-sidebar-title"
              data-dsa-sidebar-scroll
              className="relative z-10 h-[100dvh] w-[85vw] max-w-xs overflow-y-auto border-r border-border/40 bg-background shadow-2xl"
            >
              <h2 id="dsa-mobile-sidebar-title" className="sr-only">Topics</h2>
              <button
                ref={mobileCloseRef}
                type="button"
                aria-label="Close topics menu"
                className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setMobileNavOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </button>
              {sidebarContent}
            </aside>
          </div>,
          document.body,
        )}

        {/* Main */}
        <main
          ref={mainScrollRef}
          id="dsa-main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 h-full overflow-y-auto px-4 md:px-6 pt-4 pb-4 md:pb-6 space-y-5 outline-none"
          style={{ scrollPaddingTop: "1rem" }}
        >
          {/* Tabs row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary shadow-md shadow-primary/10"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : t.accent)} />
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </motion.div>

          {activeTab === "hub" ? (
            <DsaStudioHub />
          ) : activeTab === "patterns" ? <CommonPatternsView /> : activeTab === "tricks" ? <CodeTricksView /> : activeTab === "edge" ? (
            <section className="rounded-xl border border-border/40 bg-card/40 p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-orange-400 mb-3">
                <AlertTriangle className="h-5 w-5" />
                Edge Cases
              </h2>
              <p className="text-sm text-muted-foreground">
                A curated list of tricky inputs, boundary conditions and gotchas across DSA topics. Coming soon.
              </p>
            </section>
          ) : (<>
          {/* Progress hero + Priority legend */}
          {(() => {
            const pct = grandTotal ? Math.round((totalSolved / grandTotal) * 100) : 0;
            const r = 52;
            const C = 2 * Math.PI * r;
            const dash = (pct / 100) * C;
            return (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hero card */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 via-card/40 to-background p-5 md:p-6">
                  <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                  <div className="relative flex items-center gap-5 md:gap-7">
                    {/* Ring */}
                    <div className="relative h-28 w-28 shrink-0 grid place-items-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeOpacity="0.25" strokeWidth="8" />
                        <circle
                          cx="60" cy="60" r={r} fill="none"
                          stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${dash} ${C}`}
                          className="transition-[stroke-dasharray] duration-700 ease-out drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                        />
                      </svg>
                      <div className="text-center leading-tight">
                        <div className="text-2xl font-bold">{pct}%</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Done</div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h2 className="flex items-center gap-2 text-base md:text-lg font-bold">
                          <Target className="h-4 w-4 text-primary" />
                          Your Progress
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Keep solving — small daily reps compound fast.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-border/40 bg-card/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Solved</div>
                          <div className="text-emerald-400 font-bold text-lg leading-none mt-1">
                            {totalSolved}
                            <span className="text-muted-foreground/60 text-xs font-normal"> / {grandTotal}</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-card/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Saved</div>
                          <div className="text-amber-400 font-bold text-lg leading-none mt-1">{totalSaved}</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-card/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Topics</div>
                          <div className="text-sky-400 font-bold text-lg leading-none mt-1">{TOPICS.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority legend card */}
                <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
                    Priority Guide
                  </div>
                  <div className="space-y-2.5">
                    {PRIORITY_LEVELS.map((p) => (
                      <div key={p.label} className="flex items-start gap-2.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", p.dot)} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{p.label}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug">{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Recommended sequence — connected stepper */}
          <section className="rounded-2xl border border-border/50 bg-card/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="h-4 w-4 text-emerald-400" />
                Recommended Learning Path
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {SEQUENCE.length} Modules
              </span>
            </div>
            <div className="relative overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-stretch gap-2 min-w-max">
                {SEQUENCE.map((s, i) => {
                  const item = filteredByTopic.find(
                    (ft) => ft.topic.label.toLowerCase() === s.toLowerCase(),
                  );
                  const tid = item?.topic.id;
                  const done = item?.solvedInTopic ?? 0;
                  const total = item?.total ?? 0;
                  const isDone = total > 0 && done >= total;
                  return (
                    <div key={s} className="flex items-center gap-2 group">
                      <button
                        type="button"
                        onClick={() =>
                          tid &&
                          document
                            .querySelector(`[data-topic-id="${tid}"]`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                        className={cn(
                          "w-32 rounded-xl border p-2.5 text-left transition-all hover:border-primary/50 hover:bg-card/70",
                          isDone
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-border/40 bg-card/30",
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isDone ? "text-emerald-400" : "text-muted-foreground",
                          )}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {isDone ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-border/60" />
                          )}
                        </div>
                        <div className="text-xs font-semibold truncate">{s}</div>
                        {total > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {done}/{total}
                          </div>
                        )}
                      </button>
                      {i < SEQUENCE.length - 1 && (
                        <div className="w-4 h-px bg-border/60 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Sticky filter bar — sticks to top of <main> scroll container */}
          <div
            className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/90 backdrop-blur-xl border-y border-border/40 space-y-2 shadow-[0_8px_24px_-12px_hsl(var(--background))]"
          >
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search by name or number…  (press "/" to focus)'
                  className="pl-9 pr-9 h-10 bg-card/40"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "all", label: "All" },
                  { id: "p1", label: "P1", dot: "bg-rose-500" },
                  { id: "p1p2", label: "P1+P2", dot: "bg-amber-400" },
                  { id: "p3", label: "P3", dot: "bg-zinc-500" },
                  { id: "free", label: "Free", icon: Lock },
                ] as { id: PriorityFilter; label: string; dot?: string; icon?: typeof Lock }[]).map((b) => {
                  const active = priority === b.id;
                  const Icon = b.icon;
                  return (
                    <Button
                      key={b.id}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => setPriority(b.id)}
                      className="h-10 gap-1.5"
                    >
                      {b.dot && <span className={cn("h-2 w-2 rounded-full", b.dot)} />}
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {b.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-md border border-border/50 bg-card/40 p-0.5 text-xs">
                {([
                  { id: "all", label: "All" },
                  { id: "todo", label: "To-do" },
                  { id: "solved", label: "Solved" },
                  { id: "saved", label: "Saved" },
                ] as { id: StatusFilter; label: string }[]).map((s) => {
                  const active = status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        "px-3 h-8 rounded-[5px] font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Showing <span className="text-foreground font-semibold">{totalRendered}</span>
                  {" "}of <span className="text-foreground font-semibold">{grandTotal}</span>
                </span>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="h-7 px-2 gap-1 text-xs"
                  >
                    <XIcon className="h-3 w-3" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Empty state when filters yield nothing */}
          {totalRendered === 0 && (
            <div className="rounded-xl border border-dashed border-border/50 bg-card/20 p-10 md:p-14 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted/40 grid place-items-center">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No problems match your filters</h3>
              <p className="text-sm text-muted-foreground">
                Try a different search term, change the priority, or clear filters to see everything.
              </p>
              {hasActiveFilters && (
                <Button size="sm" onClick={clearAllFilters} className="mt-1">
                  <XIcon className="h-3.5 w-3.5" /> Clear all filters
                </Button>
              )}
            </div>
          )}


          {/* QA mode banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={toggleQa}
              data-testid="dsa-qa-toggle"
              className={cn(
                "text-[11px] font-mono px-2 py-1 rounded border transition-colors",
                qaMode
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                  : "border-border/50 text-muted-foreground hover:text-foreground",
              )}
            >
              QA mode: {qaMode ? "ON" : "OFF"}
            </button>
            <span
              data-testid="dsa-grand-total"
              className="text-[11px] font-mono text-muted-foreground"
            >
              Total indexed: <span className="text-foreground font-semibold">{grandTotal}</span>/171
            </span>
          </div>
          {qaMode && qaMismatches.length > 0 && (
            <div
              data-testid="dsa-qa-mismatches"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-1"
            >
              <div className="font-semibold text-amber-300">QA mismatches detected:</div>
              <ul className="text-muted-foreground space-y-0.5">
                {qaMismatches.map((m) => (
                  <li key={m.id}>
                    <span className="text-foreground">{m.label}</span>: expected {m.expected}, rendered {m.actual}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All topics rendered as scroll-spy sections */}
          {filteredByTopic.map(({ topic: t, groups, rendered, total, solvedInTopic }) => {
            const TIcon = t.icon;
            const hasMismatch = mismatchIds.has(t.id);
            const pct = total ? Math.round((solvedInTopic / total) * 100) : 0;
            // When status/priority/search filters hide every problem in a topic, skip rendering it
            // (the global empty state already covers the "nothing matches anywhere" case).
            if (rendered === 0 && hasActiveFilters) return null;
            return (
              <section
                key={t.id}
                data-topic-id={t.id}
                ref={(el) => { topicSectionRefs.current[t.id] = el; }}
                tabIndex={-1}
                aria-labelledby={`dsa-topic-${t.id}-heading`}
                className="space-y-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-md"
                style={{ scrollMarginTop: "calc(var(--dsa-header-h, 57px) + 4.5rem)" }}
              >
                {/* Topic header */}
                <div className="flex items-end justify-between flex-wrap gap-3 pt-2">
                  <div className="min-w-0">
                    <h2 id={`dsa-topic-${t.id}-heading`} className="flex items-center gap-2 text-2xl font-bold">
                      <TIcon className={cn("h-6 w-6", qaMode && hasMismatch ? "text-amber-400" : "text-primary")} />
                      {t.label}
                      <Badge variant="outline" className="h-5 text-[10px] font-mono">
                        {solvedInTopic}/{total}
                      </Badge>
                      {pct === 100 && total > 0 && (
                        <Badge className="h-5 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                          ✓ Complete
                        </Badge>
                      )}
                      {qaMode && hasMismatch && (
                        <Badge className="h-5 text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40">
                          mismatch
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[140px]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{rendered === total ? `${total} problems` : `${rendered} of ${total} shown`}</span>
                      <span className="text-emerald-400 font-mono">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-32 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      data-testid="dsa-rendered-indicator"
                      className="sr-only"
                    >
                      Rendered: {rendered}/{total}
                    </span>
                  </div>
                </div>

                {groups.length === 0 && !hasActiveFilters && (
                  <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-10 text-center text-muted-foreground">
                    No problems indexed for <span className="text-foreground font-medium">{t.label}</span> yet — coming soon.
                  </div>
                )}

                {groups.map((g) => (
                  <section key={g.name} className="space-y-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="h-px flex-1 bg-border/40" />
                      <span className="px-2">{g.name}</span>
                      <span className="text-muted-foreground/60 font-mono normal-case tracking-normal">
                        {g.problems.length}
                      </span>
                      <span className="h-px flex-1 bg-border/40" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {g.problems.map((p, idx) => {
                        const isSolved = solved.has(p.slug);
                        const isSaved = saved.has(p.slug);
                        const stop = (e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                        };
                        const priorityAccent =
                          p.priority === "P1"
                            ? "from-rose-500/60 to-rose-500/0"
                            : p.priority === "P2"
                              ? "from-amber-400/60 to-amber-400/0"
                              : "from-zinc-500/40 to-zinc-500/0";
                        const priorityText =
                          p.priority === "P1"
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                            : p.priority === "P2"
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                              : "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
                        return (
                          <motion.div
                            key={p.slug}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                          >
                            <Link
                              to={`/learn/dsa-studio/${p.slug}`}
                              data-testid="dsa-problem-card"
                              data-slug={p.slug}
                              state={{ from: "/learn/dsa-studio" }}
                              className={cn(
                                "group relative block overflow-hidden rounded-xl border bg-card/40 p-3.5 transition-all duration-200",
                                "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5",
                                isSolved
                                  ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                                  : "border-border/40",
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b opacity-80",
                                  priorityAccent,
                                )}
                              />

                              <div className="flex items-start gap-3 pl-1.5">
                                <button
                                  onClick={(e) => { stop(e); toggleSolved(p.slug); }}
                                  aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                  title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                  className={cn(
                                    "mt-0.5 h-6 w-6 grid place-items-center rounded-full border-2 shrink-0 transition-all",
                                    isSolved
                                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                                      : "border-border/60 text-transparent hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5",
                                  )}
                                >
                                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </button>

                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={cn(
                                      "text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors",
                                      isSolved && "text-muted-foreground line-through decoration-emerald-500/40",
                                    )}>
                                      {p.title}
                                    </h4>
                                    <button
                                      onClick={(e) => { stop(e); toggleSaved(p.slug); }}
                                      aria-label={isSaved ? "Remove from saved" : "Save for later"}
                                      title={isSaved ? "Remove from saved" : "Save for later"}
                                      className={cn(
                                        "shrink-0 -mr-1 -mt-0.5 h-7 w-7 grid place-items-center rounded-md transition-all",
                                        isSaved
                                          ? "text-amber-400 bg-amber-500/10"
                                          : "text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100",
                                      )}
                                    >
                                      <Star className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/40 rounded px-1.5 py-0.5">
                                      #{p.id}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn("h-5 text-[10px] px-1.5 font-semibold border", diffStyles[p.difficulty])}
                                    >
                                      {p.difficulty}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={cn("h-5 text-[10px] px-1.5 font-bold border", priorityText)}
                                    >
                                      {p.priority}
                                    </Badge>
                                    {p.free && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 text-[10px] px-1.5 gap-1 text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                      >
                                        <Lock className="h-2.5 w-2.5" /> Free
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {p.tag}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </section>
            );
          })}
          </>)}
        </main>
      </div>
    </div>
  );
}

const HUB_CARDS = [
  {
    to: "/learn/dsa-studio/problems",
    label: "Problems",
    desc: "Curated DSA problems by topic with priorities, hints and progress tracking.",
    icon: ListChecks,
    accent: "from-sky-500/20 to-cyan-500/10 border-sky-500/30",
    iconBg: "bg-sky-500/15 text-sky-400",
    cta: "Start Practicing",
  },
  {
    to: "/learn/dsa-studio/patterns",
    label: "Common Patterns",
    desc: "43 reusable patterns — sliding window, two pointers, backtracking, DP and more.",
    icon: Puzzle,
    accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    cta: "Explore Patterns",
  },
  {
    to: "/learn/dsa-studio/tricks",
    label: "Code Tricks",
    desc: "Battle-tested code idioms and shortcuts that save you precious interview time.",
    icon: Wrench,
    accent: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    iconBg: "bg-amber-500/15 text-amber-400",
    cta: "Open Tricks",
  },
  {
    to: "/learn/dsa-studio/edge",
    label: "Edge Cases",
    desc: "Tricky inputs, boundary conditions and gotchas that interviewers love to test.",
    icon: AlertTriangle,
    accent: "from-orange-500/20 to-rose-500/10 border-orange-500/30",
    iconBg: "bg-orange-500/15 text-orange-400",
    cta: "View Edge Cases",
  },
];

function DsaStudioHub() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-card/40 to-card/20 p-6 md:p-8"
      >
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <Badge className="mb-3 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
            <Flame className="h-3 w-3 mr-1" /> DSA Studio
          </Badge>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Master DSA the <span className="bg-gradient-to-r from-primary via-emerald-400 to-sky-400 bg-clip-text text-transparent">pattern-first</span> way.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
            Practice curated problems, learn reusable patterns, master code tricks and never miss an edge case. Pick a track to begin.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/learn/dsa-studio/problems"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              <ListChecks className="h-4 w-4" />
              Start with Problems
            </Link>
            <Link
              to="/learn/dsa-studio/patterns"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/60 bg-card/40 text-sm font-medium hover:border-border transition"
            >
              <Puzzle className="h-4 w-4 text-emerald-400" />
              Browse Patterns
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2">
        {HUB_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to={c.to}
                className={cn(
                  "group block h-full rounded-xl border bg-gradient-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                  c.accent,
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", c.iconBg)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-base">{c.label}</h3>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition">→</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary/90 group-hover:text-primary">
                      {c.cta}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


