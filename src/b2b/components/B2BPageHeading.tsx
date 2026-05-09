import { ReactNode } from "react";
import { amberGradientText } from "./B2BBackdrop";

/**
 * Standardized in-app page heading for Parikshaa for Teams pages.
 * Matches the landing-page hero typography scale and amber gradient accent.
 */
export function B2BPageHeading({
  eyebrow,
  title,
  accent,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Optional substring rendered with the amber gradient. */
  accent?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
          {title}
          {accent && (
            <>
              {" "}
              <span className={amberGradientText}>{accent}</span>
            </>
          )}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
