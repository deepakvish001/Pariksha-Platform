import { LucideIcon } from "lucide-react";

export function StatTile({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon?: LucideIcon; hint?: string }) {
  return (
    <div className="b2b-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>}
    </div>
  );
}
