import { useMemo } from "react";
import { CheckCircle2, AlertCircle, XCircle, Timer, Layers } from "lucide-react";
import type { JournalEntry } from "../types";

interface Props {
  entries: JournalEntry[];
}

export default function DaySummaryStrip({ entries }: Props) {
  const s = useMemo(() => {
    let solved = 0;
    let partial = 0;
    let stuck = 0;
    let mins = 0;
    const sessions = new Set<string>();
    for (const e of entries) {
      if (e.status === "solved") solved += 1;
      else if (e.status === "partial") partial += 1;
      else if (e.status === "stuck") stuck += 1;
      mins += e.time_taken_min ?? 0;
      if (e.session_label) sessions.add(e.session_label);
    }
    return { solved, partial, stuck, mins, sessions: sessions.size };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border border-border/40 bg-card/30 text-xs">
      <Chip icon={CheckCircle2} value={s.solved} label="solved" color="text-emerald-400" />
      <Chip icon={AlertCircle} value={s.partial} label="partial" color="text-amber-400" />
      <Chip icon={XCircle} value={s.stuck} label="stuck" color="text-rose-400" />
      <span className="text-border">·</span>
      <Chip icon={Timer} value={`${s.mins}m`} label="focus" color="text-sky-400" />
      <Chip icon={Layers} value={s.sessions || 0} label="sessions" color="text-violet-400" />
    </div>
  );
}

function Chip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
