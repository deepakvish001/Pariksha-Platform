import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus, Info, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";
import { getNextRecommendation, type RecommendationMode } from "@/lib/adaptive/rerank";

interface Props {
  tasks: PlanTask[];
  onStart: (task: PlanTask) => void;
  mode: RecommendationMode;
  onModeChange: (mode: RecommendationMode) => void;
}

const diffClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500"
  : d === "hard" ? "bg-red-500/15 text-red-500"
  : "bg-amber-500/15 text-amber-500";

export const AIRecommendations = ({ tasks, onStart, mode, onModeChange }: Props) => {
  const top = useMemo(() => getNextRecommendation(tasks, mode), [tasks, mode]);

  const nextThree = useMemo(() => {
    const result: ReturnType<typeof getNextRecommendation>[] = [];
    let pool = tasks;
    for (let i = 0; i < 3; i++) {
      const rec = getNextRecommendation(pool, mode);
      if (!rec) break;
      result.push(rec);
      pool = pool.filter((t) => t.id !== rec.task.id);
    }
    return result.filter((x): x is NonNullable<typeof x> => !!x);
  }, [tasks, mode]);

  const ModeToggle = (
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
      <Lock className={cn("h-3 w-3", mode === "fixed" ? "text-primary" : "text-muted-foreground")} />
      <Label htmlFor="adaptive-toggle" className="text-xs cursor-pointer select-none">
        {mode === "adaptive" ? "Adaptive" : "Fixed"}
      </Label>
      <Switch
        id="adaptive-toggle"
        checked={mode === "adaptive"}
        onCheckedChange={(c) => onModeChange(c ? "adaptive" : "fixed")}
        aria-label="Toggle adaptive difficulty"
      />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="What does adaptive mode do?"
            className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Info className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-64 text-xs space-y-1.5">
          <p className="font-semibold text-sm">Recommendation mode</p>
          <p className="text-muted-foreground">
            <strong>Adaptive:</strong> next task adjusts ±1 difficulty based on your last attempt's
            score (≥80% bumps up, ≤40% or skipped eases down).
          </p>
          <p className="text-muted-foreground">
            <strong>Fixed:</strong> follows your plan in scheduled order without changing difficulty.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!top) {
    return (
      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">AI recommendations</h2>
          </div>
          {ModeToggle}
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">AI recommendations</h2>
        </div>
        {ModeToggle}
      </div>
      <p className="text-xs text-muted-foreground">{top.reason}</p>

      <div className="space-y-2">
        {nextThree.map((rec, i) => {
          const RecDelta = rec.difficultyDelta > 0 ? ArrowUpRight : rec.difficultyDelta < 0 ? ArrowDownRight : Minus;
          return (
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Why "${rec.task.title}" was recommended`}
                          className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-72 text-xs space-y-2">
                        <p className="font-semibold text-sm">Why this pick?</p>
                        <p className="text-muted-foreground">{rec.reason}</p>
                        <div className="border-t pt-2 space-y-1 text-[11px] text-muted-foreground">
                          <div>Topic: <span className="font-medium text-foreground">{rec.task.topic}</span></div>
                          <div>Difficulty: <span className="font-medium text-foreground capitalize">{rec.task.difficulty}</span></div>
                          <div>
                            Adjustment:{" "}
                            <span className="font-medium text-foreground">
                              {mode === "fixed"
                                ? "none (fixed mode)"
                                : rec.difficultyDelta > 0
                                ? "+1 step harder"
                                : rec.difficultyDelta < 0
                                ? "-1 step easier"
                                : "no change"}
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{rec.task.topic}</Badge>
                    <Badge variant="outline" className={cn("text-xs", diffClass(rec.task.difficulty))}>
                      {rec.task.difficulty}
                    </Badge>
                    <span className={cn("text-xs flex items-center gap-0.5", deltaColor)}>
                      <RecDelta className="h-3 w-3" />
                      {mode === "fixed"
                        ? "fixed"
                        : rec.difficultyDelta > 0
                        ? "+1"
                        : rec.difficultyDelta < 0
                        ? "-1"
                        : "0"}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant={i === 0 ? "default" : "outline"} onClick={() => onStart(rec.task)}>
                  Start
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
