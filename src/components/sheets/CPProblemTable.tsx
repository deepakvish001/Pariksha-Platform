import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Star,
  FileText,
  Diamond,
  Hexagon,
  Zap,
  Trophy,
  Sparkles,
  ExternalLink,
  Target,
} from "lucide-react";
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

// Enhanced Difficulty Icon with glow effect
function DifficultyIcon({ difficulty, size = "sm" }: { difficulty: "Easy" | "Medium" | "Hard"; size?: "xs" | "sm" }) {
  const sizeClasses = size === "xs" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const config = {
    Easy: { Icon: Circle, color: "text-emerald-500", fill: "fill-emerald-500/80", glow: "drop-shadow-[0_0_3px_rgba(16,185,129,0.4)]" },
    Medium: { Icon: Diamond, color: "text-amber-500", fill: "fill-amber-500/60", glow: "drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]" },
    Hard: { Icon: Hexagon, color: "text-red-500", fill: "fill-red-500/60", glow: "drop-shadow-[0_0_3px_rgba(239,68,68,0.4)]" },
  };
  const { Icon, color, fill, glow } = config[difficulty];
  return <Icon className={cn(sizeClasses, color, fill, glow)} />;
}

// Enhanced Difficulty Badge with gradient background
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-gradient-to-r from-emerald-500/15 to-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/10",
    Medium: "bg-gradient-to-r from-amber-500/15 to-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/10",
    Hard: "bg-gradient-to-r from-red-500/15 to-red-400/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-red-500/10",
  };

  return (
    <motion.span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm",
        styles[difficulty]
      )}
      whileHover={{ scale: 1.02 }}
    >
      <DifficultyIcon difficulty={difficulty} size="xs" />
      {difficulty}
    </motion.span>
  );
}

// Enhanced Platform Badge with subtle animation
function PlatformBadge({ platform }: { platform: string }) {
  const colorClasses = getPlatformColor(platform);
  return (
    <motion.span 
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border backdrop-blur-sm",
        colorClasses
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {platform}
    </motion.span>
  );
}

// Refined Table Header Cell
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
      "text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 py-2.5 px-3",
      "border-b border-border/20",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}>
      {children}
    </div>
  );
}

// Enhanced Problem Row with refined styling
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
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative grid grid-cols-[52px_44px_1fr_90px_88px_44px_44px] items-center",
        "border-b border-border/10 last:border-0",
        "transition-all duration-300",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/8 via-emerald-500/4 to-transparent" 
          : "hover:bg-gradient-to-r hover:from-muted/50 hover:via-muted/30 hover:to-transparent"
      )}
    >
      {/* Solved indicator line */}
      {isSolved && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500/50"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Status Checkbox */}
      <div className="flex items-center justify-center py-3.5 px-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleSolved}
                className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-300",
                  isSolved 
                    ? "bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]" 
                    : "hover:bg-muted/60 hover:shadow-sm"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isSolved ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Circle className="h-5 w-5 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors duration-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              {isSolved ? "Mark as incomplete" : "Mark as complete"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Problem Number */}
      <div className="flex items-center justify-center py-3.5">
        <span className={cn(
          "inline-flex items-center justify-center min-w-[26px] h-6 text-[10px] font-bold rounded-md tabular-nums transition-all duration-300",
          isSolved 
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" 
            : "bg-muted/40 text-muted-foreground/70 group-hover:bg-muted/60"
        )}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Problem Title & Platform */}
      <div className="py-3.5 px-3 min-w-0">
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-[13px] font-medium truncate transition-all duration-300",
            isSolved 
              ? "text-muted-foreground line-through decoration-emerald-500/50 decoration-[1.5px]" 
              : "text-foreground group-hover:text-primary"
          )}>
            {problem.title}
          </span>
          {problem.platform && (
            <span className="hidden lg:inline shrink-0">
              <PlatformBadge platform={problem.platform} />
            </span>
          )}
        </div>
        {/* Mobile: show platform below title */}
        {problem.platform && (
          <div className="lg:hidden mt-1.5">
            <PlatformBadge platform={problem.platform} />
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="flex items-center justify-center py-3.5 px-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* Practice Link */}
      <div className="flex items-center justify-center py-3.5 px-2">
        {problem.problemUrl ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "bg-gradient-to-r from-primary/15 to-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide",
                    "border border-primary/25 hover:border-primary/40",
                    "hover:from-primary/20 hover:to-primary/15 hover:shadow-[0_0_12px_rgba(var(--primary),0.15)]",
                    "transition-all duration-300"
                  )}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Zap className="h-3 w-3" />
                  <span>Solve</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Practice on {problem.platform || "Platform"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground/20 text-xs">—</span>
        )}
      </div>

      {/* Notes Button */}
      <div className="flex items-center justify-center py-3.5">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className="p-2 rounded-lg text-muted-foreground/35 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FileText className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Add notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Revision Star */}
      <div className="flex items-center justify-center py-3.5">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/15 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                    : "text-muted-foreground/25 hover:text-amber-500/70 hover:bg-amber-500/10"
                )}
                whileHover={{ scale: 1.15, rotate: isRevision ? -15 : 15 }}
                whileTap={{ scale: 0.85 }}
              >
                <Star className={cn("h-4 w-4 transition-all", isRevision && "fill-current drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]")} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {isRevision ? "Remove from revision" : "Add to revision list"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}

// Enhanced Mobile Problem Row
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3 }}
      className={cn(
        "group relative p-4 border-b border-border/10 last:border-0",
        "transition-all duration-300",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/8 to-transparent" 
          : "hover:bg-muted/30"
      )}
    >
      {/* Solved indicator */}
      {isSolved && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 to-emerald-500/30" />
      )}

      {/* Top row: checkbox, number, title */}
      <div className="flex items-start gap-3">
        <motion.button
          onClick={onToggleSolved}
          className={cn(
            "p-1.5 rounded-xl shrink-0 mt-0.5 transition-all",
            isSolved ? "bg-emerald-500/20" : "hover:bg-muted/60"
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
          "inline-flex items-center justify-center min-w-[24px] h-6 text-[10px] font-bold rounded-md shrink-0 mt-0.5",
          isSolved 
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium block leading-relaxed",
            isSolved && "line-through text-muted-foreground decoration-emerald-500/50"
          )}>
            {problem.title}
          </span>
          
          {/* Badges row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.platform && <PlatformBadge platform={problem.platform} />}
          </div>
        </div>
      </div>

      {/* Bottom row: actions */}
      <div className="flex items-center justify-end gap-2 mt-3 pl-10">
        {problem.problemUrl && (
          <motion.a
            href={problem.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-[10px] font-bold uppercase border border-primary/25"
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="h-3 w-3" />
            Solve
          </motion.a>
        )}
        <button
          onClick={onOpenNote}
          className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleRevision}
          className={cn(
            "p-2 rounded-lg transition-all",
            isRevision 
              ? "text-amber-500 bg-amber-500/15" 
              : "text-muted-foreground/30 hover:text-amber-500/70"
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
  
  const progressPercent = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm">
      {/* Enhanced Stats Header */}
      <div className={cn(
        "relative flex flex-wrap items-center justify-between gap-4 px-5 py-4",
        "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent",
        "border-b border-border/20"
      )}>
        {/* Progress bar background */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted/30">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Left: Problem count & difficulty breakdown */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">
              {problems.length} <span className="text-muted-foreground font-normal text-xs">problems</span>
            </span>
          </div>
          
          {/* Difficulty legend */}
          <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-border/30">
            {stats.Easy > 0 && (
              <div className="flex items-center gap-1.5">
                <DifficultyIcon difficulty="Easy" size="xs" />
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{stats.Easy}</span>
              </div>
            )}
            {stats.Medium > 0 && (
              <div className="flex items-center gap-1.5">
                <DifficultyIcon difficulty="Medium" size="xs" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{stats.Medium}</span>
              </div>
            )}
            {stats.Hard > 0 && (
              <div className="flex items-center gap-1.5">
                <DifficultyIcon difficulty="Hard" size="xs" />
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400">{stats.Hard}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Revision count & completion status */}
        <div className="flex items-center gap-3">
          {revisionCount > 0 && (
            <motion.span 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Star className="h-3 w-3 fill-current" />
              {revisionCount} starred
            </motion.span>
          )}
          
          <motion.span 
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold",
              isAllComplete 
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25" 
                : "bg-muted/60 text-foreground border border-border/30"
            )}
            animate={isAllComplete ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {isAllComplete ? (
              <>
                <Trophy className="h-3.5 w-3.5" />
                Complete!
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {solvedCount}/{problems.length}
              </>
            )}
          </motion.span>
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden sm:block">
        {/* Table Header */}
        <div className="grid grid-cols-[52px_44px_1fr_90px_88px_44px_44px] items-center bg-muted/10">
          <TableHeaderCell align="center">Done</TableHeaderCell>
          <TableHeaderCell align="center">#</TableHeaderCell>
          <TableHeaderCell>Problem Title</TableHeaderCell>
          <TableHeaderCell align="center">Difficulty</TableHeaderCell>
          <TableHeaderCell align="center">Practice</TableHeaderCell>
          <TableHeaderCell align="center">Notes</TableHeaderCell>
          <TableHeaderCell align="center">Star</TableHeaderCell>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-border/5">
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
      <div className="sm:hidden divide-y divide-border/5">
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
