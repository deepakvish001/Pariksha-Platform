import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommonPattern, PatternCategory, PatternProblem } from "@/data/dsaCommonPatternsData";

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

  return (
    <div className="flex h-full flex-col">
      {/* Top breadcrumb bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/40 px-4 md:px-6 py-3 bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <Button size="sm" variant="outline" onClick={onBack} className="h-8 gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Button>
          <div className="text-sm text-muted-foreground truncate">
            {category && (
              <>
                <span>{category.title}</span>
                <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-60" />
              </>
            )}
            <span className="text-sky-400 font-medium">{pattern.title}</span>
          </div>
        </div>
        <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 uppercase tracking-wider text-[10px] gap-1.5">
          <span>{pattern.emoji}</span> Pattern
        </Badge>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-6 space-y-6">
          {/* Hero */}
          <section className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card/40 to-card/40 p-5 md:p-6">
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
            <div className="rounded-xl border border-border/40 bg-card/40 p-5">
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                📋 When to use
              </h3>
              <ul className="space-y-2.5">
                {whenToUse.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-foreground/90 leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/40 p-5">
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                ⚡ Complexity
              </h3>
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
          <section className="rounded-xl border border-border/40 bg-card/40 p-5">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              🎯 Practice Problems
              <span className="ml-1 text-muted-foreground/70 normal-case tracking-normal">
                ({pattern.problems.length})
              </span>
            </h3>
            <ul className="space-y-2">
              {pattern.problems.map((pr) => (
                <li key={pr.id + pr.url}>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-background/40 hover:border-sky-500/40 hover:bg-card/60 transition-colors group"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                        {pr.id}
                      </span>
                      <span className="font-medium text-sm truncate group-hover:text-sky-300">
                        {pr.title}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5", diffStyles[pr.difficulty])}
                      >
                        {pr.difficulty}
                      </Badge>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
