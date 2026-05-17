import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Monitor,
  ShieldCheck,
  Smartphone,
  Volume2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CheckState = "passed" | "failed" | "pending" | "skipped";

export interface SummaryCheck {
  id: string;
  label: string;
  state: CheckState;
  detail?: string;
  icon: typeof Monitor;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  durationMin?: number;
  environment: { os: string; browser: string };
  checks: SummaryCheck[];
  starting?: boolean;
  onStart: () => void;
}

const STATE_TONE: Record<CheckState, string> = {
  passed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  skipped: "border-border bg-muted/40 text-muted-foreground",
};

const STATE_ICON: Record<CheckState, typeof CheckCircle2> = {
  passed: CheckCircle2,
  failed: XCircle,
  pending: Loader2,
  skipped: CheckCircle2,
};

const STATE_LABEL: Record<CheckState, string> = {
  passed: "Ready",
  failed: "Action needed",
  pending: "Not yet checked",
  skipped: "Not required",
};

export function PreflightSummaryDialog({
  open,
  onOpenChange,
  title,
  durationMin,
  environment,
  checks,
  starting,
  onStart,
}: Props) {
  const failed = checks.filter((c) => c.state === "failed");
  const pending = checks.filter((c) => c.state === "pending");
  const passed = checks.filter((c) => c.state === "passed");
  const blocking = failed.length + pending.length;
  const canStart = blocking === 0 && !starting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-full grid place-items-center shrink-0",
                blocking === 0
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600",
              )}
            >
              {blocking === 0 ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">Ready to start?</DialogTitle>
              <DialogDescription className="text-xs">
                Review the checks below. Once you start, the timer cannot be paused.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top summary strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-2">
            <div className="text-lg font-bold text-emerald-600 tabular-nums">{passed.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Passed</div>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-2">
            <div className="text-lg font-bold text-amber-600 tabular-nums">{pending.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending</div>
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-2">
            <div className="text-lg font-bold text-destructive tabular-nums">{failed.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Issues</div>
          </div>
        </div>

        {/* Assessment meta */}
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {environment.os} · {environment.browser}
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {durationMin ?? "—"} min
          </div>
        </div>

        {/* Checks list */}
        <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
          {checks.map((c) => {
            const Icon = c.icon;
            const StateIcon = STATE_ICON[c.state];
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  STATE_TONE[c.state],
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{c.label}</div>
                  {c.detail && (
                    <div className="text-[11px] text-muted-foreground truncate">{c.detail}</div>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
                  <StateIcon
                    className={cn("h-3.5 w-3.5", c.state === "pending" && "animate-spin")}
                  />
                  {STATE_LABEL[c.state]}
                </div>
              </motion.li>
            );
          })}
        </ul>

        {blocking > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Resolve {blocking} {blocking === 1 ? "item" : "items"} above before starting. Go back to
            the relevant step to retry.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={starting}>
            Go back
          </Button>
          <Button
            onClick={onStart}
            disabled={!canStart}
            className="font-semibold"
            size="lg"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-1.5" />
            )}
            {starting ? "Starting…" : "Start test now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Re-export icon set for callers building check rows */
export const SUMMARY_ICONS = {
  device: Monitor,
  permissions: ShieldCheck,
  av: Volume2,
  thirdeye: Smartphone,
};
