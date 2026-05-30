import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  count?: number | string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent H2 used inside admin pages to lead a section of cards or
 * tables. Mirrors the amber accent of AdminPageHeader at a smaller scale.
 */
export const SectionHeader = ({
  icon: Icon,
  title,
  count,
  description,
  actions,
  className,
}: SectionHeaderProps) => (
  <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {count !== undefined && count !== null && (
          <span className="rounded-full border border-border/50 bg-card/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
