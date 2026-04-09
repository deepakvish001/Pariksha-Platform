import { motion, AnimatePresence } from "framer-motion";
import { memo, useCallback, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Star,
  FileText,
  ExternalLink,
  BookOpen,
  Video,
  Code2,
  StickyNote,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CPProblem } from "@/data/competitiveProgrammingData";

interface CPProblemTableProps {
  problems: CPProblem[];
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
}

// Enhanced Difficulty Badge with icon
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/5",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/5",
    Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-red-500/5",
  };

  return (
    <motion.span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border shadow-sm",
        styles[difficulty]
      )}
      whileHover={{ scale: 1.05 }}
    >
      {difficulty}
    </motion.span>
  );
}

// Enhanced Resource Link Button with better hover states
const ResourceLink = memo(function ResourceLink({ 
  href, 
  icon: Icon, 
  label, 
  variant = "default" 
}: { 
  href?: string; 
  icon: React.ElementType; 
  label: string;
  variant?: "default" | "article" | "video" | "practice";
}) {
  const variantStyles = {
    default: "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50",
    article: "text-blue-500/50 hover:text-blue-500 hover:bg-blue-500/10 hover:shadow-blue-500/10",
    video: "text-red-500/50 hover:text-red-500 hover:bg-red-500/10 hover:shadow-red-500/10",
    practice: "text-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 hover:shadow-emerald-500/10",
  };

  if (!href) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <Icon className="h-4 w-4 text-muted-foreground/15" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shadow-sm",
              variantStyles[variant]
            )}
            whileHover={{ scale: 1.15, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className="h-4 w-4" />
          </motion.a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-medium px-2 py-1">
          <div className="flex items-center gap-1">
            {label}
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Table Header Cell with sort indicator capability
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
      "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3 px-2",
      "select-none",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}>
      {children}
    </div>
  );
}

// Grid column definition for consistency
const TABLE_GRID_COLS = "grid-cols-[50px_1fr_56px_56px_56px_56px_56px_100px_70px]";

// Enhanced Striver-style Problem Row with keyboard navigation
const CPProblemRow = memo(function CPProblemRow({
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
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.3), duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group grid items-center relative",
        TABLE_GRID_COLS,
        "border-b border-border/10 last:border-0",
        "transition-all duration-200",
        // Enhanced row styling
        index % 2 === 0 ? "bg-transparent" : "bg-muted/10",
        isSolved 
          ? "bg-emerald-500/5 hover:bg-emerald-500/10" 
          : "hover:bg-muted/30"
      )}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSolved();
        } else if (e.key === "s") {
          onToggleRevision();
        }
      }}
    >
      {/* Highlight bar on hover */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: isHovered && !isSolved ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Solved indicator bar */}
      {isSolved && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-r"
          layoutId={`solved-bar-${problem.id}`}
        />
      )}

      {/* Status Checkbox */}
      <div className="flex items-center justify-center py-3.5 px-1">
        <motion.button
          onClick={onToggleSolved}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
            isSolved ? "hover:bg-emerald-500/20" : "hover:bg-muted/50"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
        >
          <AnimatePresence mode="wait">
            {isSolved ? (
              <motion.div
                key="checked"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
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
                <Circle className="h-5 w-5 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Problem Title */}
      <div className="py-3.5 px-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[13px] font-medium truncate transition-colors",
            isSolved 
              ? "text-muted-foreground line-through decoration-emerald-500/40" 
              : "text-foreground group-hover:text-primary"
          )}>
            {problem.title}
          </span>
        </div>
      </div>

      {/* Problem Link */}
      <div className="flex items-center justify-center py-3.5">
        {problem.problemUrl ? (
          <ResourceLink 
            href={problem.problemUrl} 
            icon={ExternalLink} 
            label="Solve Problem"
            variant="practice"
          />
        ) : (
          <span className="text-muted-foreground/30 text-xs">—</span>
        )}
      </div>

      {/* Article Link */}
      <div className="flex items-center justify-center py-3.5">
        <ResourceLink 
          href={problem.problemUrl} 
          icon={BookOpen} 
          label="Read Article"
          variant="article"
        />
      </div>

      {/* Video Link */}
      <div className="flex items-center justify-center py-3.5">
        <ResourceLink 
          href={problem.problemUrl} 
          icon={Video} 
          label="Watch Video"
          variant="video"
        />
      </div>

      {/* Notes Button */}
      <div className="flex items-center justify-center py-3.5">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/25 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Add notes"
              >
                <StickyNote className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Add Notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Revision Star with animation */}
      <div className="flex items-center justify-center py-3.5">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/15" 
                    : "text-muted-foreground/20 hover:text-amber-500/60 hover:bg-amber-500/5"
                )}
                whileHover={{ scale: 1.15, rotate: isRevision ? 0 : 15 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isRevision ? "Remove from revision" : "Mark for revision"}
              >
                <motion.div
                  animate={isRevision ? { 
                    rotate: [0, -15, 15, -10, 10, 0],
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
                </motion.div>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isRevision ? "Remove from Revision" : "Mark for Revision"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Difficulty */}
      <div className="flex items-center justify-center py-3.5 px-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
    </motion.div>
  );
});

// Striver-style Mobile Row
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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className={cn(
        "group p-3 border-b border-border/10 last:border-0",
        "transition-colors duration-200",
        // Alternating row colors
        index % 2 === 0 ? "bg-transparent" : "bg-muted/15",
        // Override with solved state styling
        isSolved ? "bg-emerald-500/5" : "hover:bg-muted/30"
      )}
    >
      {/* Top row: Status + Title + Difficulty */}
      <div className="flex items-start gap-3">
        <motion.button
          onClick={onToggleSolved}
          className="p-0.5 shrink-0 mt-0.5"
          whileTap={{ scale: 0.9 }}
        >
          {isSolved ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/30" />
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={cn(
              "text-sm font-medium leading-relaxed",
              isSolved && "line-through text-muted-foreground decoration-emerald-500/40"
            )}>
              <span className="text-muted-foreground/50 mr-1.5">{index + 1}.</span>
              {problem.title}
            </span>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          
          {/* Resource Links Row */}
          <div className="flex items-center gap-1 mt-2">
            <ResourceLink href={problem.problemUrl} icon={BookOpen} label="Article" variant="article" />
            <ResourceLink href={problem.problemUrl} icon={Video} label="Video" variant="video" />
            <ResourceLink href={problem.problemUrl} icon={Code2} label="Practice" variant="practice" />
            <div className="w-px h-4 bg-border/30 mx-1" />
            <motion.button
              onClick={onOpenNote}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10"
              whileTap={{ scale: 0.95 }}
            >
              <StickyNote className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={onToggleRevision}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                isRevision ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground/30"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
            </motion.button>
          </div>
        </div>
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
  const progressPercent = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm">
      {/* Progress Bar */}
      <div className="h-1 bg-muted/20">
        <motion.div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Stats Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10 border-b border-border/20">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Progress: <span className="text-foreground font-semibold">{solvedCount}/{problems.length}</span>
          </span>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
              Easy
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              Medium
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              Hard
            </span>
          </div>
        </div>
        {progressPercent === 100 && (
          <motion.span 
            className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ✓ Complete
          </motion.span>
        )}
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block">
        {/* Sticky Table Header */}
        <div className={cn(
          "grid items-center sticky top-0 z-10",
          TABLE_GRID_COLS,
          "bg-muted/30 backdrop-blur-md border-b border-border/20"
        )}>
          <TableHeaderCell align="center">Status</TableHeaderCell>
          <TableHeaderCell className="pl-3">Problem</TableHeaderCell>
          <TableHeaderCell align="center">Problem Link</TableHeaderCell>
          <TableHeaderCell align="center">Articles</TableHeaderCell>
          <TableHeaderCell align="center">Videos</TableHeaderCell>
          <TableHeaderCell align="center">Note</TableHeaderCell>
          <TableHeaderCell align="center">Rev</TableHeaderCell>
          <TableHeaderCell align="center">Difficulty</TableHeaderCell>
          <TableHeaderCell align="center">Est Time</TableHeaderCell>
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
      <div className="md:hidden">
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

export { DifficultyBadge };
