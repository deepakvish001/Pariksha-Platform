import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  /** Optional small label above the title (e.g. "Overview"). */
  eyebrow?: string;
  /** The main title. Last word is highlighted with the amber gradient. */
  title: string;
  /** Optional subtitle / description shown under the title. */
  description?: string;
  /** Pill-shaped chips rendered under the description. */
  chips?: { label: string; tone?: "default" | "primary" | "success" | "danger" }[];
  /** Action buttons rendered on the right side of the header. */
  actions?: ReactNode;
  className?: string;
}

const toneClasses: Record<NonNullable<AdminPageHeaderProps["chips"]>[number]["tone"] & string, string> = {
  default: "border-border/60 bg-card/40 text-muted-foreground",
  primary: "border-primary/40 bg-primary/10 text-primary",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
};

/**
 * Reusable hero header for admin pages — keeps spacing, gradient accent and
 * pill chip styling consistent across the entire admin portal.
 */
export const AdminPageHeader = ({
  eyebrow,
  title,
  description,
  chips,
  actions,
  className,
}: AdminPageHeaderProps) => {
  // Highlight the last word of the title with the amber gradient.
  const words = title.trim().split(" ");
  const accent = words.pop() ?? "";
  const lead = words.join(" ");

  return (
    <header
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-md sm:p-6",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.4)_inset,0_24px_60px_-30px_hsl(24_95%_53%/0.35)]",
        className,
      )}
    >
      {/* Decorative gradient corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(24_95%_53%/0.25),transparent_60%)] blur-2xl"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {lead && <span className="text-foreground">{lead} </span>}
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
              {accent}
            </span>
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
          {chips && chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                    toneClasses[c.tone ?? "default"],
                  )}
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
