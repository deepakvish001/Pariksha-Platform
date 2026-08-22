import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, CheckCircle2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showCheckbox?: boolean;
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
  isSelected = false,
  onSelect,
  showCheckbox = false,
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
        "flex items-center gap-3 p-3 rounded-xl border bg-black/40 backdrop-blur-xl transition-all",
        isDragging
          ? "shadow-lg border-primary/50 bg-primary/10 z-50"
          : "border-white/[0.05] hover:border-white/[0.1] hover:bg-black/50",
        isSelected && "border-primary/50 bg-primary/10"
      )}
    >
      {/* Checkbox for selection */}
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect?.(!!checked)}
          className="flex-shrink-0 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${question.text}`}
        />
      )}

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/[0.05] transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-white/40" />
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
          "text-sm font-medium truncate text-white",
          isSolved && "text-white/60"
        )}>
          {question.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/40 truncate">
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
