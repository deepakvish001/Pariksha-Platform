import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  topics: string[];
  /** total problems by topic (denominator) */
  totalsByTopic: Map<string, number>;
  /** solved problems by topic */
  solvedByTopic: Map<string, number>;
  /** attempted (not yet solved) by topic */
  attemptedByTopic: Map<string, number>;
  streak: number;
  className?: string;
}

const STORAGE_KEY = "parikshaa:coding:topicRing:selectedTopic";

const RING_SIZE = 96;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export const TopicProgressRing = ({
  topics,
  totalsByTopic,
  solvedByTopic,
  attemptedByTopic,
  streak,
  className,
}: Props) => {
  const [topic, setTopic] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "All";
    } catch {
      return "All";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, topic);
    } catch {
      /* noop */
    }
  }, [topic]);

  const total =
    topic === "All"
      ? Array.from(totalsByTopic.values()).reduce((a, b) => a + b, 0) /
          Math.max(1, totalsByTopic.size) || 0
      : totalsByTopic.get(topic) ?? 0;
  // For "All" we want true totals across the catalog, not an average.
  const realTotal =
    topic === "All"
      ? Array.from(totalsByTopic.entries()).reduce((acc, [, v]) => acc + v, 0) /
          Math.max(1, totalsByTopic.size) // average per topic for cleaner "All" denom
      : total;

  const solved =
    topic === "All"
      ? Array.from(solvedByTopic.values()).reduce((a, b) => a + b, 0) /
          Math.max(1, solvedByTopic.size) || 0
      : solvedByTopic.get(topic) ?? 0;

  const attempted =
    topic === "All"
      ? Array.from(attemptedByTopic.values()).reduce((a, b) => a + b, 0) /
          Math.max(1, attemptedByTopic.size) || 0
      : attemptedByTopic.get(topic) ?? 0;

  const denom = Math.max(1, Math.round(realTotal));
  const solvedPct = Math.min(100, Math.round((solved / denom) * 100));
  const attemptedPct = Math.min(100 - solvedPct, Math.round((attempted / denom) * 100));

  const solvedDash = (solvedPct / 100) * CIRC;
  const attemptedDash = (attemptedPct / 100) * CIRC;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Topic progress
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Tracks solved & attempted in selected topic.
          </p>
        </div>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="All">All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={STROKE}
            />
            {/* Attempted layer (drawn first/under) */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(38 92% 50%)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${attemptedDash + solvedDash} ${CIRC}`}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Solved layer */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${solvedDash} ${CIRC}`}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold leading-none tabular-nums">{solvedPct}%</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              solved
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Solved</span>
            <span className="ml-auto font-semibold tabular-nums">
              {Math.round(solved)} / {denom}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Attempted</span>
            <span className="ml-auto font-semibold tabular-nums">{Math.round(attempted)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/60">
            <Flame className={cn("h-3.5 w-3.5", streak > 0 ? "text-amber-500" : "text-muted-foreground")} />
            <span className="text-muted-foreground">Daily streak</span>
            <span className="ml-auto font-semibold tabular-nums">{streak}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
