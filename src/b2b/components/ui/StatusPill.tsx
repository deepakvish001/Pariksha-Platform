import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type StatusTone = "live" | "scheduled" | "draft" | "closed" | "archived" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<StatusTone, string> = {
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  draft: "bg-white/[0.04] text-muted-foreground border-white/10",
  closed: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  archived: "bg-zinc-700/30 text-zinc-400 border-zinc-500/20",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  neutral: "bg-white/[0.04] text-muted-foreground border-white/10",
};

export function StatusPill({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
