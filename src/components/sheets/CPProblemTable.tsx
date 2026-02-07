import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  Circle,
  Star,
  FileText,
  Diamond,
  Hexagon,
  Zap,
  Trophy,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CPProblem } from "@/data/competitiveProgrammingData";
import { getPlatformColor } from "@/data/cpIconMappings";

interface CPProblemTableProps {
  problems: CPProblem[];
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
}

// Difficulty icon with consistent sizing
function DifficultyIcon({ difficulty, size = "sm" }: { difficulty: "Easy" | "Medium" | "Hard"; size?: "xs" | "sm" }) {
  const sizeClasses = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  const config = {
    Easy: { Icon: Circle, color: "text-emerald-500", fill: "fill-emerald-500" },
    Medium: { Icon: Diamond, color: "text-amber-500", fill: "fill-amber-500/60" },
    Hard: { Icon: Hexagon, color: "text-red-500", fill: "fill-red-500/60" },
  };
  const { Icon, color, fill } = config[difficulty];
  return <Icon className={cn(sizeClasses, color, fill)} />;
}

// Enhanced Difficulty Badge
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    Medium: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
    Hard: "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/25",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
      styles[difficulty]
    )}>
      <DifficultyIcon difficulty={difficulty} size="xs" />
      {difficulty}
    </span>
  );
}

// Platform Badge
function PlatformBadge({ platform }: { platform: string }) {
  const colorClasses = getPlatformColor(platform);
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border",
      colorClasses
    )}>
      {platform}
    </span>
  );
}

// Table Header Cell Component for consistency
function TableHeaderCell({ 
  children, 
  className,
  align = "left" 
}: { 
  children: React.ReactNode; 
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <div className={cn(
      "text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 py-3 px-3",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}>
      {children}
    </div>
  );
}

// Individual Problem Row
function CPProblemRow({
  problem,
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  onOpenNote,
}: {
  problem: CPProblem;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onOpenNote: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015, duration: 0.25 }}
      className={cn(
        "group grid grid-cols-[56px_48px_1fr_100px_80px_48px_48px] items-center",
        "border-b border-border/15 last:border-0",
        "transition-all duration-200",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/6 via-emerald-500/3 to-transparent" 
          : "hover:bg-muted/30"
      )}
    >
      {/* Status Checkbox - 56px */}
      <div className="flex items-center justify-center py-3 px-2">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleSolved}
                className={cn(
                  "relative p-1.5 rounded-lg transition-all duration-200",
                  isSolved 
                    ? "bg-emerald-500/15" 
                    : "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <AnimatePresence mode="wait">
                  {isSolved ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {isSolved ? "Mark incomplete" : "Mark complete"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Problem Number - 48px */}
      <div className="flex items-center justify-center py-3">
        <span className={cn(
          "inline-flex items-center justify-center min-w-[28px] h-7 text-[11px] font-bold rounded-md tabular-nums",
          isSolved 
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Problem Title & Platform - Flex grow */}
      <div className="py-3 px-2 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "text-[13px] font-medium truncate transition-all",
            isSolved && "line-through text-muted-foreground decoration-emerald-500/40 decoration-1"
          )}>
            {problem.title}
          </span>
          {problem.platform && (
            <span className="hidden md:inline shrink-0">
              <PlatformBadge platform={problem.platform} />
            </span>
          )}
        </div>
        {/* Mobile: show platform below title */}
        {problem.platform && (
          <div className="md:hidden mt-1">
            <PlatformBadge platform={problem.platform} />
          </div>
        )}
      </div>

      {/* Difficulty - 100px */}
      <div className="flex items-center justify-center py-3 px-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* Practice Link - 80px */}
      <div className="flex items-center justify-center py-3 px-2">
        {problem.problemUrl ? (
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md",
                    "bg-primary/10 text-primary text-[11px] font-semibold",
                    "border border-primary/20 hover:border-primary/35",
                    "hover:bg-primary/15 transition-all duration-200"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap className="h-3 w-3" />
                  <span>Solve</span>
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>
                Open on {problem.platform || "Platform"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Notes - 48px */}
      <div className="flex items-center justify-center py-3">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FileText className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Add notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Revision Star - 48px */}
      <div className="flex items-center justify-center py-3">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/12" 
                    : "text-muted-foreground/30 hover:text-amber-500/60 hover:bg-amber-500/8"
                )}
                whileHover={{ scale: 1.12, rotate: isRevision ? -12 : 12 }}
                whileTap={{ scale: 0.88 }}
              >
                <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              {isRevision ? "Remove from revision" : "Add to revision"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}

// Mobile Problem Row (stacked layout)
function CPProblemRowMobile({
  problem,
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  onOpenNote,
}: {
  problem: CPProblem;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onOpenNote: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      className={cn(
        "group p-3 border-b border-border/15 last:border-0",
        "transition-all duration-200",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/6 to-transparent" 
          : "hover:bg-muted/20"
      )}
    >
      {/* Top row: checkbox, number, title */}
      <div className="flex items-start gap-2.5">
        <motion.button
          onClick={onToggleSolved}
          className={cn(
            "p-1 rounded-lg shrink-0 mt-0.5",
            isSolved ? "bg-emerald-500/15" : "hover:bg-muted/50"
          )}
          whileTap={{ scale: 0.9 }}
        >
          {isSolved ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/30" />
          )}
        </motion.button>

        <span className={cn(
          "inline-flex items-center justify-center min-w-[24px] h-6 text-[10px] font-bold rounded shrink-0 mt-0.5",
          isSolved 
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium block",
            isSolved && "line-through text-muted-foreground decoration-emerald-500/40"
          )}>
            {problem.title}
          </span>
          
          {/* Badges row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.platform && <PlatformBadge platform={problem.platform} />}
          </div>
        </div>
      </div>

      {/* Bottom row: actions */}
      <div className="flex items-center justify-end gap-1 mt-2.5 pl-8">
        {problem.problemUrl && (
          <a
            href={problem.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20"
          >
            <Zap className="h-3 w-3" />
            Solve
          </a>
        )}
        <button
          onClick={onOpenNote}
          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleRevision}
          className={cn(
            "p-1.5 rounded-md",
            isRevision 
              ? "text-amber-500 bg-amber-500/12" 
              : "text-muted-foreground/30 hover:text-amber-500/60"
          )}
        >
          <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
        </button>
      </div>
    </motion.div>
  );
}

// Main Table Component
export default function CPProblemTable({
  problems,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
}: CPProblemTableProps) {
  const solvedCount = problems.filter(p => isSolved(p.id)).length;
  const isAllComplete = solvedCount === problems.length && problems.length > 0;
  const revisionCount = problems.filter(p => isRevision(p.id)).length;
  
  // Difficulty breakdown
  const stats = problems.reduce(
    (acc, p) => ({ ...acc, [p.difficulty]: acc[p.difficulty] + 1 }),
    { Easy: 0, Medium: 0, Hard: 0 }
  );
  
  return (
    <div className="relative">
      {/* Stats Header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        "bg-gradient-to-r from-muted/40 via-muted/20 to-transparent",
        "border-b border-border/30"
      )}>
        {/* Left: counts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">
              {problems.length} <span className="text-muted-foreground font-normal">problems</span>
            </span>
          </div>
          
          {/* Difficulty legend */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border/40">
            {stats.Easy > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <DifficultyIcon difficulty="Easy" size="xs" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.Easy}</span>
              </span>
            )}
            {stats.Medium > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <DifficultyIcon difficulty="Medium" size="xs" />
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.Medium}</span>
              </span>
            )}
            {stats.Hard > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <DifficultyIcon difficulty="Hard" size="xs" />
                <span className="text-red-600 dark:text-red-400 font-semibold">{stats.Hard}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Right: progress */}
        <div className="flex items-center gap-2">
          {revisionCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="h-3 w-3 fill-current" />
              {revisionCount}
            </span>
          )}
          
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold",
            isAllComplete 
              ? "bg-emerald-500 text-white" 
              : "bg-muted/60 text-foreground"
          )}>
            {isAllComplete ? (
              <>
                <Trophy className="h-3.5 w-3.5" />
                Complete!
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {solvedCount}/{problems.length}
              </>
            )}
          </span>
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden sm:block">
        {/* Table Header */}
        <div className="grid grid-cols-[56px_48px_1fr_100px_80px_48px_48px] items-center bg-muted/20 border-b border-border/30">
          <TableHeaderCell align="center">Done</TableHeaderCell>
          <TableHeaderCell align="center">#</TableHeaderCell>
          <TableHeaderCell>Problem</TableHeaderCell>
          <TableHeaderCell align="center">Level</TableHeaderCell>
          <TableHeaderCell align="center">Practice</TableHeaderCell>
          <TableHeaderCell align="center">Note</TableHeaderCell>
          <TableHeaderCell align="center">Rev</TableHeaderCell>
        </div>
        
        {/* Table Body */}
        <div>
          {problems.map((problem, idx) => (
            <CPProblemRow
              key={problem.id}
              problem={problem}
              index={idx}
              isSolved={isSolved(problem.id)}
              isRevision={isRevision(problem.id)}
              onToggleSolved={() => toggleSolved(problem.id)}
              onToggleRevision={() => toggleRevision(problem.id)}
              onOpenNote={() => onOpenNote(problem.id, problem.title)}
            />
          ))}
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="sm:hidden">
        {problems.map((problem, idx) => (
          <CPProblemRowMobile
            key={problem.id}
            problem={problem}
            index={idx}
            isSolved={isSolved(problem.id)}
            isRevision={isRevision(problem.id)}
            onToggleSolved={() => toggleSolved(problem.id)}
            onToggleRevision={() => toggleRevision(problem.id)}
            onOpenNote={() => onOpenNote(problem.id, problem.title)}
          />
        ))}
      </div>
    </div>
  );
}

export { DifficultyBadge, PlatformBadge, DifficultyIcon };
