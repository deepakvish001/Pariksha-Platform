import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Target, Bookmark, Flame, ArrowRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CODING_PROBLEMS,
  type CodingProblem,
  type Difficulty,
} from "@/data/codingProblemsData";
import type { CodingAttemptStats } from "@/hooks/useCodingAttemptStats";

const DIFF_NEXT: Record<Difficulty, Difficulty> = {
  Easy: "Medium",
  Medium: "Hard",
  Hard: "Hard",
};

const DIFF_CLASS: Record<Difficulty, string> = {
  Easy: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Hard: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

interface Recommendation {
  problem: CodingProblem;
  reason: string;
  /** lucide icon component */
  Icon: typeof Target;
  tone: "primary" | "amber" | "rose" | "emerald";
}

interface Props {
  stats: CodingAttemptStats;
  bookmarks: Set<string>;
  /** Called when a recommendation is opened (analytics hook). */
  onOpen?: (slug: string, reason: string) => void;
  dismissedKey: string;
}

const STORAGE_KEY_PREFIX = "byteskill:coding-recs-dismissed:";
const EVENT_NAME = "byteskill:coding-recs-dismissed-change";

const storageKey = (key: string) => STORAGE_KEY_PREFIX + key;

const readDismissed = (key: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey(key)) === "1";
  } catch {
    return false;
  }
};

const writeDismissed = (key: string, value: boolean) => {
  try {
    if (value) localStorage.setItem(storageKey(key), "1");
    else localStorage.removeItem(storageKey(key));
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key } }));
  } catch {
    /* ignore */
  }
};

/**
 * Hook returning the dismissed state for a recommendation strip key plus a
 * setter that persists to localStorage and notifies other listeners (so the
 * "Show recommendations" chip can react in the same tab).
 */
export const useRecommendationsDismissed = (key: string) => {
  const [dismissed, setDismissedState] = useState<boolean>(() => readDismissed(key));

  useEffect(() => {
    const sync = () => setDismissedState(readDismissed(key));
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!detail || detail.key === key) sync();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(key)) sync();
    };
    window.addEventListener(EVENT_NAME, onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const setDismissed = useCallback(
    (value: boolean) => {
      writeDismissed(key, value);
      setDismissedState(value);
    },
    [key],
  );

  return { dismissed, setDismissed };
};

interface ShowRecommendationsChipProps {
  dismissedKey: string;
  className?: string;
}

/**
 * Small chip rendered when the recommendation strip is hidden so users can
 * bring it back without using Focus mode.
 */
export const ShowRecommendationsChip = ({
  dismissedKey,
  className,
}: ShowRecommendationsChipProps) => {
  const { dismissed, setDismissed } = useRecommendationsDismissed(dismissedKey);
  if (!dismissed) return null;
  return (
    <button
      type="button"
      onClick={() => setDismissed(false)}
      className={cn(
        "mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors",
        className,
      )}
      aria-label="Show recommendations"
    >
      <Sparkles className="h-3 w-3" />
      Show recommendations
    </button>
  );
};

const toneClasses: Record<Recommendation["tone"], string> = {
  primary: "from-primary/10 to-transparent border-primary/30 text-primary",
  amber: "from-amber-500/10 to-transparent border-amber-500/30 text-amber-500",
  rose: "from-rose-500/10 to-transparent border-rose-500/30 text-rose-500",
  emerald: "from-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-500",
};

export const RecommendationStrip = ({ stats, bookmarks, onOpen, dismissedKey }: Props) => {
  const { dismissed: hidden, setDismissed: setHidden } = useRecommendationsDismissed(dismissedKey);

  const recs = useMemo<Recommendation[]>(() => {
    const out: Recommendation[] = [];
    const used = new Set<string>();

    const pushUnique = (rec: Recommendation | null) => {
      if (!rec) return;
      if (used.has(rec.problem.slug)) return;
      used.add(rec.problem.slug);
      out.push(rec);
    };

    // 1) "Almost there" — attempted ≥2 times but not solved.
    let almost: { problem: CodingProblem; tries: number } | null = null;
    for (const p of CODING_PROBLEMS) {
      if (stats.solved.has(p.slug)) continue;
      const s = stats.perProblem.get(p.slug);
      if (!s || s.attempts < 2) continue;
      if (!almost || s.attempts > almost.tries) {
        almost = { problem: p, tries: s.attempts };
      }
    }
    if (almost) {
      pushUnique({
        problem: almost.problem,
        reason: `You've attempted this ${almost.tries} times — finish strong.`,
        Icon: Flame,
        tone: "rose",
      });
    }

    // 2) Weakest topic — pick a problem from the topic with the lowest solve ratio.
    const topicTotals = new Map<string, { solved: number; total: number }>();
    for (const p of CODING_PROBLEMS) {
      for (const t of p.topics) {
        const cur = topicTotals.get(t) ?? { solved: 0, total: 0 };
        cur.total += 1;
        if (stats.solved.has(p.slug)) cur.solved += 1;
        topicTotals.set(t, cur);
      }
    }
    let weakestTopic: { topic: string; ratio: number } | null = null;
    topicTotals.forEach((v, topic) => {
      if (v.total < 2) return;
      const ratio = v.solved / v.total;
      if (ratio >= 1) return; // already mastered
      if (!weakestTopic || ratio < weakestTopic.ratio) {
        weakestTopic = { topic, ratio };
      }
    });
    if (weakestTopic) {
      const w = weakestTopic;
      const candidate = CODING_PROBLEMS.find(
        (p) => p.topics.includes(w.topic) && !stats.solved.has(p.slug),
      );
      if (candidate) {
        pushUnique({
          problem: candidate,
          reason: `Build mastery in ${w.topic} (${Math.round(w.ratio * 100)}% solved).`,
          Icon: Target,
          tone: "amber",
        });
      }
    }

    // 3) Oldest unsolved bookmark.
    const bmCandidates = CODING_PROBLEMS.filter(
      (p) => bookmarks.has(p.slug) && !stats.solved.has(p.slug),
    );
    if (bmCandidates.length > 0) {
      // Stable: just pick the first in source order (acts like "oldest").
      pushUnique({
        problem: bmCandidates[0],
        reason: "From your bookmarks — pick up where you left off.",
        Icon: Bookmark,
        tone: "primary",
      });
    }

    // 4) Stretch problem — next-difficulty in your strongest topic.
    let strongest: { topic: string; ratio: number } | null = null;
    topicTotals.forEach((v, topic) => {
      if (v.solved === 0) return;
      const ratio = v.solved / v.total;
      if (!strongest || ratio > strongest.ratio) {
        strongest = { topic, ratio };
      }
    });
    if (strongest) {
      const s = strongest;
      // Find a harder problem in that topic that the user hasn't solved.
      const stretch = CODING_PROBLEMS.find((p) => {
        if (stats.solved.has(p.slug)) return false;
        if (!p.topics.includes(s.topic)) return false;
        return p.difficulty === "Hard" || p.difficulty === "Medium";
      });
      if (stretch) {
        pushUnique({
          problem: stretch,
          reason: `Stretch goal in ${s.topic} — try a ${stretch.difficulty}.`,
          Icon: Sparkles,
          tone: "emerald",
        });
      }
    }

    // 5) Filler: pick a fresh easy if we don't have enough recs yet.
    if (out.length < 3) {
      for (const p of CODING_PROBLEMS) {
        if (out.length >= 3) break;
        if (used.has(p.slug)) continue;
        if (stats.solved.has(p.slug)) continue;
        if (stats.attempted.has(p.slug)) continue;
        if (p.difficulty !== "Easy") continue;
        pushUnique({
          problem: p,
          reason: "Fresh pick — warm up with a quick win.",
          Icon: Sparkles,
          tone: "emerald",
        });
      }
    }

    return out.slice(0, 4);
  }, [stats.solved, stats.attempted, stats.perProblem, bookmarks]);

  if (hidden || recs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended for you
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          aria-label="Hide recommendations"
        >
          <X className="h-3 w-3" />
          Hide
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {recs.map(({ problem, reason, Icon, tone }) => {
          const next = DIFF_NEXT[problem.difficulty];
          return (
            <Card
              key={problem.slug}
              className={cn(
                "p-3 bg-gradient-to-br border relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5",
                toneClasses[tone],
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium", DIFF_CLASS[problem.difficulty])}
                >
                  {problem.difficulty}
                </Badge>
              </div>
              <Link
                to={`/library/problems/${problem.slug}`}
                onClick={() => onOpen?.(problem.slug, reason)}
                className="font-medium text-sm text-foreground hover:underline line-clamp-1"
              >
                {problem.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {reason}
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 -ml-2 text-xs gap-1 text-foreground/80 hover:text-foreground"
              >
                <Link
                  to={`/library/problems/${problem.slug}`}
                  onClick={() => onOpen?.(problem.slug, reason)}
                >
                  Solve <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
              {/* hint at next difficulty band */}
              {next !== problem.difficulty && (
                <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  next: {next}
                </span>
              )}
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};
