import { CheckCircle2, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface DailyChallengeSyncStatusProps {
  status: SyncStatus;
  error?: string | null;
  lastSyncedAt?: Date | null;
  signedIn: boolean;
  onRetry?: () => void;
  className?: string;
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/**
 * Compact, accessible status pill telling the user whether their daily-challenge
 * "done" action is being synced, has been recorded, or failed.
 */
export const DailyChallengeSyncStatus = ({
  status,
  error,
  lastSyncedAt,
  signedIn,
  onRetry,
  className,
}: DailyChallengeSyncStatusProps) => {
  if (!signedIn) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-600 dark:text-amber-400",
          className,
        )}
      >
        <CloudOff className="h-3.5 w-3.5" />
        Saved on this device only — sign in to sync across devices.
      </div>
    );
  }

  if (status === "syncing") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Syncing your daily challenge…
      </div>
    );
  }

  if (status === "error" || status === "offline") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive",
          className,
        )}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">
          {status === "offline"
            ? "You're offline — your action is saved locally and will sync when you're back online."
            : `Sync failed: ${error ?? "please try again."} Your action is saved locally.`}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto rounded border border-destructive/40 px-1.5 py-0.5 text-[10px] font-medium hover:bg-destructive/20"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (status === "synced") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400",
          className,
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Synced{lastSyncedAt ? ` at ${formatTime(lastSyncedAt)}` : ""} — recorded on the cloud.
      </div>
    );
  }

  return null;
};
