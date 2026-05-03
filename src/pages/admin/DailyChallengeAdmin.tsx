import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminProblems } from "@/hooks/useAdminProblems";
import { useDailyChallengeSchedule, useScheduleDailyChallenge } from "@/hooks/admin/useAdminControl";
import { CalendarClock } from "lucide-react";
import { DailyChallengeReviewCard } from "@/components/admin/DailyChallengeReviewCard";
import { DailyReviewAuditCard } from "@/components/admin/DailyReviewAuditCard";

const days = (n: number) => {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const DailyChallengeAdmin = () => {
  const { data: problems = [] } = useAdminProblems();
  const { data: schedule = [] } = useDailyChallengeSchedule();
  const schedule_ = schedule as Array<{ challenge_date: string; problem_slug: string }>;
  const sched = useScheduleDailyChallenge();
  const [filter, setFilter] = useState("");

  const map = new Map(schedule_.map((s) => [s.challenge_date, s.problem_slug]));
  const filtered = problems.filter((p) =>
    !filter || p.title.toLowerCase().includes(filter.toLowerCase()) || p.slug.includes(filter),
  );

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><CalendarClock className="h-5 w-5" /> Daily Challenge Schedule</h1>
      <p className="mb-4 text-sm text-muted-foreground">Pick the coding problem for each upcoming day.</p>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Next 30 days</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {days(30).map((d) => {
              const slug = map.get(d);
              const problem = problems.find((p) => p.slug === slug);
              return (
                <div key={d} className="rounded-md border border-border/50 p-2 text-xs">
                  <div className="font-mono">{d.slice(5)}</div>
                  <div className="mt-1 truncate text-muted-foreground" title={problem?.title}>
                    {problem?.title ?? <span className="italic">unset</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Assign a problem</h2>
          <Input placeholder="Search problems…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-3" />
          <div className="max-h-[60vh] space-y-2 overflow-auto">
            {filtered.slice(0, 50).map((p) => (
              <div key={p.slug} className="rounded-md border border-border/40 p-2 text-xs">
                <div className="font-medium">{p.title}</div>
                <div className="text-muted-foreground">{p.slug}</div>
                <div className="mt-2 flex gap-1">
                  <Input type="date" id={`date-${p.slug}`} className="h-7 text-xs" min={new Date().toISOString().slice(0,10)} />
                  <Button size="sm" className="h-7"
                    onClick={() => {
                      const el = document.getElementById(`date-${p.slug}`) as HTMLInputElement;
                      if (el?.value) sched.mutate({ date: el.value, slug: p.slug });
                    }}>Set</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DailyChallengeReviewCard />
        <DailyReviewAuditCard />
      </div>
    </AdminShell>
  );
};

export default DailyChallengeAdmin;
