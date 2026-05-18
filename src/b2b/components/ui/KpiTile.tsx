import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "flat";

export interface KpiTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: { direction: TrendDirection; label: string };
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
  onClick?: () => void;
}

const TONE_RING: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  default: "from-[hsl(var(--primary))]/15 to-transparent",
  success: "from-emerald-400/15 to-transparent",
  warning: "from-amber-400/15 to-transparent",
  danger: "from-rose-400/15 to-transparent",
};

const TONE_ICON: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  default: "text-[hsl(var(--primary))]",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
};

const TREND_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  down: "text-rose-300 bg-rose-500/10 border-rose-500/25",
  flat: "text-muted-foreground bg-white/[0.04] border-white/10",
};

export function KpiTile({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = "default",
  className,
  onClick,
}: KpiTileProps) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 backdrop-blur-xl px-5 py-4 text-left w-full transition-all",
        "hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--card))]/80",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full blur-3xl bg-gradient-to-br opacity-80",
          TONE_RING[tone],
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1.5 text-[28px] leading-none font-semibold tabular-nums text-foreground">
            {value}
          </div>
          {hint && <div className="mt-2 text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
        {Icon && (
          <div
            className={cn(
              "shrink-0 h-9 w-9 rounded-xl grid place-items-center border border-white/10 bg-white/[0.03]",
              TONE_ICON[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {trend && TrendIcon && (
        <div className="relative mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", TREND_COLOR[trend.direction])}>
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </span>
        </div>
      )}
    </Wrapper>
  );
}
