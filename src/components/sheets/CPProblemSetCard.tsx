import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Layers,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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

// Get difficulty distribution badge
function getDifficultyGradient(problems: CPProblem[]) {
  if (problems.length === 0) return "from-muted to-muted";
  
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  problems.forEach(p => counts[p.difficulty]++);
  
  const hardPercent = counts.Hard / problems.length;
  const mediumPercent = counts.Medium / problems.length;
  
  if (hardPercent >= 0.5) {
    return "from-red-500/20 via-red-500/10 to-transparent";
  } else if (mediumPercent >= 0.5) {
    return "from-amber-500/20 via-amber-500/10 to-transparent";
  } else {
    return "from-emerald-500/20 via-emerald-500/10 to-transparent";
  }
}

// Difficulty distribution mini bar
function DifficultyDistribution({ problems }: { problems: CPProblem[] }) {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  problems.forEach(p => counts[p.difficulty]++);
  
  const total = problems.length;
  if (total === 0) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center h-1.5 w-16 rounded-full overflow-hidden bg-muted/50 cursor-help">
            {counts.Easy > 0 && (
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${(counts.Easy / total) * 100}%` }}
              />
            )}
            {counts.Medium > 0 && (
              <div 
                className="h-full bg-amber-500" 
                style={{ width: `${(counts.Medium / total) * 100}%` }}
              />
            )}
            {counts.Hard > 0 && (
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${(counts.Hard / total) * 100}%` }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex gap-3">
            {counts.Easy > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-500">{counts.Easy} Easy</span>
              </span>
            )}
            {counts.Medium > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-500">{counts.Medium} Medium</span>
              </span>
            )}
            {counts.Hard > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-500">{counts.Hard} Hard</span>
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Mini Progress Ring
function MiniProgressRing({ percent, size = 28 }: { percent: number; size?: number }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent === 100 ? "hsl(142 76% 36%)" : "hsl(var(--primary))"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
        {percent}%
      </span>
    </div>
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
          "border-b border-border/40 last:border-0",
          isExpanded && "bg-muted/5"
        )}
        whileHover={{ backgroundColor: "hsl(var(--muted) / 0.15)" }}
      >
        {/* Left gradient accent */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
            `bg-gradient-to-b ${colors.gradient}`,
            isExpanded && "w-1.5"
          )} 
        />
        
        {/* Subtle background gradient */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none opacity-30",
            `bg-gradient-to-r ${getDifficultyGradient(problemSet.problems)}`
          )} 
        />

        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 pl-5 relative z-10">
            {/* Left Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Expand Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "p-1 rounded-md shrink-0 transition-colors",
                  isExpanded ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>

              {/* Track Badge */}
              {showTrackBadge && track && (
                <Badge 
                  className={cn(
                    "text-[10px] px-2 py-0.5 shrink-0 hidden sm:inline-flex font-semibold border shadow-sm",
                    colors.bg, colors.text, colors.border
                  )}
                >
                  {track.name}
                </Badge>
              )}

              {/* Problem Count Badge */}
              <Badge 
                variant="outline"
                className="text-[10px] px-2 py-0.5 shrink-0 font-mono gap-1.5 bg-muted/30"
              >
                <Layers className="h-3 w-3 text-muted-foreground" />
                {problemSet.problems.length}
              </Badge>

              {/* Title */}
              <span className={cn(
                "font-semibold text-sm truncate",
                isComplete && "text-emerald-600 dark:text-emerald-400"
              )}>
                {problemSet.title}
              </span>

              {/* Revision indicator */}
              {revisionCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] px-1.5 py-0 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hidden md:inline-flex"
                >
                  ★ {revisionCount}
                </Badge>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Difficulty Distribution */}
              <div className="hidden lg:block">
                <DifficultyDistribution problems={problemSet.problems} />
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>
                  {completedCount}/{problemSet.problems.length}
                </span>
                <div className="hidden sm:block w-20">
                  <Progress 
                    value={progressPercent} 
                    className="h-1.5" 
                    indicatorClassName={isComplete ? "bg-emerald-500" : undefined}
                  />
                </div>
                <div className="sm:hidden">
                  <MiniProgressRing percent={progressPercent} />
                </div>
              </div>

              {/* Full Progress Ring (desktop) */}
              <div className="hidden sm:block">
                <MiniProgressRing percent={progressPercent} size={32} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
      </motion.div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "relative overflow-hidden",
                "border-l-4 ml-1",
                `border-l-${colors.text.replace('text-', '')}/40`
              )}
              style={{
                borderLeftColor: `hsl(var(--primary) / 0.3)`,
              }}
            >
              {/* Glassmorphism table container */}
              <div className={cn(
                "bg-gradient-to-br from-muted/20 via-muted/10 to-transparent",
                "backdrop-blur-sm"
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
