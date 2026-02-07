import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  CheckSquare,
  Square,
  Star,
  Save,
  ChevronUp,
  Circle,
  Diamond,
  Hexagon,
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
    Easy: { Icon: Circle, color: "text-emerald-500", fill: "fill-emerald-500/30" },
    Medium: { Icon: Diamond, color: "text-amber-500", fill: "fill-amber-500/30" },
    Hard: { Icon: Hexagon, color: "text-red-500", fill: "fill-red-500/30" },
  };
  const { Icon, color, fill } = config[difficulty];
  return <Icon className={cn("h-3.5 w-3.5", color, fill)} />;
}

// Enhanced Difficulty Badge
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/10",
    Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10",
    Hard: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 shadow-red-500/10",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-2 py-0.5 gap-1 font-semibold shadow-sm border",
        styles[difficulty]
      )}
    >
      <DifficultyIcon difficulty={difficulty} />
      {difficulty}
    </Badge>
  );
}

// Platform Badge Component
function PlatformBadge({ platform }: { platform: string }) {
  const colorClasses = getPlatformColor(platform);
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[9px] px-1.5 py-0 font-medium",
        colorClasses
      )}
    >
      {platform}
    </Badge>
  );
}

// Enhanced Problem Row
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
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.015 }}
      className={cn(
        "group transition-all duration-200 border-b border-border/30 last:border-0",
        isSolved 
          ? "bg-gradient-to-r from-emerald-500/5 to-transparent" 
          : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent"
      )}
    >
      {/* Status Checkbox */}
      <TableCell className="w-14 text-center py-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleSolved}
                className="relative p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
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
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckSquare className="h-5 w-5 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Square className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {isSolved ? "Mark as incomplete" : "Mark as complete"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Problem Number */}
      <TableCell className="w-12 text-center py-3">
        <span className={cn(
          "text-xs font-mono px-2 py-1 rounded-md",
          isSolved 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </TableCell>

      {/* Problem Title */}
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-sm font-medium transition-all",
            isSolved && "line-through text-muted-foreground decoration-emerald-500/50"
          )}>
            {problem.title}
          </span>
          {problem.platform && (
            <span className="hidden sm:inline">
              <PlatformBadge platform={problem.platform} />
            </span>
          )}
        </div>
      </TableCell>

      {/* Difficulty */}
      <TableCell className="w-28 text-center py-3 hidden sm:table-cell">
        <DifficultyBadge difficulty={problem.difficulty} />
      </TableCell>

      {/* Practice Link */}
      <TableCell className="w-20 text-center py-3">
        {problem.problemUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center p-2 rounded-lg",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "text-primary hover:from-primary/20 hover:to-primary/10",
                    "border border-primary/20 hover:border-primary/30",
                    "transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/10"
                  )}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Solve on {problem.platform || "Platform"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      {/* Notes Button */}
      <TableCell className="w-14 text-center py-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenNote}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Revision Star */}
      <TableCell className="w-14 text-center py-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRevision}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isRevision 
                    ? "text-amber-500 bg-amber-500/10" 
                    : "text-muted-foreground/50 hover:text-amber-500/70 hover:bg-amber-500/5"
                )}
                whileHover={{ scale: 1.15, rotate: isRevision ? -10 : 10 }}
                whileTap={{ scale: 0.9 }}
              >
                <Star className={cn("h-4 w-4 transition-all", isRevision && "fill-current")} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              {isRevision ? "Remove from revision" : "Add to revision"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </motion.tr>
  );
}

// Main Problem Table Component
export default function CPProblemTable({
  problems,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
}: CPProblemTableProps) {
  const solvedCount = problems.filter(p => isSolved(p.id)).length;
  
  return (
    <div className="relative">
      {/* Table Header with Stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {problems.length} {problems.length === 1 ? "problem" : "problems"}
          </span>
          <span className="text-xs text-muted-foreground/60">•</span>
          <span className={cn(
            "text-xs font-medium",
            solvedCount === problems.length ? "text-emerald-500" : "text-muted-foreground"
          )}>
            {solvedCount} solved
          </span>
        </div>
        {solvedCount === problems.length && problems.length > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
            <ChevronUp className="h-3 w-3 mr-0.5" />
            Complete!
          </Badge>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
              <TableHead className="w-14 text-center text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground">
                #
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Problem
              </TableHead>
              <TableHead className="w-28 text-center text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                Difficulty
              </TableHead>
              <TableHead className="w-20 text-center text-xs font-semibold text-muted-foreground">
                Solve
              </TableHead>
              <TableHead className="w-14 text-center text-xs font-semibold text-muted-foreground">
                Notes
              </TableHead>
              <TableHead className="w-14 text-center text-xs font-semibold text-muted-foreground">
                Rev
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
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { DifficultyBadge, PlatformBadge, DifficultyIcon };
