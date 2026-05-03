import { Helmet } from "react-helmet-async";
import { useContests, lifecycleStatus } from "@/hooks/useContests";
import { ContestCard } from "@/components/contests/ContestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

const ContestsList = () => {
  const { data: contests, isLoading } = useContests();
  // Only show contests that have moved past draft.
  const visible = (contests ?? []).filter((c) => lifecycleStatus(c) !== "draft");

  const live = visible.filter((c) => {
    const now = Date.now();
    return now >= new Date(c.starts_at).getTime() && now <= new Date(c.ends_at).getTime();
  });
  const upcoming = visible.filter((c) => Date.now() < new Date(c.starts_at).getTime());
  const past = visible.filter((c) => lifecycleStatus(c) === "closed");

  return (
    <>
      <Helmet>
        <title>Coding Contests | Byteskill</title>
        <meta name="description" content="Compete in live coding contests, register, and climb the leaderboard." />
      </Helmet>
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Trophy className="h-3.5 w-3.5" /> Contests
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Coding Contests</h1>
          <p className="text-muted-foreground">Register, solve problems in real time, and compete on the live leaderboard.</p>
        </header>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <>
            <Section title="Live Now" items={live} />
            <Section title="Upcoming" items={upcoming} />
            <Section title="Past Contests" items={past} muted />
          </>
        )}
      </div>
    </>
  );
};

const Section = ({ title, items, muted }: { title: string; items: any[]; muted?: boolean }) => {
  if (items.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className={`text-xl font-semibold ${muted ? "text-muted-foreground" : ""}`}>{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => <ContestCard key={c.id} contest={c} />)}
      </div>
    </section>
  );
};

export default ContestsList;
