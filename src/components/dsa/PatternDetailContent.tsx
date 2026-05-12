import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  Link2,
  Sparkles,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommonPattern, PatternCategory, PatternProblem } from "@/data/dsaCommonPatternsData";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "when-to-use", label: "When to use" },
  { id: "complexity", label: "Complexity" },
  { id: "problems", label: "Problems" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const diffStyles: Record<PatternProblem["difficulty"], string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

export function splitComplexity(cx: string): { time: string; space: string } {
  const parts = cx.split("/").map((s) => s.trim());
  if (parts.length >= 2) return { time: parts[0], space: parts[1] };
  return { time: cx.trim(), space: "—" };
}

export function deriveWhenToUse(p: CommonPattern): string[] {
  const sentences = p.description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bullets: string[] = [];
  if (p.subtitle) bullets.push(p.subtitle);
  for (const s of sentences) {
    if (bullets.length >= 4) break;
    if (s.length < 6) continue;
    bullets.push(s.replace(/\s+/g, " "));
  }
  return bullets.length ? bullets : [p.description];
}

function highlightTitle(title: string) {
  const parts = title.split(" ");
  if (parts.length < 2) return <>{title}</>;
  const last = parts.pop()!;
  return (
    <>
      {parts.join(" ")} <span className="text-sky-400">{last}</span>
    </>
  );
}

interface Props {
  pattern: CommonPattern;
  category: PatternCategory | null;
  bookmarks: Set<string>;
  done: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleDone: (id: string) => void;
  onBack: () => void;
  backLabel?: string;
}

export default function PatternDetailContent({
  pattern,
  category,
  bookmarks,
  done,
  onToggleBookmark,
  onToggleDone,
  onBack,
  backLabel = "Patterns",
}: Props) {
  const isBookmarked = bookmarks.has(pattern.id);
  const isDone = done.has(pattern.id);
  const cx = splitComplexity(pattern.complexity);
  const whenToUse = deriveWhenToUse(pattern);

  // Per-problem completion (separate from per-pattern done state)
  const PROBLEMS_LS = "dsaPatterns:problemsDone:v1";
  const [problemsDone, setProblemsDone] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(PROBLEMS_LS);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PROBLEMS_LS, JSON.stringify([...problemsDone]));
    } catch {
      /* ignore */
    }
  }, [problemsDone]);
  const toggleProblem = (key: string) =>
    setProblemsDone((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const problemKey = (prId: string, url: string) => `${pattern.id}::${prId}::${url}`;
  const completedProblems = pattern.problems.filter((pr) =>
    problemsDone.has(problemKey(pr.id, pr.url)),
  ).length;
  const totalProblems = pattern.problems.length;
  const completionPct = totalProblems
    ? Math.round((completedProblems / totalProblems) * 100)
    : 0;

  const difficultyCounts = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 } as Record<PatternProblem["difficulty"], number>;
    pattern.problems.forEach((p) => (c[p.difficulty] += 1));
    return c;
  }, [pattern.problems]);

  type ProblemFilter = "all" | "remaining" | "completed";
  const [problemFilter, setProblemFilter] = useState<ProblemFilter>("all");
  const filteredProblems = useMemo(() => {
    if (problemFilter === "all") return pattern.problems;
    return pattern.problems.filter((pr) => {
      const isDoneNow = problemsDone.has(problemKey(pr.id, pr.url));
      return problemFilter === "completed" ? isDoneNow : !isDoneNow;
    });
    // problemKey is stable (depends on pattern.id which is in deps via pattern.problems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.problems, problemFilter, problemsDone]);

  // Sibling navigation within the same category
  const { prev, next } = useMemo(() => {
    if (!category) return { prev: null, next: null };
    const idx = category.patterns.findIndex((p) => p.id === pattern.id);
    return {
      prev: idx > 0 ? category.patterns[idx - 1] : null,
      next: idx >= 0 && idx < category.patterns.length - 1 ? category.patterns[idx + 1] : null,
    };
  }, [category, pattern.id]);

  const relatedPatterns = useMemo(
    () => (category ? category.patterns.filter((p) => p.id !== pattern.id).slice(0, 6) : []),
    [category, pattern.id],
  );

  // Reading progress for the page (persisted per pattern in localStorage)
  const READ_LS = `dsaPatterns:readProgress:v1:${pattern.id}`;
  const [readProgress, setReadProgress] = useState(0);

  // Restore saved scroll position on mount / when pattern changes.
  // Skips restoration if URL has a section hash (deep link wins).
  useEffect(() => {
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (hash) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(READ_LS);
    } catch {
      /* ignore */
    }
    if (!raw) return;
    let saved: { y?: number; pct?: number } = {};
    try {
      saved = JSON.parse(raw);
    } catch {
      return;
    }
    const targetY = typeof saved.y === "number" ? saved.y : 0;
    if (targetY <= 0) return;

    let attempts = 0;
    const tryRestore = () => {
      attempts += 1;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= targetY || attempts > 30) {
        window.scrollTo({ top: Math.min(targetY, Math.max(0, max)), behavior: "auto" });
        return;
      }
      requestAnimationFrame(tryRestore);
    };
    requestAnimationFrame(tryRestore);
  }, [pattern.id, READ_LS]);

  // Track + persist progress on scroll (throttled with rAF, debounced save).
  useEffect(() => {
    let raf = 0;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const compute = () => {
      raf = 0;
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const y = h.scrollTop;
      const pct = total > 0 ? Math.min(100, Math.max(0, (y / total) * 100)) : 0;
      setReadProgress(pct);
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(READ_LS, JSON.stringify({ y, pct: Math.round(pct) }));
        } catch {
          /* ignore */
        }
      }, 200);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [pattern.id, READ_LS]);

  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const location = useLocation();
  const initialHash = (location.hash || "").replace(/^#/, "") as SectionId | "";
  const [activeSection, setActiveSection] = useState<SectionId>(
    SECTIONS.some((s) => s.id === initialHash) ? (initialHash as SectionId) : "overview",
  );

  // Scroll to the section referenced in the URL hash on mount + hash change.
  useEffect(() => {
    const raw = (location.hash || "").replace(/^#/, "");
    if (!raw || !SECTIONS.some((s) => s.id === raw)) return;
    let attempts = 0;
    const tryScroll = () => {
      attempts += 1;
      const el = document.getElementById(`section-${raw}`);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        setActiveSection(raw as SectionId);
        return;
      }
      if (attempts < 20) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  }, [location.hash, pattern.id]);

  // Track active section as the user scrolls so the jump nav highlights correctly.
  useEffect(() => {
    const els = SECTIONS
      .map((s) => document.getElementById(`section-${s.id}`))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace(/^section-/, "") as SectionId;
          setActiveSection(id);
        }
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pattern.id]);

  const goToSection = (id: SectionId) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Update the URL hash without adding a new history entry per click.
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.replaceState(window.history.state, "", url);
    }
    setActiveSection(id);
  };

  const handleCopySectionLink = async (id: SectionId) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-full">
      {/* Reading progress bar */}
      <div aria-hidden className="fixed top-0 left-0 right-0 z-30 h-0.5 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400 transition-[width] duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>
      {/* Top breadcrumb bar — sticks to viewport, scrolls with the page */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-border/40 px-4 md:px-6 py-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <Button size="sm" variant="outline" onClick={onBack} className="h-8 gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Button>
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground truncate">
            <Link to="/learn/dsa-studio?tab=patterns" className="hover:text-foreground transition-colors">
              Patterns
            </Link>
            <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-60" />
            {category && (
              <>
                <Link
                  to={`/learn/dsa-studio?tab=patterns#pat-${category.id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {category.title}
                </Link>
                <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-60" />
              </>
            )}
            <span className="text-sky-400 font-medium" aria-current="page">
              {pattern.title}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 gap-1.5 text-xs"
            aria-label="Copy link to this pattern"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
          >
            <a
              href={`/learn/dsa-studio/pattern/${pattern.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open this pattern in a new tab"
            >
              <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in new tab</span>
            </a>
          </Button>
          <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 uppercase tracking-wider text-[10px] gap-1.5">
            <span>{pattern.emoji}</span> Pattern
          </Badge>
        </div>
      </div>

      {/* Section jump nav — keeps deep links discoverable and reflects the active section */}
      <div className="sticky top-[57px] z-10 border-b border-border/40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <nav
          aria-label="Pattern sections"
          className="mx-auto w-full max-w-5xl px-4 md:px-8 py-2 flex flex-wrap items-center gap-1.5 overflow-x-auto"
        >
          {SECTIONS.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(s.id)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-xs border transition-colors whitespace-nowrap",
                  active
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                    : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-sky-500/30",
                )}
                aria-current={active ? "true" : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Body */}
      {/* Body — uses natural document scroll so all viewport sizes behave */}
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-6 space-y-6">
          {/* Hero */}
          <section id="section-overview" className="scroll-mt-32 rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card/40 to-card/40 p-5 md:p-6">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid place-items-center h-12 w-12 rounded-lg bg-sky-500/10 border border-sky-500/20 text-2xl shrink-0"
              >
                {pattern.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight flex items-center gap-2 flex-wrap">
                  {highlightTitle(pattern.title)}
                  {isDone && (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">{pattern.subtitle}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {pattern.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[11px] h-6 px-2 border-sky-500/30 bg-sky-500/5 text-sky-300"
                    >
                      {t}
                    </Badge>
                  ))}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    Time {cx.time}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300">
                    Space {cx.space}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToSection("problems")}
                    aria-label={`Practice progress: ${completedProblems} of ${totalProblems} problems done (${completionPct}%)`}
                    className="group flex items-center gap-2 pl-1.5 pr-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50 transition-colors"
                  >
                    <span className="relative grid place-items-center h-5 w-5">
                      <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20" aria-hidden>
                        <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={`${(completionPct / 100) * 50.27} 50.27`}
                          className="text-sky-400 transition-[stroke-dasharray] duration-500 ease-out"
                        />
                      </svg>
                    </span>
                    <span className="text-[11px] font-medium text-sky-200">
                      <span className="font-mono">{completedProblems}/{totalProblems}</span>
                      <span className="text-muted-foreground/70 mx-1">·</span>
                      <span className="font-mono">{completionPct}%</span>
                    </span>
                  </button>
                </div>
              </div>
              <div className="hidden md:flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={isBookmarked ? "default" : "outline"}
                  onClick={() => onToggleBookmark(pattern.id)}
                  className="gap-1.5"
                >
                  {isBookmarked ? (
                    <><BookmarkCheck className="h-4 w-4" /> Saved</>
                  ) : (
                    <><Bookmark className="h-4 w-4" /> Bookmark</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={isDone ? "default" : "outline"}
                  onClick={() => onToggleDone(pattern.id)}
                  className="gap-1.5"
                >
                  {isDone ? (
                    <><CheckCircle2 className="h-4 w-4" /> Done</>
                  ) : (
                    <><Circle className="h-4 w-4" /> Mark done</>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* When to use + Complexity */}
          <section className="grid gap-4 md:grid-cols-2">
            <div id="section-when-to-use" className="scroll-mt-32 rounded-xl border border-border/40 bg-card/40 p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  📋 When to use
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopySectionLink("when-to-use")}
                  className="text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Copy link to When to use"
                  title="Copy link to this section"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="space-y-2.5">
                {whenToUse.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-foreground/90 leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="section-complexity" className="scroll-mt-32 rounded-xl border border-border/40 bg-card/40 p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  ⚡ Complexity
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopySectionLink("complexity")}
                  className="text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Copy link to Complexity"
                  title="Copy link to this section"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Time</div>
                  <div className="font-mono text-2xl font-bold text-emerald-300 mt-1">{cx.time}</div>
                </div>
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Space</div>
                  <div className="font-mono text-2xl font-bold text-violet-300 mt-1">{cx.space}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {pattern.description}
              </p>
            </div>
          </section>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              size="sm"
              variant={isBookmarked ? "default" : "outline"}
              onClick={() => onToggleBookmark(pattern.id)}
              className="flex-1 gap-1.5"
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isBookmarked ? "Saved" : "Bookmark"}
            </Button>
            <Button
              size="sm"
              variant={isDone ? "default" : "outline"}
              onClick={() => onToggleDone(pattern.id)}
              className="flex-1 gap-1.5"
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {isDone ? "Done" : "Mark done"}
            </Button>
          </div>

          {/* Practice problems */}
          <section id="section-problems" className="scroll-mt-32 rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                🎯 Practice Problems
                <span className="ml-1 text-muted-foreground/70 normal-case tracking-normal">
                  ({completedProblems}/{totalProblems})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium">
                  <span className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    {difficultyCounts.Easy} Easy
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    {difficultyCounts.Medium} Med
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300">
                    {difficultyCounts.Hard} Hard
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySectionLink("problems")}
                  className="text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Copy link to Practice Problems"
                  title="Copy link to this section"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Progress meter */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>Your progress</span>
                <span className="font-mono text-foreground/80">{completionPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            {/* Filter chips */}
            <div
              role="tablist"
              aria-label="Filter practice problems by status"
              className="flex flex-wrap items-center gap-1.5 mb-3"
            >
              {([
                { id: "all", label: "All", count: totalProblems },
                { id: "remaining", label: "Remaining", count: totalProblems - completedProblems },
                { id: "completed", label: "Completed", count: completedProblems },
              ] as const).map((f) => {
                const active = problemFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setProblemFilter(f.id)}
                    className={cn(
                      "h-7 px-2.5 rounded-full text-[11px] border transition-colors flex items-center gap-1.5",
                      active
                        ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                        : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-sky-500/30",
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "font-mono text-[10px] px-1.5 py-0.5 rounded",
                        active ? "bg-sky-500/20 text-sky-100" : "bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredProblems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 bg-background/30 px-4 py-6 text-center text-sm text-muted-foreground">
                {problemFilter === "completed"
                  ? "No problems completed yet — check one off to see it here."
                  : problemFilter === "remaining"
                    ? "All problems completed. Nice work! 🎉"
                    : "No problems available."}
              </div>
            ) : (
            <ul className="space-y-2">
              {filteredProblems.map((pr) => {
                const key = problemKey(pr.id, pr.url);
                const checked = problemsDone.has(key);
                return (
                  <li
                    key={pr.id + pr.url}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border bg-background/40 transition-colors group",
                      checked
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border/40 hover:border-sky-500/40 hover:bg-card/60",
                    )}
                  >
                    <span className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleProblem(key)}
                        aria-label={checked ? "Mark as not done" : "Mark as done"}
                        aria-pressed={checked}
                        className={cn(
                          "h-5 w-5 rounded-md border grid place-items-center shrink-0 transition-colors",
                          checked
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "border-border/60 text-transparent hover:border-sky-500/50 hover:text-sky-400",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                        {pr.id}
                      </span>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "font-medium text-sm truncate hover:text-sky-300 transition-colors",
                          checked && "line-through text-muted-foreground",
                        )}
                      >
                        {pr.title}
                      </a>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5", diffStyles[pr.difficulty])}
                      >
                        {pr.difficulty}
                      </Badge>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${pr.title} on LeetCode`}
                        className="text-muted-foreground hover:text-sky-300 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </span>
                  </li>
                );
              })}
            </ul>
            )}
          </section>

          {/* Sibling navigation */}
          {(prev || next) && (
            <nav
              aria-label="Pattern navigation"
              className="grid gap-3 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  to={`/learn/dsa-studio/pattern/${prev.id}`}
                  className="group rounded-xl border border-border/40 bg-card/40 p-4 hover:border-sky-500/40 hover:bg-card/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span aria-hidden className="text-lg">{prev.emoji}</span>
                    <span className="font-semibold text-sm group-hover:text-sky-300 truncate">
                      {prev.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  to={`/learn/dsa-studio/pattern/${next.id}`}
                  className="group rounded-xl border border-border/40 bg-card/40 p-4 hover:border-sky-500/40 hover:bg-card/60 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Next <ChevronRight className="h-3 w-3" />
                  </div>
                  <div className="mt-1.5 flex items-center justify-end gap-2">
                    <span className="font-semibold text-sm group-hover:text-sky-300 truncate">
                      {next.title}
                    </span>
                    <span aria-hidden className="text-lg">{next.emoji}</span>
                  </div>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          {/* Related patterns */}
          {relatedPatterns.length > 0 && category && (
            <section className="rounded-xl border border-border/40 bg-card/40 p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  More in {category.title}
                </h3>
                <Link
                  to={`/learn/dsa-studio?tab=patterns#pat-${category.id}`}
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedPatterns.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/learn/dsa-studio/pattern/${rp.id}`}
                    className="group flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-background/40 hover:border-sky-500/40 hover:bg-card/60 transition-colors"
                  >
                    <span aria-hidden className="text-xl shrink-0">{rp.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm truncate group-hover:text-sky-300">
                        {rp.title}
                      </span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {rp.subtitle}
                      </span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 self-center" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
