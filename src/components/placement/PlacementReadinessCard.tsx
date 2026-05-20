import { useAuth } from "@/contexts/AuthContext";
import { usePlacementReadiness, useRecomputePRS } from "@/hooks/usePlacementReadiness";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, RefreshCw, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ringColor = (s: number) =>
  s >= 85 ? "text-emerald-500" : s >= 70 ? "text-primary" : s >= 50 ? "text-amber-500" : "text-red-500";

interface Props { compact?: boolean }

export const PlacementReadinessCard = ({ compact = false }: Props) => {
  const { user } = useAuth();
  const { data: prs, isLoading } = usePlacementReadiness(user?.id);
  const recompute = useRecomputePRS();

  if (!user) return null;

  const score = prs?.score ?? 0;
  const level = prs?.level ?? "starter";

  return (
    <Card className="p-4 sm:p-5 space-y-4 border-primary/20">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Placement Readiness</h3>
          <Badge variant="outline" className="capitalize text-[10px]">{level}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
            <RefreshCw className={cn("h-3.5 w-3.5", recompute.isPending && "animate-spin")} />
          </Button>
          {!compact && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/learn/placement-readiness">
                Details <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${score}, 100`} strokeLinecap="round"
              className={ringColor(score)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", ringColor(score))}>{score}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {!prs && !isLoading && (
            <p className="text-xs text-muted-foreground">
              No score yet. Click refresh to compute your readiness.
            </p>
          )}
          {prs && (
            <>
              <SubBar label="DSA" value={prs.dsa_score} />
              <SubBar label="SRS" value={prs.srs_score} />
              <SubBar label="Contests" value={prs.contest_score} />
              <SubBar label="Resume" value={prs.resume_score} />
              <SubBar label="Consistency" value={prs.consistency_score} />
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const SubBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <span className="w-20 text-muted-foreground">{label}</span>
    <Progress value={value} className="h-1.5 flex-1" />
    <span className="w-7 text-right font-mono tabular-nums">{value}</span>
  </div>
);
