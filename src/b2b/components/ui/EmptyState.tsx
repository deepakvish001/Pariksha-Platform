import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/30 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="h-12 w-12 rounded-full grid place-items-center bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/25">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
