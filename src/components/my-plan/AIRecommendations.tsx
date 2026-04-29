import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";
import { getNextRecommendation } from "@/lib/adaptive/rerank";

interface Props {
  tasks: PlanTask[];
  onStart: (task: PlanTask) => void;
}

const diffClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500"
  : d === "hard" ? "bg-red-500/15 text-red-500"
  : "bg-amber-500/15 text-amber-500";

export const AIRecommendations = ({ tasks, onStart }: Props) => {
  const top = useMemo(() => getNextRecommendation(tasks), [tasks]);

  // Build next 3 recommendations by re-running over remaining pending pool minus chosen
  const nextThree = useMemo(() => {
    const result: ReturnType<typeof getNextRecommendation>[] = [];
    let pool = tasks;
    for (let i = 0; i < 3; i++) {
      const rec = getNextRecommendation(pool);
      if (!rec) break;
      result.push(rec);
      pool = pool.filter((t) => t.id !== rec.task.id);
    }
    return result.filter((x): x is NonNullable<typeof x> => !!x);
  }, [tasks]);

  if (!top) {
    return (
      <Card className="p-4 sm:p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">AI recommendations</h2>
        </div>
        <p className="text-sm text-muted-foreground">No pending tasks — generate or extend your plan to get suggestions.</p>
      </Card>
    );
  }

  const DeltaIcon = top.difficultyDelta > 0 ? ArrowUpRight : top.difficultyDelta < 0 ? ArrowDownRight : Minus;
  const deltaColor =
    top.difficultyDelta > 0 ? "text-green-500"
    : top.difficultyDelta < 0 ? "text-amber-500"
    : "text-muted-foreground";

  return (
    <Card className="p-4 sm:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">AI recommendations</h2>
      </div>
      <p className="text-xs text-muted-foreground">{top.reason}</p>

      <div className="space-y-2">
        {nextThree.map((rec, i) => (
          <div
            key={rec.task.id}
            className={cn(
              "rounded-lg border p-3 space-y-2",
              i === 0 ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {i === 0 && <Badge variant="default" className="text-[10px] h-4">Next</Badge>}
                  <span className="font-medium text-sm">{rec.task.title}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{rec.task.topic}</Badge>
                  <Badge variant="outline" className={cn("text-xs", diffClass(rec.task.difficulty))}>
                    {rec.task.difficulty}
                  </Badge>
                  <span className={cn("text-xs flex items-center gap-0.5", deltaColor)}>
                    <DeltaIcon className="h-3 w-3" />
                    {rec.difficultyDelta > 0 ? "+1" : rec.difficultyDelta < 0 ? "-1" : "0"}
                  </span>
                </div>
              </div>
              <Button size="sm" variant={i === 0 ? "default" : "outline"} onClick={() => onStart(rec.task)}>
                Start
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
