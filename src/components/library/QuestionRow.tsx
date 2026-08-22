import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  StickyNote,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import AnswerPanel from "./AnswerPanel";
import type { Difficulty } from "@/data/positionResourcesData";

interface QuestionWithMeta {
  id: number;
  text: string;
  difficulty: Difficulty;
  categoryId: string;
  categoryName: string;
  answer?: string;
}

interface QuestionRowProps {
  question: QuestionWithMeta;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  hasNote: boolean;
  notePreview?: string;
  showCategory?: boolean;
  isExpanded?: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onOpenNote: () => void;
  onToggleAnswer?: () => void;
}

const getDifficultyStyles = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    case "Hard":
      return "bg-red-500/20 text-red-500 border-red-500/30";
  }
};

const QuestionRow = ({
  question,
  index,
  isSolved,
  isRevision,
  hasNote,
  notePreview,
  showCategory = false,
  isExpanded = false,
  onToggleSolved,
  onToggleRevision,
  onOpenNote,
  onToggleAnswer,
}: QuestionRowProps) => {
  const hasAnswer = question.answer !== undefined;

  return (
    <>
      <motion.tr
        data-question-id={`${question.categoryId}-${question.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.2 }}
        whileHover={{ 
          backgroundColor: "hsl(var(--muted) / 0.5)",
          transition: { duration: 0.15 }
        }}
        className={cn(
          "border-b transition-colors group",
          isSolved && "bg-muted/30",
          isExpanded && "bg-muted/40"
        )}
      >
        {/* Index */}
        <TableCell className="font-medium text-muted-foreground text-xs sm:text-sm w-10 sm:w-12">
          <div className="flex items-center gap-1">
            {isSolved && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Sparkles className="h-3 w-3 text-emerald-500" />
              </motion.div>
            )}
            <span>{index + 1}</span>
          </div>
        </TableCell>

        {/* Question Text - Clickable to expand answer */}
        <TableCell className="min-w-0">
          <div
            className={cn(
              "flex items-start gap-2 cursor-pointer group/question",
              hasAnswer && "hover:text-primary"
            )}
            onClick={onToggleAnswer}
            role={hasAnswer ? "button" : undefined}
            tabIndex={hasAnswer ? 0 : undefined}
            onKeyDown={(e) => {
              if (hasAnswer && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onToggleAnswer?.();
              }
            }}
          >
            {/* Expand chevron */}
            {hasAnswer && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 mt-0.5"
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/question:text-primary transition-colors" />
              </motion.div>
            )}
            
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-sm break-words transition-colors",
                  isSolved && "line-through text-muted-foreground",
                  hasAnswer && "group-hover/question:text-primary"
                )}
              >
                {question.text}
              </p>
              {showCategory && (
                <Badge variant="secondary" className="font-normal mt-1 md:hidden text-xs">
                  {question.categoryName}
                </Badge>
              )}
              {hasNote && notePreview && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <StickyNote className="h-3 w-3 inline mr-1" />
                  {notePreview}
                </p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Category (for revision view) */}
        {showCategory && (
          <TableCell className="hidden md:table-cell w-28">
            <Badge variant="secondary" className="font-normal text-xs">
              {question.categoryName}
            </Badge>
          </TableCell>
        )}

        {/* Difficulty */}
        <TableCell className="w-20 sm:w-24">
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs",
              getDifficultyStyles(question.difficulty)
            )}
          >
            <span className="hidden sm:inline">{question.difficulty}</span>
            <span className="sm:hidden">{question.difficulty[0]}</span>
          </Badge>
        </TableCell>

        {/* Solved Checkbox */}
        <TableCell className="text-center p-2 w-12 sm:w-16">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="inline-flex"
              >
                <Checkbox
                  checked={isSolved}
                  onCheckedChange={onToggleSolved}
                  aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                  className={cn(
                    "transition-all duration-200",
                    "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                    "hover:border-emerald-400"
                  )}
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isSolved ? "Mark as unsolved" : "Mark as solved"}
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Revision Bookmark */}
        <TableCell className="text-center p-2 w-12 sm:w-16">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: isRevision ? -15 : 15 }}
                className="inline-flex"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleRevision}
                  aria-label={isRevision ? "Remove from revision" : "Add to revision list"}
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                    isRevision
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isRevision ? (
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isRevision ? "Remove from revision" : "Add to revision list"}
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Notes */}
        <TableCell className="text-center p-2 w-12 sm:w-16">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="inline-flex"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenNote}
                  aria-label={hasNote ? "Edit note" : "Add note"}
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                    hasNote
                      ? "text-blue-500 hover:text-blue-600"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {hasNote ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <StickyNote className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {hasNote ? "Edit note" : "Add note"}
            </TooltipContent>
          </Tooltip>
        </TableCell>
      </motion.tr>

      {/* Expandable Answer Row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TableCell
              colSpan={showCategory ? 7 : 6}
              className="p-0 bg-muted/20"
            >
              <AnswerPanel answer={question.answer} />
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuestionRow;
