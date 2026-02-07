import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useContentProgress } from "@/hooks/useContentProgress";
import { useAuth } from "@/contexts/AuthContext";

interface ContentProgressProps {
  contentId: string;
  itemId: string;
  showProgress?: boolean;
  totalItems?: number;
  className?: string;
}

export const ContentProgressCheckbox = ({
  contentId,
  itemId,
  className,
}: Omit<ContentProgressProps, "showProgress" | "totalItems">) => {
  const { user } = useAuth();
  const { completedItems, toggleItemComplete, isUpdating } = useContentProgress(contentId);
  const isCompleted = completedItems.includes(itemId);

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleItemComplete(itemId);
      }}
      disabled={isUpdating}
      className={cn("h-6 w-6 p-0", className)}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
};

export const ContentProgressBar = ({
  contentId,
  totalItems,
  className,
}: Omit<ContentProgressProps, "itemId" | "showProgress">) => {
  const { user } = useAuth();
  const { completedItems } = useContentProgress(contentId);

  if (!user || !totalItems) return null;

  const progress = (completedItems.length / totalItems) * 100;

  return (
    <div className={cn("space-y-1", className)}>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {completedItems.length}/{totalItems} completed
      </p>
    </div>
  );
};
