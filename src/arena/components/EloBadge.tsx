import { cn } from "@/lib/utils";
import { eloRank } from "../elo";

export function EloBadge({ elo, className }: { elo: number; className?: string }) {
  const r = eloRank(elo);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
        "border bg-card/60 backdrop-blur",
        className,
      )}
      style={{ color: r.color, borderColor: `${r.color}55`, boxShadow: `0 0 12px ${r.color}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 6px ${r.color}` }} />
      {r.name} · {elo}
    </span>
  );
}
