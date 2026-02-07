import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  Circle,
  Star,
  FileText,
  Diamond,
  Hexagon,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Difficulty icon component with shapes
function DifficultyIcon({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const config = {
    Easy: { Icon: Circle, color: "text-emerald-500", fill: "fill-emerald-500/40" },
    Medium: { Icon: Diamond, color: "text-amber-500", fill: "fill-amber-500/40" },
    Hard: { Icon: Hexagon, color: "text-red-500", fill: "fill-red-500/40" },
  };
  const { Icon, color, fill } = config[difficulty];
  return <Icon className={cn("h-3 w-3", color, fill)} />;
}

// Enhanced Difficulty Badge with gradient
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/5",
    Medium: "bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/5",
    Hard: "bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-red-500/5",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-2.5 py-0.5 gap-1.5 font-semibold shadow-sm border backdrop-blur-sm",
        styles[difficulty]
      )}
    >
      <DifficultyIcon difficulty={difficulty} />
      {difficulty}
    </Badge>
  );
}

// Platform Badge Component with brand colors
function PlatformBadge({ platform }: { platform: string }) {
  const colorClasses = getPlatformColor(platform);
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[9px] px-2 py-0.5 font-medium tracking-wide uppercase",
        colorClasses
      )}
    >
      {platform}
    </Badge>
  );
}

// Enhanced Problem Row with better visual hierarchy
function CPProblemRow({
  problem,
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  onOpenNote,
  totalProblems,
}: {
  problem: CPProblem;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onOpenNote: () => void;
  totalProblems: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={cn(
        "group relative transition-all duration-300",
        "border-b border-border/20 last:border-0",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/8 via-emerald-500/4 to-transparent" 
          : "hover:bg-gradient-to-r hover:from-primary/8 hover:via-primary/4 hover:to-transparent"
      )}
    >
      {/* Animated left indicator on hover */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full"
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Status Checkbox */}
      <TableCell className="w-16 text-center py-4">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleSolved}
                className={cn(
                  "relative p-2 rounded-xl transition-all duration-300",
                  isSolved 
                    ? "bg-emerald-500/15 hover:bg-emerald-500/25" 
                    : "hover:bg-muted/60"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
              >
                <AnimatePresence mode="wait">
                  {isSolved ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              {isSolved ? "Mark incomplete" : "Mark complete"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Problem Number with visual treatment */}
      <TableCell className="w-14 text-center py-4">
        <motion.span 
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg transition-all duration-300",
            isSolved 
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" 
              : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
          whileHover={{ scale: 1.05 }}
        >
          {String(index + 1).padStart(2, '0')}
        </motion.span>
      </TableCell>

      {/* Problem Title & Platform */}
      <TableCell className="py-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <span className={cn(
            "text-sm font-medium transition-all duration-300 truncate",
            isSolved && "line-through text-muted-foreground decoration-emerald-500/50 decoration-2"
          )}>
            {problem.title}
          </span>
          {problem.platform && (
            <span className="hidden sm:inline shrink-0">
              <PlatformBadge platform={problem.platform} />
            </span>
          )}
        </div>
        {/* Mobile difficulty badge */}
        <div className="flex items-center gap-2 mt-1.5 sm:hidden">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.platform && <PlatformBadge platform={problem.platform} />}
        </div>
      </TableCell>

      {/* Difficulty - Desktop */}
      <TableCell className="w-28 text-center py-4 hidden sm:table-cell">
        <DifficultyBadge difficulty={problem.difficulty} />
      </TableCell>

      {/* Practice Link - Enhanced CTA */}
      <TableCell className="w-24 text-center py-4">
        {problem.problemUrl && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "bg-gradient-to-br from-primary/15 via-primary/10 to-transparent",
                    "text-primary font-medium text-xs",
                    "border border-primary/25 hover:border-primary/40",
                    "transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/15"
                  )}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Zap className="h-3 w-3" />
                  <span className="hidden lg:inline">Solve</span>
                  <ExternalLink className="h-3 w-3 lg:hidden" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent className="font-medium">
                Practice on {problem.platform || "Platform"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      {/* Notes Button */}
      <TableCell className="w-14 text-center py-4">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  "text-muted-foreground/60 hover:text-foreground",
                  "hover:bg-muted/60"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FileText className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="font-medium">Add notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Revision Star */}
      <TableCell className="w-14 text-center py-4">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/15 ring-1 ring-amber-500/25" 
                    : "text-muted-foreground/40 hover:text-amber-500/70 hover:bg-amber-500/10"
                )}
                whileHover={{ scale: 1.15, rotate: isRevision ? -15 : 15 }}
                whileTap={{ scale: 0.85 }}
              >
                <Star className={cn("h-4 w-4 transition-all duration-300", isRevision && "fill-current")} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="font-medium">
              {isRevision ? "Remove from revision" : "Mark for revision"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </motion.tr>
  );
}

// Main Problem Table Component with premium styling
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
  const difficultyStats = problems.reduce(
    (acc, p) => ({ ...acc, [p.difficulty]: acc[p.difficulty] + 1 }),
    { Easy: 0, Medium: 0, Hard: 0 }
  );
  
  return (
    <div className="relative">
      {/* Enhanced Table Header with Stats */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-5 py-3",
        "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent",
        "border-b border-border/40"
      )}>
        {/* Left Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Problem count */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              {problems.length} <span className="text-muted-foreground font-normal">problems</span>
            </span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-border/60 hidden sm:block" />
          
          {/* Difficulty breakdown */}
          <div className="hidden sm:flex items-center gap-2">
            {difficultyStats.Easy > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Circle className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{difficultyStats.Easy}</span>
              </span>
            )}
            {difficultyStats.Medium > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Diamond className="h-2.5 w-2.5 text-amber-500 fill-amber-500/50" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">{difficultyStats.Medium}</span>
              </span>
            )}
            {difficultyStats.Hard > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Hexagon className="h-2.5 w-2.5 text-red-500 fill-red-500/50" />
                <span className="text-red-600 dark:text-red-400 font-medium">{difficultyStats.Hard}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Right Stats */}
        <div className="flex items-center gap-3">
          {/* Revision count */}
          {revisionCount > 0 && (
            <Badge 
              variant="outline"
              className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
            >
              <Star className="h-3 w-3 fill-current" />
              {revisionCount}
            </Badge>
          )}
          
          {/* Solved count */}
          <Badge 
            variant={isAllComplete ? "default" : "outline"}
            className={cn(
              "text-[10px] px-2.5 py-0.5 gap-1.5 font-semibold",
              isAllComplete 
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md shadow-emerald-500/25" 
                : "bg-muted/50 border-border/60"
            )}
          >
            {isAllComplete ? (
              <>
                <Trophy className="h-3 w-3" />
                Complete!
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                {solvedCount}/{problems.length}
              </>
            )}
          </Badge>
        </div>
      </div>
      
      {/* Table with responsive design */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/30 bg-muted/20">
              <TableHead className="w-16 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                Done
              </TableHead>
              <TableHead className="w-14 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                #
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                Problem
              </TableHead>
              <TableHead className="w-28 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hidden sm:table-cell py-3">
                Level
              </TableHead>
              <TableHead className="w-24 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                Practice
              </TableHead>
              <TableHead className="w-14 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                Notes
              </TableHead>
              <TableHead className="w-14 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3">
                Star
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                totalProblems={problems.length}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { DifficultyBadge, PlatformBadge, DifficultyIcon };
