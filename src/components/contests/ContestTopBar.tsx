import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Timer, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  contestTitle: string;
  contestSlug: string;
  endsAt: string;
  problemSlug: string;
  onSubmit: () => void;
  onTimeUp: () => void;
  submitDisabled: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const fmt = (sec: number) => {
  if (sec <= 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Slim top bar that replaces the dashboard header inside contest kiosk mode.
 * Shows the live countdown to contest end, a permanent Submit button and
 * a guarded Exit action.
 */
export function ContestTopBar({
  contestTitle, contestSlug, endsAt, problemSlug,
  onSubmit, onTimeUp, submitDisabled, submitLabel = "Submit", isSubmitting,
}: Props) {
  const endsAtMs = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));
  const firedRef = useState({ fired: false })[0];
  useEffect(() => {
    if (remaining <= 0 && !firedRef.fired) {
      firedRef.fired = true;
      onTimeUp();
    }
  }, [remaining, onTimeUp, firedRef]);

  const tone =
    remaining <= 60 ? "border-red-400/50 text-red-300"
    : remaining <= 300 ? "border-amber-400/40 text-amber-300"
    : "border-emerald-400/40 text-emerald-300";

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b border-border/40 bg-background/95 px-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
        <span className="truncate text-sm font-medium">{contestTitle}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">·</span>
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">{problemSlug}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${tone} font-mono`}>
          <Timer className="mr-1 h-3 w-3" /> {fmt(remaining)}
        </Badge>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={submitDisabled || isSubmitting}
          title={submitDisabled ? "Submission paused — secure session not ready" : "Submit solution"}
        >
          {isSubmitting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
          {submitLabel}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" title="Exit contest">
              <LogOut className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave contest?</AlertDialogTitle>
              <AlertDialogDescription>
                Leaving the secure window before the contest ends counts as a violation
                and your last in-progress code may not be saved. The contest keeps
                running on the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link to={`/contests/${contestSlug}`}>Leave anyway</Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
