import { Check, CloudOff, Cloud, Loader2 } from "lucide-react";
import type { DraftSaveStatus } from "@/hooks/useCodeDraft";
import { cn } from "@/lib/utils";

interface DraftSaveIndicatorProps {
  status: DraftSaveStatus;
  lastSavedAt: number | null;
  /** When false (no auth), we show a friendly local-only hint instead. */
  isAuthenticated: boolean;
  className?: string;
}

const formatRelative = (ts: number) => {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
};

export const DraftSaveIndicator = ({
  status,
  lastSavedAt,
  isAuthenticated,
  className,
}: DraftSaveIndicatorProps) => {
  if (!isAuthenticated) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] text-muted-foreground",
          className,
        )}
        title="Sign in to sync drafts across devices"
      >
        <CloudOff className="h-3 w-3" />
        Local only
      </span>
    );
  }

  if (status === "saving" || status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-destructive", className)}>
        <CloudOff className="h-3 w-3" />
        Save failed
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
        <Check className="h-3 w-3 text-emerald-500" />
        Saved {formatRelative(lastSavedAt)}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
      <Cloud className="h-3 w-3" />
      Draft synced
    </span>
  );
};
