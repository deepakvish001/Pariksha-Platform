import { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const KEY = "dsa-tracker:goals:v1";

interface Goals {
  daily: number;
  weekly: number;
}

const readGoals = (): Goals => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { daily: 3, weekly: 15, ...JSON.parse(raw) };
  } catch {}
  return { daily: 3, weekly: 15 };
};

interface Props {
  todayCount: number;
  weekCount: number;
}

export default function GoalsRing({ todayCount, weekCount }: Props) {
  const [goals, setGoals] = useState<Goals>({ daily: 3, weekly: 15 });
  const [edit, setEdit] = useState(false);

  useEffect(() => setGoals(readGoals()), []);

  const save = (g: Goals) => {
    setGoals(g);
    try {
      localStorage.setItem(KEY, JSON.stringify(g));
    } catch {}
  };

  const dailyPct = Math.min(100, Math.round((todayCount / Math.max(1, goals.daily)) * 100));
  const weeklyPct = Math.min(100, Math.round((weekCount / Math.max(1, goals.weekly)) * 100));

  // Weekly pace expectation: by day-of-week (1..7) you should have ~(dow/7)*weekly
  const dow = ((new Date().getDay() + 6) % 7) + 1; // Mon=1..Sun=7
  const paceExpected = (dow / 7) * goals.weekly;
  let paceLabel = "On pace";
  let paceColor = "text-sky-400 bg-sky-500/10 border-sky-500/30";
  if (weekCount >= goals.weekly) {
    paceLabel = "Goal hit ✨";
    paceColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  } else if (weekCount < paceExpected - 1) {
    paceLabel = "Behind";
    paceColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else if (weekCount > paceExpected + 1) {
    paceLabel = "Ahead";
    paceColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Daily & weekly goals</div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border ${paceColor}`}>
            {paceLabel}
          </span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEdit((e) => !e)}>
            {edit ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Ring
          label="Today"
          value={todayCount}
          goal={goals.daily}
          pct={dailyPct}
          color="hsl(var(--primary))"
        />
        <Ring
          label="This week"
          value={weekCount}
          goal={goals.weekly}
          pct={weeklyPct}
          color="#10b981"
        />
      </div>

      {edit && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted-foreground">
            Daily goal
            <Input
              type="number"
              min={1}
              max={50}
              value={goals.daily}
              onChange={(e) => save({ ...goals, daily: Math.max(1, +e.target.value || 1) })}
              className="h-8 mt-1"
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Weekly goal
            <Input
              type="number"
              min={1}
              max={200}
              value={goals.weekly}
              onChange={(e) => save({ ...goals, weekly: Math.max(1, +e.target.value || 1) })}
              className="h-8 mt-1"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Ring({
  label,
  value,
  goal,
  pct,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  pct: number;
  color: string;
}) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <svg width="78" height="78" viewBox="0 0 78 78" className="shrink-0">
        <circle cx="39" cy="39" r={r} stroke="hsl(var(--border))" strokeWidth="6" fill="none" opacity={0.4} />
        <circle
          cx="39"
          cy="39"
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 39 39)"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <text
          x="39"
          y="43"
          textAnchor="middle"
          className="fill-foreground"
          fontSize="14"
          fontWeight={600}
        >
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold leading-tight">
          {value}
          <span className="text-xs text-muted-foreground"> / {goal}</span>
        </div>
      </div>
    </div>
  );
}
