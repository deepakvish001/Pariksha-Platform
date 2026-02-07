import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Layers,
  Star,
  Trophy,
  Flame,
  Target,
  Circle,
  Diamond,
  Hexagon,
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

// Enhanced difficulty distribution with visual legend
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
            {/* Visual bar */}
            <div className="flex items-center h-2 w-20 rounded-full overflow-hidden bg-muted/40 ring-1 ring-border/30">
              {counts.Easy > 0 && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Easy / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              )}
              {counts.Medium > 0 && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Medium / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}
              {counts.Hard > 0 && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts.Hard / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              )}
            </div>
            {/* Icon indicators */}
            <div className="hidden xl:flex items-center gap-1">
              {counts.Easy > 0 && <Circle className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500" />}
              {counts.Medium > 0 && <Diamond className="h-2.5 w-2.5 text-amber-500 fill-amber-500/60" />}
              {counts.Hard > 0 && <Hexagon className="h-2.5 w-2.5 text-red-500 fill-red-500/60" />}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="px-3 py-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mb-1">Difficulty Breakdown</span>
            <div className="flex gap-4">
              {counts.Easy > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Circle className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{counts.Easy}</span>
                  <span className="text-muted-foreground">Easy</span>
                </span>
              )}
              {counts.Medium > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Diamond className="h-3 w-3 text-amber-500 fill-amber-500/60" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{counts.Medium}</span>
                  <span className="text-muted-foreground">Medium</span>
                </span>
              )}
              {counts.Hard > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Hexagon className="h-3 w-3 text-red-500 fill-red-500/60" />
                  <span className="text-red-600 dark:text-red-400 font-semibold">{counts.Hard}</span>
                  <span className="text-muted-foreground">Hard</span>
                </span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Enhanced Mini Progress Ring with gradient
function MiniProgressRing({ percent, size = 32 }: { percent: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const isComplete = percent === 100;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help" style={{ width: size, height: size }}>
            <svg className="rotate-[-90deg]" style={{ width: size, height: size }}>
              <defs>
                <linearGradient id={`progressGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isComplete ? "hsl(142 76% 36%)" : "hsl(var(--primary))"} />
                  <stop offset="100%" stopColor={isComplete ? "hsl(142 76% 46%)" : "hsl(38, 100%, 50%)"} />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted) / 0.5)"
                strokeWidth="3"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#progressGrad-${size})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <span className={cn(
              "absolute inset-0 flex items-center justify-center font-bold transition-colors",
              size <= 28 ? "text-[7px]" : "text-[9px]",
              isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            )}>
              {percent}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="font-medium">
          {isComplete ? "All problems solved!" : `${percent}% complete`}
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
          "relative overflow-hidden transition-all duration-300",
          "border-b border-border/30 last:border-0",
          isExpanded && "bg-muted/10"
        )}
        layout
      >
        {/* Animated left gradient accent */}
        <motion.div 
          className={cn(
            "absolute left-0 top-0 bottom-0 transition-all duration-300",
            `bg-gradient-to-b ${colors.gradient}`
          )}
          initial={{ width: 3 }}
          animate={{ width: isExpanded ? 4 : 3 }}
        />
        
        {/* Subtle shimmer effect on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none opacity-0"
          whileHover={{ opacity: 1, x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        <CollapsibleTrigger className="w-full">
          <motion.div 
            className="flex items-center justify-between p-4 pl-6 relative z-10"
            whileHover={{ backgroundColor: "hsl(var(--muted) / 0.12)" }}
            transition={{ duration: 0.2 }}
          >
            {/* Left Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Animated Expand Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "p-1.5 rounded-lg shrink-0 transition-all duration-300",
                  isExpanded 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>

              {/* Track Badge */}
              {showTrackBadge && track && (
                <Badge 
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 shrink-0 hidden sm:inline-flex font-semibold border shadow-sm backdrop-blur-sm",
                    colors.bg, colors.text, colors.border
                  )}
                >
                  {track.name}
                </Badge>
              )}

              {/* Problem Count Badge */}
              <Badge 
                variant="outline"
                className="text-[10px] px-2.5 py-0.5 shrink-0 font-mono gap-1.5 bg-muted/40 border-border/50"
              >
                <Layers className="h-3 w-3 text-muted-foreground" />
                {problemSet.problems.length}
              </Badge>

              {/* Title */}
              <h3 className={cn(
                "font-semibold text-sm truncate transition-colors duration-300",
                isComplete && "text-emerald-600 dark:text-emerald-400"
              )}>
                {problemSet.title}
              </h3>

              {/* Status indicators */}
              <div className="hidden md:flex items-center gap-2">
                {/* Completion indicator */}
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  >
                    <Trophy className="h-3 w-3" />
                    <span className="text-[10px] font-semibold">Done</span>
                  </motion.div>
                )}
                
                {/* Revision indicator */}
                {revisionCount > 0 && !isComplete && (
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-2 py-0 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                  >
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {revisionCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Section - Stats */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Difficulty Distribution - Large screens */}
              <div className="hidden lg:block">
                <DifficultyDistribution problems={problemSet.problems} />
              </div>

              {/* Progress Section */}
              <div className="flex items-center gap-3">
                {/* Progress Text */}
                <span className={cn(
                  "text-xs font-semibold whitespace-nowrap tabular-nums",
                  isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>
                  {completedCount}<span className="text-muted-foreground/60">/{problemSet.problems.length}</span>
                </span>
                
                {/* Progress Bar - Desktop */}
                <div className="hidden sm:block w-24">
                  <div className="relative">
                    <Progress 
                      value={progressPercent} 
                      className="h-2 bg-muted/40" 
                      indicatorClassName={cn(
                        "transition-all duration-500",
                        isComplete 
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                          : "bg-gradient-to-r from-primary to-amber-500"
                      )}
                    />
                    {/* Animated glow for complete */}
                    {isComplete && (
                      <motion.div 
                        className="absolute inset-0 bg-emerald-500/20 rounded-full blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Progress Ring */}
                <MiniProgressRing percent={progressPercent} size={36} />
              </div>
            </div>
          </motion.div>
        </CollapsibleTrigger>
      </motion.div>

      {/* Expanded Content with enhanced styling */}
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative overflow-hidden"
            >
              {/* Connecting line from card to table */}
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 ml-[1px]",
                  `bg-gradient-to-b ${colors.gradient}`,
                  "opacity-40"
                )}
              />
              
              {/* Table container with glassmorphism */}
              <div className={cn(
                "ml-2 rounded-lg overflow-hidden",
                "bg-gradient-to-br from-muted/30 via-muted/15 to-transparent",
                "border-l-2 border-primary/20",
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
