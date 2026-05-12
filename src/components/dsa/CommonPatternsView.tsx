import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Puzzle, ExternalLink, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  COMMON_PATTERNS,
  PATTERN_TOTAL,
  type PatternProblem,
} from "@/data/dsaCommonPatternsData";

const diffStyles: Record<PatternProblem["difficulty"], string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

export default function CommonPatternsView() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMMON_PATTERNS;
    return COMMON_PATTERNS.map((cat) => ({
      ...cat,
      patterns: cat.patterns.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.problems.some(
            (pr) =>
              pr.title.toLowerCase().includes(q) ||
              pr.id.toLowerCase().includes(q),
          ),
      ),
    })).filter((c) => c.patterns.length > 0);
  }, [search]);

  const totalShown = filtered.reduce((s, c) => s + c.patterns.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/40 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
              <Puzzle className="h-5 w-5 text-emerald-400" />
              Common Patterns
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              The {PATTERN_TOTAL} reusable templates that solve 90% of interview
              problems — grouped by core technique.
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
            {totalShown}/{PATTERN_TOTAL} patterns
          </Badge>
        </div>
      </div>

      {/* Quick jump chips */}
      <div className="flex flex-wrap gap-2">
        {COMMON_PATTERNS.map((c) => (
          <a
            key={c.id}
            href={`#pat-${c.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/40 transition-colors"
          >
            <span>{c.emoji}</span>
            <span className="font-medium">{c.title}</span>
          </a>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns, tags, or problem numbers..."
          className="pl-9 h-10 bg-card/40"
        />
      </div>

      {/* Categories */}
      {filtered.map((cat, ci) => (
        <section
          key={cat.id}
          id={`pat-${cat.id}`}
          className="space-y-3 scroll-mt-24"
        >
          <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
            <div>
              <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold">
                <span className="text-2xl leading-none">{cat.emoji}</span>
                {cat.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cat.subtitle}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {cat.patterns.length} pattern{cat.patterns.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cat.patterns.map((p, idx) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 5) * 0.03 + ci * 0.02 }}
                className="group rounded-xl border border-border/40 bg-card/40 p-4 hover:border-emerald-500/40 hover:bg-card/60 transition-all"
              >
                <header className="flex items-start gap-3 mb-2">
                  <span
                    aria-hidden
                    className="grid place-items-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xl shrink-0"
                  >
                    {p.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base leading-tight">
                      {p.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.subtitle}
                    </p>
                  </div>
                </header>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {p.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[10px] h-5 px-1.5 border-border/50 text-muted-foreground"
                    >
                      {t}
                    </Badge>
                  ))}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300">
                    {p.complexity}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                  {p.problems.map((pr) => (
                    <a
                      key={pr.id + pr.url}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors hover:opacity-90",
                        diffStyles[pr.difficulty],
                      )}
                      title={`${pr.title} — ${pr.difficulty}`}
                    >
                      <span className="font-mono opacity-70">{pr.id}</span>
                      <span className="font-medium truncate max-w-[12rem]">
                        {pr.title}
                      </span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ))}
                </div>

                {p.fullPagePath && (
                  <div className="mt-3 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/80 group-hover:text-emerald-300">
                      <span>{p.emoji}</span> Full pattern page
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-10 text-center text-muted-foreground">
          No patterns match <span className="text-foreground font-medium">"{search}"</span>.
        </div>
      )}
    </div>
  );
}
