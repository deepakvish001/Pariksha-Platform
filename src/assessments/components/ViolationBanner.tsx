import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  violations: number;
  max: number;
  fullscreenLost: boolean;
  onReturnFullscreen: () => void;
}

/**
 * Persistent strike counter (top of viewport) plus a blocking modal
 * when the candidate exits fullscreen.
 */
export function ViolationBanner({ violations, max, fullscreenLost, onReturnFullscreen }: Props) {
  const remaining = Math.max(0, max - violations);
  const show = violations > 0;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-[55]"
          >
            <div
              className={
                "rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg border flex items-center gap-2 " +
                (remaining <= 1
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-amber-500/95 text-white border-amber-600")
              }
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                Violation {violations} of {max}
                {remaining > 0 ? ` — ${remaining} left before auto-submit` : " — auto-submitting"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fullscreenLost && (
        <div className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-sm grid place-items-center p-4">
          <div className="max-w-sm w-full rounded-xl border border-destructive/40 bg-card shadow-2xl p-6 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 grid place-items-center">
              <Maximize2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-base font-bold">Fullscreen required</h2>
            <p className="text-xs text-muted-foreground">
              You exited fullscreen. Return to continue your assessment.
              This was counted as a violation.
            </p>
            <Button onClick={onReturnFullscreen} className="w-full">
              <Maximize2 className="h-4 w-4 mr-2" />
              Return to fullscreen
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
