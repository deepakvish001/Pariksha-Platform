import { cn } from "@/lib/utils";
import type { SectionStatus } from "@/lib/admin/problemValidation";

interface TabBadgeProps {
  status: SectionStatus;
  className?: string;
}

const STYLES: Record<SectionStatus, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-destructive",
  empty: "bg-muted-foreground/40",
};

const LABELS: Record<SectionStatus, string> = {
  ok: "Complete",
  warn: "Has warnings",
  error: "Has errors",
  empty: "Not started",
};

export const TabBadge = ({ status, className }: TabBadgeProps) => (
  <span
    aria-label={LABELS[status]}
    title={LABELS[status]}
    className={cn(
      "ml-2 inline-block h-1.5 w-1.5 rounded-full ring-2 ring-background",
      STYLES[status],
      className,
    )}
  />
);
