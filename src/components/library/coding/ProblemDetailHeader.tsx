import { CheckCircle2, CircleDot, Circle, Star, Activity, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isSolved: boolean;
  isAttempted: boolean;
  attempts: number;
  solvedAt: string | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const ProblemDetailHeader = ({
  isSolved,
  isAttempted,
  attempts,
  solvedAt,
  isBookmarked,
  onToggleBookmark,
}: Props) => {
  const status = isSolved ? "Solved" : isAttempted ? "Attempted" : "Not started";
  const StatusIcon = isSolved ? CheckCircle2 : isAttempted ? CircleDot : Circle;
  const statusClass = isSolved
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
    : isAttempted
      ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
      : "text-muted-foreground bg-muted/40 border-border";

  return (
    <Card className="p-3 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("gap-1.5 font-medium", statusClass)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            {attempts} {attempts === 1 ? "attempt" : "attempts"}
          </span>
          {solvedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarCheck className="h-3 w-3" />
              Solved {new Date(solvedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={onToggleBookmark}
          className="gap-1.5 h-8"
        >
          <Star className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </Button>
      </div>
    </Card>
  );
};
