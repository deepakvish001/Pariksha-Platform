import { Check, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  key: string;
  label: string;
  icon?: LucideIcon;
}

export function StepperHeader({
  steps,
  currentKey,
  className,
}: {
  steps: Step[];
  currentKey: string;
  className?: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey),
  );
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Track */}
        <div className="absolute left-0 right-0 top-4 h-px bg-[hsl(var(--border))]/60" />
        <div
          className="absolute left-0 top-4 h-px bg-gradient-to-r from-[hsl(var(--primary))] to-amber-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />

        <ol className="relative flex items-start justify-between gap-2">
          {steps.map((s, idx) => {
            const done = idx < currentIndex;
            const active = idx === currentIndex;
            const Icon = s.icon;
            return (
              <li key={s.key} className="flex flex-col items-center gap-2 text-center min-w-0 flex-1">
                <div
                  className={cn(
                    "relative z-10 h-8 w-8 rounded-full grid place-items-center border-2 text-xs font-semibold transition-all",
                    done
                      ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : active
                      ? "bg-[hsl(var(--background))] border-[hsl(var(--primary))] text-[hsl(var(--primary))] shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                      : "bg-[hsl(var(--background))] border-[hsl(var(--border))]/60 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : Icon ? <Icon className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <div
                  className={cn(
                    "text-[11px] font-medium leading-tight truncate max-w-[120px]",
                    active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {s.label}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
