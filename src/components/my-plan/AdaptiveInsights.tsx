import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown } from "lucide-react";
import type { StudyPlan, PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  plan: StudyPlan;
  tasks: PlanTask[];
}

export const AdaptiveInsights = ({ plan, tasks }: Props) => {
  // Detect topics with skipped or pending overdue tasks
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.status !== "done" && t.day_date < today);
  const overdueByTopic = new Map<string, number>();
  for (const t of overdue) overdueByTopic.set(t.topic, (overdueByTopic.get(t.topic) ?? 0) + 1);
  const weakest = Array.from(overdueByTopic.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <Card className="p-4 sm:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Adaptive insights</h2>
      </div>

      {plan.plan?.summary && (
        <p className="text-sm text-muted-foreground">{plan.plan.summary}</p>
      )}

      {plan.plan?.weak_areas && plan.plan.weak_areas.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus areas</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.plan.weak_areas.map((w) => (
              <Badge key={w} variant="secondary">{w}</Badge>
            ))}
          </div>
        </div>
      )}

      {weakest.length > 0 && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
          <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
            <TrendingDown className="h-3.5 w-3.5" />
            Falling behind on
          </div>
          <ul className="text-xs space-y-0.5">
            {weakest.map(([topic, count]) => (
              <li key={topic}>
                <strong>{topic}</strong> — {count} overdue task{count > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Re-generate the plan to rebalance toward these topics.
          </p>
        </div>
      )}
    </Card>
  );
};
