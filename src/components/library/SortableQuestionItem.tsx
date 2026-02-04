import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, CheckCircle2, Bookmark, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionData {
  id: number;
  text: string;
  difficulty?: string;
  source: string;
  sourceLabel: string;
}

interface SortableQuestionItemProps {
  id: string;
  question: QuestionData;
  isSolved?: boolean;
  isRevision?: boolean;
}

const difficultyStyles: Record<string, string> = {
  Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Hard: "bg-red-500/20 text-red-500 border-red-500/30",
};

const SortableQuestionItem = ({
  id,
  question,
  isSolved = false,
  isRevision = false,
}: SortableQuestionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
        isDragging
          ? "shadow-lg border-primary/50 bg-primary/5 z-50"
          : "border-border hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Status Indicators */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isSolved && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
        {isRevision && (
          <Bookmark className="h-4 w-4 text-amber-500 fill-amber-500" />
        )}
      </div>

      {/* Question Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isSolved && "text-muted-foreground"
        )}>
          {question.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground truncate">
            {question.sourceLabel}
          </span>
        </div>
      </div>

      {/* Difficulty Badge */}
      {question.difficulty && (
        <Badge
          variant="outline"
          className={cn(
            "text-xs flex-shrink-0",
            difficultyStyles[question.difficulty] || ""
          )}
        >
          {question.difficulty}
        </Badge>
      )}
    </motion.div>
  );
};

export default SortableQuestionItem;
