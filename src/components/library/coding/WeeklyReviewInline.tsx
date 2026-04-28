import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pickProblemForDate, toDateKey } from "@/hooks/useDailyChallenge";

interface Props {
  /** YYYY-MM-DD strings of completed days */
  completedDates: Set<string>;
  className?: string;
  /** Show the "View full week" link to the standalone page */
  showFullLink?: boolean;
}

const buildLastNDays = (n: number) => {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
};

const dayLabel = (key: string, idx: number) => {
  if (idx === 0) return "Today";
  if (idx === 1) return "Yest.";
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

export const WeeklyReviewInline = ({ completedDates, className, showFullLink = true }: Props) => {
  const days = buildLastNDays(7);
  const completedCount = days.filter((d) => completedDates.has(d)).length;

  return (
    <Card className={cn("p-3 sm:p-4 mb-4", className)}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold truncate">This week</h3>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {completedCount}/7 done
          </span>
        </div>
        {showFullLink && (
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1">
            <Link to="/library/problems/weekly">
              Full review
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((key, idx) => {
          const done = completedDates.has(key);
          const problem = pickProblemForDate(key);
          return (
            <li key={key}>
              <Link
                to={`/library/problems/${problem.slug}`}
                title={`${dayLabel(key, idx)} • ${problem.title}${done ? " • completed" : ""}`}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 transition-colors",
                  done
                    ? "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40",
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {dayLabel(key, idx)}
                </span>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};
