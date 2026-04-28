import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Star,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CodingProblem, Difficulty } from "@/data/codingProblemsData";
import type { PerProblemStats } from "@/hooks/useCodingAttemptStats";

const difficultyClass = (d: Difficulty) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const difficultyStripe = (d: Difficulty) =>
  d === "Easy"
    ? "bg-emerald-500"
    : d === "Medium"
      ? "bg-amber-500"
      : "bg-rose-500";

interface ProblemCardProps {
  problem: CodingProblem;
  isSolved: boolean;
  isAttempted: boolean;
  isBookmarked: boolean;
  stats?: PerProblemStats;
  onToggleBookmark: (slug: string) => void;
  index: number;
}

export const ProblemCard = ({
  problem,
  isSolved,
  isAttempted,
  isBookmarked,
  stats,
  onToggleBookmark,
  index,
}: ProblemCardProps) => {
  const StatusIcon = isSolved ? CheckCircle2 : isAttempted ? CircleDot : Circle;
  const statusColor = isSolved
    ? "text-emerald-500"
    : isAttempted
      ? "text-amber-500"
      : "text-muted-foreground/40";
  const statusLabel = isSolved
    ? `Solved${stats?.solvedAt ? ` on ${new Date(stats.solvedAt).toLocaleDateString()}` : ""}`
    : isAttempted
      ? `Attempted ${stats?.attempts ?? 0}×`
      : "Not started";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all h-full flex flex-col">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", difficultyStripe(problem.difficulty))} />
        <div className="p-4 flex-1 flex flex-col gap-3 pl-5">
          <div className="flex items-start justify-between gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <StatusIcon className={cn("h-4 w-4 shrink-0 mt-1", statusColor)} aria-label={statusLabel} />
                </TooltipTrigger>
                <TooltipContent side="top">{statusLabel}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link
              to={`/library/problems/${problem.slug}`}
              className="font-semibold text-sm sm:text-base flex-1 line-clamp-2 hover:text-primary transition-colors"
            >
              {problem.title}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleBookmark(problem.slug);
              }}
              className="shrink-0 p-1 rounded hover:bg-muted/50 transition-colors"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isBookmarked
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/50 hover:text-amber-400",
                )}
              />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {problem.topics.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                {t}
              </Badge>
            ))}
            {problem.topics.length > 3 && (
              <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                +{problem.topics.length - 3}
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("font-medium text-[11px]", difficultyClass(problem.difficulty))}>
                {problem.difficulty}
              </Badge>
              {stats && stats.attempts > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {stats.attempts}
                </span>
              )}
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Link to={`/library/problems/${problem.slug}`}>
                Solve <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
