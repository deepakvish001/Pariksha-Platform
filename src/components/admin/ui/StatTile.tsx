import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  tone?: "default" | "primary" | "success" | "danger";
  className?: string;
}

const toneIcon: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-muted/60 text-muted-foreground",
  primary: "bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)]",
  success: "bg-emerald-500/15 text-emerald-500 shadow-[0_0_20px_hsl(142_70%_45%/0.35)]",
  danger: "bg-destructive/15 text-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.35)]",
};

/**
 * Premium stat tile used by overview/health/arena dashboards. Glassmorphic
 * surface, amber-tinted icon chip, monospace number for that ops-tool feel.
 */
export const StatTile = ({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  className,
}: StatTileProps) => (
  <GlassCard interactive className={cn("group/stat", className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        {hint && (
          <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
      {Icon && (
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover/stat:scale-110",
            toneIcon[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  </GlassCard>
);
