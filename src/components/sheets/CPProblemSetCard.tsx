import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Layers,
  Star,
  Trophy,
  Circle,
  Diamond,
  Hexagon,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import { cpTracks, type CPProblemSet, type CPProblem } from "@/data/competitiveProgrammingData";
import { getTrackColors } from "@/data/cpIconMappings";
import CPProblemTable from "./CPProblemTable";

interface CPProblemSetCardProps {
  problemSet: CPProblemSet;
  isExpanded: boolean;
  onToggle: () => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
  showTrackBadge?: boolean;
}

// Difficulty icon helper
function DifficultyIcon({ difficulty, size = "sm" }: { difficulty: "Easy" | "Medium" | "Hard"; size?: "xs" | "sm" }) {
  const sizeClass = size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5";
  const config = {
    Easy: { Icon: Circle, color: "text-emerald-500 fill-emerald-500" },
    Medium: { Icon: Diamond, color: "text-amber-500 fill-amber-500/60" },
    Hard: { Icon: Hexagon, color: "text-red-500 fill-red-500/60" },
  };
  const { Icon, color } = config[difficulty];
  return <Icon className={cn(sizeClass, color)} />;
}

// Difficulty Distribution Bar
function DifficultyDistribution({ problems }: { problems: CPProblem[] }) {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  problems.forEach(p => counts[p.difficulty]++);
  const total = problems.length;
  if (total === 0) return null;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-1.5 w-16 rounded-full overflow-hidden bg-muted/30 ring-1 ring-border/20">
              {counts.Easy > 0 && (
                <motion.div 
                  className="h-full bg-emerald-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Easy / total) * 100}%` }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                />
              )}
              {counts.Medium > 0 && (
                <motion.div 
                  className="h-full bg-amber-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Medium / total) * 100}%` }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                />
              )}
              {counts.Hard > 0 && (
                <motion.div 
                  className="h-full bg-red-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Hard / total) * 100}%` }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              )}
            </div>
            <div className="hidden xl:flex items-center gap-0.5">
              {counts.Easy > 0 && <DifficultyIcon difficulty="Easy" size="xs" />}
              {counts.Medium > 0 && <DifficultyIcon difficulty="Medium" size="xs" />}
              {counts.Hard > 0 && <DifficultyIcon difficulty="Hard" size="xs" />}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="px-3 py-2">
          <div className="flex gap-3 text-xs">
            {counts.Easy > 0 && (
              <span className="flex items-center gap-1">
                <DifficultyIcon difficulty="Easy" />
                <span className="text-emerald-500 font-semibold">{counts.Easy}</span>
                <span className="text-muted-foreground">Easy</span>
              </span>
            )}
            {counts.Medium > 0 && (
              <span className="flex items-center gap-1">
                <DifficultyIcon difficulty="Medium" />
                <span className="text-amber-500 font-semibold">{counts.Medium}</span>
                <span className="text-muted-foreground">Medium</span>
              </span>
            )}
            {counts.Hard > 0 && (
              <span className="flex items-center gap-1">
                <DifficultyIcon difficulty="Hard" />
                <span className="text-red-500 font-semibold">{counts.Hard}</span>
                <span className="text-muted-foreground">Hard</span>
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Progress Ring with gradient
function MiniProgressRing({ percent, size = 32 }: { percent: number; size?: number }) {
  const strokeWidth = size > 30 ? 3.5 : 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const isComplete = percent === 100;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help" style={{ width: size, height: size }}>
            <svg className="rotate-[-90deg]" width={size} height={size}>
              <defs>
                <linearGradient id={`ring-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isComplete ? "hsl(142 76% 36%)" : "hsl(var(--primary))"} />
                  <stop offset="100%" stopColor={isComplete ? "hsl(142 76% 46%)" : "hsl(38 100% 50%)"} />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted) / 0.4)"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#ring-grad-${size})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </svg>
            <span className={cn(
              "absolute inset-0 flex items-center justify-center font-bold tabular-nums",
              size <= 28 ? "text-[7px]" : "text-[9px]",
              isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            )}>
              {percent}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isComplete ? "All solved!" : `${percent}% complete`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function CPProblemSetCard({
  problemSet,
  isExpanded,
  onToggle,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
  showTrackBadge = true,
}: CPProblemSetCardProps) {
  const track = cpTracks.find(t => t.id === problemSet.trackId);
  const colors = getTrackColors(problemSet.trackId);
  const completedCount = problemSet.problems.filter(p => isSolved(p.id)).length;
  const progressPercent = problemSet.problems.length > 0 
    ? Math.round((completedCount / problemSet.problems.length) * 100) 
    : 0;
  const isComplete = progressPercent === 100;
  const revisionCount = problemSet.problems.filter(p => isRevision(p.id)).length;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <motion.div
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          "border-b border-border/25 last:border-0",
          isExpanded && "bg-muted/8"
        )}
        layout
      >
        {/* Left accent bar */}
        <motion.div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[3px]",
            `bg-gradient-to-b ${colors.gradient}`
          )}
          animate={{ width: isExpanded ? 4 : 3 }}
        />

        <CollapsibleTrigger className="w-full">
          <motion.div 
            className="flex items-center gap-4 px-4 py-3.5 pl-5"
            whileHover={{ backgroundColor: "hsl(var(--muted) / 0.1)" }}
          >
            {/* Expand icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "p-1 rounded-md shrink-0 transition-colors",
                isExpanded ? "bg-primary/12 text-primary" : "text-muted-foreground"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>

            {/* Track badge */}
            {showTrackBadge && track && (
              <Badge 
                className={cn(
                  "text-[10px] px-2 py-0.5 shrink-0 hidden sm:inline-flex font-semibold border",
                  colors.bg, colors.text, colors.border
                )}
              >
                {track.name}
              </Badge>
            )}

            {/* Problem count */}
            <Badge 
              variant="outline"
              className="text-[10px] px-2 py-0.5 shrink-0 font-mono gap-1 bg-muted/30 border-border/40"
            >
              <Layers className="h-3 w-3 text-muted-foreground" />
              {problemSet.problems.length}
            </Badge>

            {/* Title */}
            <h3 className={cn(
              "font-semibold text-sm truncate flex-1 text-left",
              isComplete && "text-emerald-600 dark:text-emerald-400"
            )}>
              {problemSet.title}
            </h3>

            {/* Status badges */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {isComplete && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                >
                  <Trophy className="h-3 w-3" />
                  Done
                </motion.span>
              )}
              {revisionCount > 0 && !isComplete && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {revisionCount}
                </span>
              )}
            </div>

            {/* Difficulty distribution */}
            <div className="hidden lg:block shrink-0">
              <DifficultyDistribution problems={problemSet.problems} />
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 shrink-0">
              <span className={cn(
                "text-xs font-semibold tabular-nums",
                isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}>
                {completedCount}<span className="text-muted-foreground/50">/{problemSet.problems.length}</span>
              </span>
              
              <div className="hidden sm:block w-20">
                <Progress 
                  value={progressPercent} 
                  className="h-1.5 bg-muted/30" 
                  indicatorClassName={cn(
                    isComplete 
                      ? "bg-emerald-500" 
                      : "bg-gradient-to-r from-primary to-amber-500"
                  )}
                />
              </div>
              
              <MiniProgressRing percent={progressPercent} size={34} />
            </div>
          </motion.div>
        </CollapsibleTrigger>
      </motion.div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative overflow-hidden"
            >
              {/* Connecting accent line */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-[3px] ml-px opacity-30",
                `bg-gradient-to-b ${colors.gradient}`
              )} />
              
              {/* Table container */}
              <div className={cn(
                "ml-2 rounded-md overflow-hidden",
                "bg-gradient-to-br from-muted/20 via-muted/10 to-transparent",
                "border-l border-primary/15"
              )}>
                <CPProblemTable
                  problems={problemSet.problems}
                  isSolved={isSolved}
                  isRevision={isRevision}
                  toggleSolved={toggleSolved}
                  toggleRevision={toggleRevision}
                  onOpenNote={onOpenNote}
                />
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

export { DifficultyDistribution, MiniProgressRing };
