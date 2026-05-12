import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bookmark, BookmarkCheck, CheckCircle2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COMMON_PATTERNS, type PatternProblem } from "@/data/dsaCommonPatternsData";
import { useDsaPatternStorage } from "@/hooks/useDsaPatternStorage";

const diffStyles: Record<PatternProblem["difficulty"], string> = {
  Easy: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

function splitCx(cx: string) {
  const [t, s] = cx.split("/").map((x) => x.trim());
  return { time: t, space: s ?? "—" };
}

/**
 * Dense, compact 2-column grid of every Common Pattern, grouped by category.
 * Designed for at-a-glance scanning — clicking a card opens the full pattern page.
 */
export default function CodeTricksView() {
  const { bookmarks, done, toggleBookmark, toggleDone } = useDsaPatternStorage();
  const [q, setQ] = useState("");

  const norm = (s: string) => s.toLowerCase();
  const matches = (s: string) => norm(s).includes(norm(q.trim()));

  const filtered = useMemo(() => {
    if (!q.trim()) return COMMON_PATTERNS;
    return COMMON_PATTERNS.map((cat) => ({
      ...cat,
      patterns: cat.patterns.filter(
        (p) =>
          matches(p.title) ||
          matches(p.subtitle) ||
          matches(p.description) ||
          p.tags.some(matches) ||
          p.problems.some((pr) => matches(pr.title) || matches(pr.id)),
      ),
    })).filter((cat) => cat.patterns.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalPatterns = COMMON_PATTERNS.reduce((acc, c) => acc + c.patterns.length, 0);
  const visiblePatterns = filtered.reduce((acc, c) => acc + c.patterns.length, 0);

  return (
    <div className="space-y-6">
      {/* Search + summary */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patterns, tags, problems…"
            className="pl-9 h-10 bg-card/40"
            aria-label="Search patterns"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-mono text-foreground/80">{visiblePatterns}</span> of{" "}
          <span className="font-mono text-foreground/80">{totalPatterns}</span> patterns
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/30 px-4 py-10 text-center text-sm text-muted-foreground">
          No patterns match “{q}”.
        </div>
      )}

      {filtered.map((cat) => (
        <section key={cat.id} id={`trick-${cat.id}`} className="space-y-3 scroll-mt-32">
          {/* Category header */}
          <header className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <span aria-hidden className="text-base">{cat.emoji}</span>
              <span className="text-sky-300">{cat.title}</span>
              <span className="text-muted-foreground/70 font-normal text-xs">
                · {cat.subtitle}
              </span>
            </h2>
            <span className="text-[11px] text-muted-foreground font-mono">
              {cat.patterns.length} pattern{cat.patterns.length === 1 ? "" : "s"}
            </span>
          </header>

          {/* Compact pattern grid */}
          <div className="grid gap-2.5 md:grid-cols-2">
            {cat.patterns.map((p) => {
              const cx = splitCx(p.complexity);
              const isBookmarked = bookmarks.has(p.id);
              const isDone = done.has(p.id);
              return (
                <article
                  key={p.id}
                  className={cn(
                    "group relative rounded-lg border bg-card/40 px-3 py-2.5 transition-colors",
                    "border-border/40 hover:border-sky-500/40 hover:bg-card/60",
                    isDone && "border-emerald-500/30 bg-emerald-500/[0.04]",
                  )}
                >
                  {/* Whole-card link overlay */}
                  <Link
                    to={`/learn/dsa-studio/pattern/${p.id}`}
                    state={{ from: "patterns" }}
                    aria-label={`Open ${p.title}`}
                    className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                  />

                  {/* Header row */}
                  <div className="flex items-start gap-2 relative">
                    <span
                      aria-hidden
                      className="grid place-items-center h-7 w-7 rounded-md bg-sky-500/10 border border-sky-500/20 text-base shrink-0"
                    >
                      {p.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold leading-tight truncate group-hover:text-sky-200">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-snug truncate">
                        {p.subtitle}
                      </p>
                    </div>
                    {/* Quick actions — relative so they sit above the link overlay */}
                    <div className="relative flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleBookmark(p.id);
                        }}
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark pattern"}
                        title={isBookmarked ? "Bookmarked" : "Bookmark"}
                        className={cn(
                          "h-6 w-6 grid place-items-center rounded transition-colors",
                          isBookmarked
                            ? "text-amber-300 hover:text-amber-200"
                            : "text-muted-foreground/60 hover:text-foreground",
                        )}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDone(p.id);
                        }}
                        aria-label={isDone ? "Mark not done" : "Mark done"}
                        aria-pressed={isDone}
                        title={isDone ? "Done" : "Mark done"}
                        className={cn(
                          "h-6 w-6 grid place-items-center rounded transition-colors",
                          isDone
                            ? "text-emerald-300 hover:text-emerald-200"
                            : "text-muted-foreground/60 hover:text-foreground",
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tags + complexity row */}
                  <div className="relative mt-2 flex flex-wrap items-center gap-1">
                    {p.tags.slice(0, 4).map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 border-sky-500/30 bg-sky-500/5 text-sky-300"
                      >
                        {t}
                      </Badge>
                    ))}
                    <span className="ml-auto flex items-center gap-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        T {cx.time}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300">
                        S {cx.space}
                      </span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="relative mt-2 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>

                  {/* Problems */}
                  {p.problems.length > 0 && (
                    <ul className="relative mt-2 space-y-0.5">
                      {p.problems.slice(0, 4).map((pr) => (
                        <li key={pr.id + pr.url}>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-sky-300 transition-colors"
                          >
                            <span className="font-mono w-10 shrink-0 text-muted-foreground/70">
                              {pr.id}
                            </span>
                            <span className="truncate flex-1">{pr.title}</span>
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] h-4 px-1.5", diffStyles[pr.difficulty])}
                            >
                              {pr.difficulty[0]}
                            </Badge>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </li>
                      ))}
                      {p.problems.length > 4 && (
                        <li className="text-[10px] text-muted-foreground/70 pl-12">
                          +{p.problems.length - 4} more
                        </li>
                      )}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
