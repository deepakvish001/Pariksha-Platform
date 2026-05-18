import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 backdrop-blur-xl",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[hsl(var(--border))]/40">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="shrink-0 h-8 w-8 rounded-lg grid place-items-center border border-white/10 bg-white/[0.03] text-[hsl(var(--primary))]">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>}
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
