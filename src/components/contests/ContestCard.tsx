import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContestClock } from "@/hooks/useContestClock";
import { Clock, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contest } from "@/hooks/useContests";

export const ContestCard = ({ contest }: { contest: Contest }) => {
  const clock = useContestClock(contest.starts_at, contest.ends_at);
  const phaseColor =
    clock.phase === "live"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : clock.phase === "upcoming"
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-muted text-muted-foreground border-border";

  return (
    <Link to={`/contests/${contest.slug}`}>
      <Card className="group relative overflow-hidden border-white/10 bg-card/40 backdrop-blur transition hover:border-primary/40 hover:bg-card/60">
        {contest.banner_url && (
          <div
            className="h-32 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${contest.banner_url})` }}
          />
        )}
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("uppercase tracking-wide", phaseColor)}>
              {clock.phase}
            </Badge>
            <Badge variant="outline" className="capitalize">{contest.scoring_mode}</Badge>
          </div>
          <h3 className="text-lg font-semibold leading-tight">{contest.title}</h3>
          {contest.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{contest.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {clock.label}</span>
            {contest.max_participants && (
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> max {contest.max_participants}</span>
            )}
            <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {contest.penalty_minutes}m penalty</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
