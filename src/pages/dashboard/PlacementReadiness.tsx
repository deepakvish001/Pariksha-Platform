import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { usePlacementReadiness, useRecomputePRS } from "@/hooks/usePlacementReadiness";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, RefreshCw, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ringColor = (s: number) =>
  s >= 85 ? "text-emerald-500" : s >= 70 ? "text-primary" : s >= 50 ? "text-amber-500" : "text-red-500";

const tips = (prs: any) => {
  if (!prs) return [];
  const out: string[] = [];
  if (prs.dsa_score < 60) out.push("Practice 10–15 more DSA problems this week to lift your DSA score.");
  if (prs.srs_score < 60) out.push("Review your due SRS flashcards daily — mastery boosts retention.");
  if (prs.contest_score < 60) out.push("Join the next weekly contest; even one submission improves the signal.");
  if (prs.resume_score < 70) out.push("Run your latest resume through the AI Analyser and apply top suggestions.");
  if (prs.consistency_score < 60) out.push("Aim for a 7-day streak — consistency is the single biggest unlock.");
  return out.slice(0, 4);
};

const PlacementReadiness = () => {
  const { user } = useAuth();
  const { data: prs, isLoading } = usePlacementReadiness(user?.id);
  const recompute = useRecomputePRS();

  const score = prs?.score ?? 0;
  const signals = prs?.breakdown?.signals ?? {};

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Helmet>
        <title>Placement Readiness Score | Parikshaa</title>
        <meta name="description" content="Your single 0–100 placement readiness score with full breakdown across DSA, SRS, contests, resume, and consistency." />
      </Helmet>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Placement Readiness Score</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A single number that tells you how close you are to cracking your next placement.
        </p>
      </header>

      <Card className="p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-36 w-36 shrink-0">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={`${score}, 100`} strokeLinecap="round"
                className={ringColor(score)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-black", ringColor(score))}>{score}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
            <Badge variant="outline" className="capitalize">{prs?.level ?? (isLoading ? "loading" : "not yet computed")}</Badge>
            <p className="text-sm text-muted-foreground">
              {prs?.computed_at
                ? `Last computed ${new Date(prs.computed_at).toLocaleString()}`
                : "Run your first computation to see your score."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
              <Button onClick={() => recompute.mutate()} disabled={recompute.isPending}>
                <RefreshCw className={cn("mr-2 h-4 w-4", recompute.isPending && "animate-spin")} />
                {recompute.isPending ? "Computing…" : "Recompute now"}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/learn/target-company"><Target className="mr-2 h-4 w-4" /> Set target company</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {prs && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Breakdown label="DSA mastery" value={prs.dsa_score} weight="30%"
            sub={`${signals.quizzes ?? 0} quizzes attempted`} />
          <Breakdown label="SRS retention" value={prs.srs_score} weight="15%"
            sub={`${signals.srs_mastered ?? 0} / ${signals.srs_cards ?? 0} cards mastered`} />
          <Breakdown label="Contest performance" value={prs.contest_score} weight="25%"
            sub={`${signals.contest_accepted ?? 0} accepted of ${signals.contest_submissions ?? 0} submissions`} />
          <Breakdown label="Resume score" value={prs.resume_score} weight="15%"
            sub={signals.resume_overall ? `Latest analysis: ${signals.resume_overall}/100` : "No resume analysed yet"} />
          <Breakdown label="Consistency" value={prs.consistency_score} weight="15%"
            sub={`Streak ${signals.current_streak ?? 0} (longest ${signals.longest_streak ?? 0})`} />
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">How to lift your score</h3></div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {tips(prs).map((t) => <li key={t}>{t}</li>)}
              {tips(prs).length === 0 && <li>You're in great shape — keep the streak going.</li>}
            </ul>
          </Card>
        </div>
      )}
    </main>
  );
};

const Breakdown = ({ label, value, weight, sub }: { label: string; value: number; weight: string; sub: string }) => (
  <Card className="p-4 space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{label}</h3>
      <Badge variant="secondary" className="text-[10px]">weight {weight}</Badge>
    </div>
    <div className="flex items-center gap-3">
      <Progress value={value} className="flex-1 h-2" />
      <span className={cn("font-mono text-sm font-bold tabular-nums w-10 text-right", ringColor(value))}>{value}</span>
    </div>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </Card>
);

export default PlacementReadiness;
