import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
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

const REFERENCE = [
  { id: "patterns", label: "Common Patterns", icon: Puzzle, count: 43 },
  { id: "system", label: "System Design", icon: Cpu, badge: "NEW" },
  { id: "tricks", label: "Code Tricks", icon: Wrench },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle },
];

const TABS = [
  { id: "problems", label: "Problems", icon: ListChecks, accent: "text-sky-400" },
  { id: "patterns", label: "Common Patterns", icon: Puzzle, accent: "text-emerald-400" },
  { id: "system", label: "System Design", icon: Cpu, accent: "text-violet-400" },
  { id: "tricks", label: "Code Tricks", icon: Wrench, accent: "text-amber-400" },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle, accent: "text-orange-400" },
  { id: "jobs", label: "Jobs", icon: Briefcase, accent: "text-pink-400" },
  { id: "mock", label: "Mock Interview", icon: Mic, accent: "text-rose-400" },
  { id: "java", label: "Java", icon: Coffee, accent: "text-yellow-500" },
];

const SUB_TABS = [
  { id: "quiz", label: "Quiz", icon: Target, accent: "text-rose-400" },
  { id: "focus", label: "Focus", icon: Flame, accent: "text-orange-400" },
  { id: "explore", label: "Explore", icon: Globe, accent: "text-sky-400", badge: "AD" },
];

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
}

const DEFAULT_PREFS: Prefs = {
  activeTopic: "arrays",
  activeTab: "problems",
  search: "",
  priority: "all",
};

export default function DsaStudio() {
  const initial = loadJSON<Prefs>(LS_PREFS, DEFAULT_PREFS);
  const [activeTopic, setActiveTopic] = useState(initial.activeTopic);
  const [activeTab, setActiveTab] = useState(initial.activeTab);
  const [search, setSearch] = useState(initial.search);
  const [priority, setPriority] = useState<PriorityFilter>(initial.priority);
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
      JSON.stringify({ activeTopic, activeTab, search, priority }),
    );
  }, [activeTopic, activeTab, search, priority]);

  useEffect(() => {
    window.localStorage.setItem(LS_SOLVED, JSON.stringify(Array.from(solved)));
  }, [solved]);
  useEffect(() => {
    window.localStorage.setItem(LS_SAVED, JSON.stringify(Array.from(saved)));
  }, [saved]);

  // Restore scroll position on mount; persist on scroll & unmount
  useEffect(() => {
    const raw = window.localStorage.getItem(LS_SCROLL);
    const y = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(y) && y > 0) {
      // Defer to allow content to render
      const id = window.setTimeout(() => {
        window.scrollTo({ top: y, behavior: "auto" });
      }, 50);
      return () => window.clearTimeout(id);
    }
  }, []);

  // Enable smooth scrolling and header-aware scroll padding while this page is mounted
  useEffect(() => {
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    const prevPadding = root.style.scrollPaddingTop;
    root.style.scrollBehavior = "smooth";
    root.style.scrollPaddingTop = "calc(var(--dsa-header-h, 57px) + 12px)";
    return () => {
      root.style.scrollBehavior = prevBehavior;
      root.style.scrollPaddingTop = prevPadding;
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        window.localStorage.setItem(LS_SCROLL, String(window.scrollY));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.localStorage.setItem(LS_SCROLL, String(window.scrollY));
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

  const filteredByTopic = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TOPICS.map((t) => {
      const groups = t.groups
        .map((g) => ({
          ...g,
          problems: g.problems.filter((p) => {
            if (!matchesPriority(p)) return false;
            if (!q) return true;
            return p.title.toLowerCase().includes(q) || String(p.id).includes(q);
          }),
        }))
        .filter((g) => g.problems.length);
      const rendered = groups.reduce((s, g) => s + g.problems.length, 0);
      const total = t.groups.reduce((s, g) => s + g.problems.length, 0);
      return { topic: t, groups, rendered, total };
    });
  }, [search, priority]);

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
        // Fallback: pick the last section whose top crossed just below the header.
        const triggerY = headerH + 16;
        const candidates = Object.entries(topicSectionRefs.current)
          .filter(([, el]) => !!el)
          .map(([id, el]) => ({ id, top: (el as HTMLElement).getBoundingClientRect().top }))
          .filter((c) => c.top <= triggerY)
          .sort((a, b) => b.top - a.top);
        if (candidates[0]) setActiveTopic(candidates[0].id);
      },
      {
        rootMargin: `-${headerH + 8}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 1],
      },
    );
    Object.values(topicSectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filteredByTopic, headerH]);

  const handleTopicClick = (id: string) => {
    setActiveTopic(id);
    const el = topicSectionRefs.current[id];
    if (!el) return;
    const offset = headerH + 12;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    isProgrammaticScroll.current = true;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    // Move keyboard focus to the section so screen-reader / keyboard users land there
    window.setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { /* noop */ }
      isProgrammaticScroll.current = false;
    }, 600);
  };

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
    <div className="min-h-screen bg-background text-foreground" style={{ paddingTop: "var(--dsa-header-h, 57px)" }}>
      {/* Skip to content link (a11y) */}
      <a
        href="#dsa-main-content"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("dsa-main-content");
          if (!el) return;
          const headerVar = getComputedStyle(document.documentElement)
            .getPropertyValue("--dsa-header-h")
            .trim();
          const headerH = parseInt(headerVar, 10) || 57;
          const y = el.getBoundingClientRect().top + window.scrollY - (headerH + 12);
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
          el.focus({ preventScroll: true });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
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

      <div className={desktopNavOpen ? "flex lg:pl-64" : "flex"}>
        {/* Sidebar - truly fixed to viewport so it never scrolls with main content */}
        {desktopNavOpen && (
          <aside
            id="dsa-desktop-sidebar"
            aria-label="Topics navigation"
            data-dsa-sidebar-scroll
            className="hidden lg:block fixed left-0 w-64 border-r border-border/40 z-20 overflow-y-auto overscroll-contain bg-background"
            style={{
              top: "var(--dsa-header-h, 57px)",
              height: "calc(100dvh - var(--dsa-header-h, 57px))",
            }}
          >
            {sidebarContent}
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {mobileNavOpen && typeof document !== "undefined" && createPortal(
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
          id="dsa-main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 px-4 md:px-6 pb-4 md:pb-6 space-y-5 outline-none"
          style={{ paddingTop: "calc(var(--dsa-header-h, 57px) * 0.35 + 1rem)", scrollPaddingTop: "calc(var(--dsa-header-h, 57px) + 1rem)" }}
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

          <div className="flex flex-wrap gap-2">
            {SUB_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <Icon className={cn("h-4 w-4", t.accent)} />
                  <span className="font-medium">{t.label}</span>
                  {t.badge && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">
                      {t.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Recommended sequence */}
          <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-400 mb-3">
              <ListChecks className="h-4 w-4" />
              Recommended Learning Sequence
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {SEQUENCE.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="px-3 py-1 rounded-md text-xs bg-muted/40 border border-border/40 text-muted-foreground">
                    {i + 1}. {s}
                  </span>
                  {i < SEQUENCE.length - 1 && <span className="text-muted-foreground/50 text-xs">→</span>}
                </span>
              ))}
            </div>
          </section>

          {/* Priority */}
          <section className="rounded-xl border border-border/40 bg-card/30 p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-muted-foreground font-medium">Priority:</span>
            {PRIORITY_LEVELS.map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", p.dot)} />
                <span className="font-semibold">{p.label}</span>
                <span className="text-muted-foreground text-xs">{p.desc}</span>
              </div>
            ))}
          </section>

          {/* Search & filters */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problem name or number..."
                className="pl-9 h-10 bg-card/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "all", label: "All" },
                { id: "p1", label: "P1 Only", dot: "bg-rose-500" },
                { id: "p1p2", label: "P1 + P2", dot: "bg-amber-400" },
                { id: "p3", label: "P3 Only", dot: "bg-zinc-500" },
                { id: "free", label: "Free Only", icon: Lock },
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
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <span className="text-xs text-muted-foreground">STATUS</span>
                <span className="text-xs font-medium">All</span>
              </Button>
      </div>
    </div>

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
          {filteredByTopic.map(({ topic: t, groups, rendered, total }) => {
            const TIcon = t.icon;
            const hasMismatch = mismatchIds.has(t.id);
            return (
              <section
                key={t.id}
                data-topic-id={t.id}
                ref={(el) => { topicSectionRefs.current[t.id] = el; }}
                tabIndex={-1}
                aria-labelledby={`dsa-topic-${t.id}-heading`}
                className="space-y-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-md"
                style={{ scrollMarginTop: "calc(var(--dsa-header-h, 57px) + 0.75rem)" }}
              >
                {/* Topic header */}
                <div className="flex items-end justify-between flex-wrap gap-2 pt-2">
                  <div>
                    <h2 id={`dsa-topic-${t.id}-heading`} className="flex items-center gap-2 text-2xl font-bold">
                      <TIcon className={cn("h-6 w-6", qaMode && hasMismatch ? "text-amber-400" : "text-primary")} />
                      {t.label}
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
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm text-muted-foreground">{t.count} problems</span>
                    <span
                      data-testid="dsa-rendered-indicator"
                      className={cn(
                        "text-[11px] font-mono",
                        rendered === total ? "text-emerald-400" : "text-amber-400",
                      )}
                    >
                      Rendered: {rendered}/{total}
                    </span>
                  </div>
                </div>

                {groups.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-10 text-center text-muted-foreground">
                    No problems indexed for <span className="text-foreground font-medium">{t.label}</span> yet — coming soon.
                  </div>
                )}

                {groups.map((g) => (
                  <section key={g.name} className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {g.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {g.problems.map((p, idx) => {
                        const isSolved = solved.has(p.slug);
                        const isSaved = saved.has(p.slug);
                        const stop = (e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                        };
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
                                "group flex items-center gap-2 rounded-lg border bg-card/40 px-3 py-2.5 hover:border-primary/40 hover:bg-card/60 transition-all",
                                isSolved
                                  ? "border-emerald-500/40"
                                  : idx === 0
                                    ? "border-primary/40"
                                    : "border-border/40",
                              )}
                            >
                              <button
                                onClick={(e) => { stop(e); toggleSaved(p.slug); }}
                                aria-label={isSaved ? "Remove from saved" : "Save for later"}
                                title={isSaved ? "Remove from saved" : "Save for later"}
                                className={cn(
                                  "transition-colors",
                                  isSaved ? "text-amber-400" : "text-muted-foreground hover:text-amber-400",
                                )}
                              >
                                <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
                              </button>
                              <button
                                onClick={(e) => { stop(e); toggleSolved(p.slug); }}
                                aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                className={cn(
                                  "h-5 w-5 grid place-items-center rounded-full border transition-colors",
                                  isSolved
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                    : "border-border/60 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/40",
                                )}
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">#{p.id}</span>
                              <div className="flex-1 min-w-0">
                                <div className={cn("text-sm font-medium truncate", isSolved && "line-through text-muted-foreground")}>
                                  {p.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                                  <span>{p.tag}</span>
                                  <span className="opacity-50">·</span>
                                  <span className={cn(
                                    "font-semibold",
                                    p.priority === "P1" && "text-rose-400",
                                    p.priority === "P2" && "text-amber-400",
                                    p.priority === "P3" && "text-zinc-400",
                                  )}>{p.priority}</span>
                                  {p.free && <Lock className="h-2.5 w-2.5 opacity-40" />}
                                </div>
                              </div>
                              <Badge variant="outline" className={cn("h-5 text-[10px]", diffStyles[p.difficulty])}>
                                {p.difficulty}
                              </Badge>
                              {isSaved && (
                                <BookmarkCheck className="h-3.5 w-3.5 text-amber-400" />
                              )}
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
        </main>
      </div>
    </div>
  );
}
