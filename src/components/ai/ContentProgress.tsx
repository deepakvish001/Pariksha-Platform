import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useContentProgress } from "@/hooks/useContentProgress";
import { useRequireAuth } from "@/hooks/useRequireAuth";

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
  const { requireAuth, user, LoginPromptDialog } = useRequireAuth();
  const { completedItems, toggleItemComplete, isUpdating } = useContentProgress(contentId);
  const isCompleted = completedItems.includes(itemId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          requireAuth(() => toggleItemComplete(itemId), {
            action: "track your progress on this item",
          });
        }}
        disabled={isUpdating}
        aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        className={cn("h-6 w-6 p-0", className)}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
      {LoginPromptDialog}
    </>
  );
};

export const ContentProgressBar = ({
  contentId,
  totalItems,
  className,
}: Omit<ContentProgressProps, "itemId" | "showProgress">) => {
  const { user } = useRequireAuth();
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
