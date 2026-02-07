import { motion, AnimatePresence } from "framer-motion";
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

// Striver-style Difficulty Badge
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
      styles[difficulty]
    )}>
      {difficulty}
    </span>
  );
}

// Resource Link Button (Striver-style)
function ResourceLink({ 
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
    article: "text-blue-500/60 hover:text-blue-500 hover:bg-blue-500/10",
    video: "text-red-500/60 hover:text-red-500 hover:bg-red-500/10",
    practice: "text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/10",
  };

  if (!href) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <Icon className="h-4 w-4 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
              variantStyles[variant]
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="h-4 w-4" />
          </motion.a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Table Header Cell
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
      "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3 px-3",
      "border-b-2 border-border/30",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}>
      {children}
    </div>
  );
}

// Striver-style Problem Row
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015, duration: 0.2 }}
      className={cn(
        "group grid grid-cols-[44px_44px_1fr_44px_44px_44px_44px_44px_90px] items-center",
        "border-b border-border/10 last:border-0",
        "transition-all duration-200",
        isSolved 
          ? "bg-emerald-500/5 hover:bg-emerald-500/8" 
          : "hover:bg-muted/40"
      )}
    >
      {/* Status Checkbox */}
      <div className="flex items-center justify-center py-3">
        <motion.button
          onClick={onToggleSolved}
          className="p-1 rounded-md transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {isSolved ? (
              <motion.div
                key="checked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
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
                <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Problem Number */}
      <div className="flex items-center justify-center py-3">
        <span className={cn(
          "text-xs font-medium tabular-nums",
          isSolved ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"
        )}>
          {index + 1}
        </span>
      </div>

      {/* Problem Title */}
      <div className="py-3 px-2 min-w-0">
        <span className={cn(
          "text-sm font-medium truncate block transition-colors",
          isSolved 
            ? "text-muted-foreground line-through decoration-emerald-500/40" 
            : "text-foreground group-hover:text-primary"
        )}>
          {problem.title}
        </span>
      </div>

      {/* Article Link - uses problemUrl as fallback */}
      <div className="flex items-center justify-center py-3">
        <ResourceLink 
          href={problem.problemUrl} 
          icon={BookOpen} 
          label="Read Article"
          variant="article"
        />
      </div>

      {/* Video Link - uses problemUrl as fallback */}
      <div className="flex items-center justify-center py-3">
        <ResourceLink 
          href={problem.problemUrl} 
          icon={Video} 
          label="Watch Video"
          variant="video"
        />
      </div>

      {/* Practice Link */}
      <div className="flex items-center justify-center py-3">
        <ResourceLink 
          href={problem.problemUrl} 
          icon={Code2} 
          label={`Practice on ${problem.platform || 'Platform'}`}
          variant="practice"
        />
      </div>

      {/* Notes Button */}
      <div className="flex items-center justify-center py-3">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <StickyNote className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Add Notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Revision Star */}
      <div className="flex items-center justify-center py-3">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/10" 
                    : "text-muted-foreground/30 hover:text-amber-500/60 hover:bg-amber-500/5"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isRevision ? "Remove from Revision" : "Mark for Revision"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Difficulty */}
      <div className="flex items-center justify-center py-3 px-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
    </motion.div>
  );
}

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
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm">
      {/* Progress Bar */}
      <div className="h-1 bg-muted/30">
        <motion.div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Stats Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/20">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Progress: <span className="text-foreground font-semibold">{solvedCount}/{problems.length}</span>
          </span>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
              Easy
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
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
        {/* Table Header */}
        <div className="grid grid-cols-[44px_44px_1fr_44px_44px_44px_44px_44px_90px] items-center bg-muted/10">
          <TableHeaderCell align="center">Status</TableHeaderCell>
          <TableHeaderCell align="center">#</TableHeaderCell>
          <TableHeaderCell>Problem</TableHeaderCell>
          <TableHeaderCell align="center">Article</TableHeaderCell>
          <TableHeaderCell align="center">Video</TableHeaderCell>
          <TableHeaderCell align="center">Practice</TableHeaderCell>
          <TableHeaderCell align="center">Note</TableHeaderCell>
          <TableHeaderCell align="center">Rev</TableHeaderCell>
          <TableHeaderCell align="center">Difficulty</TableHeaderCell>
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
