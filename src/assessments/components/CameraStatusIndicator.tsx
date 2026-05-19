import { Camera, CameraOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type CameraMode = "selfie" | "proctoring" | "off";

interface Props {
  mode: CameraMode;
  active: boolean;
  className?: string;
  compact?: boolean;
}

const LABELS: Record<CameraMode, string> = {
  selfie: "Selfie",
  proctoring: "Proctoring",
  off: "Camera",
};

const TOOLTIPS: Record<CameraMode, { on: string; off: string }> = {
  selfie: {
    on: "Selfie camera is active — capturing your identity photo.",
    off: "Selfie camera is off.",
  },
  proctoring: {
    on: "Proctoring camera is active for the duration of the test.",
    off: "Proctoring camera is off.",
  },
  off: {
    on: "Camera is active.",
    off: "Camera is off.",
  },
};

/**
 * Compact status chip that tells the candidate which camera is currently
 * active (selfie capture vs. proctoring) and when it has been released.
 */
export function CameraStatusIndicator({ mode, active, className, compact = false }: Props) {
  const Icon = active ? (mode === "proctoring" ? ShieldCheck : Camera) : CameraOff;
  const label = active ? `${LABELS[mode]} · On` : `${LABELS[mode === "off" ? "off" : mode]} · Off`;
  const tip = active ? TOOLTIPS[mode].on : TOOLTIPS[mode].off;

  const tone = active
    ? mode === "proctoring"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-border bg-muted/60 text-muted-foreground";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border h-7 px-2 text-[11px] font-medium",
              tone,
              className,
            )}
            role="status"
            aria-live="polite"
            aria-label={label}
          >
            <span className="relative inline-flex h-1.5 w-1.5">
              {active && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                    mode === "proctoring" ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex h-1.5 w-1.5 rounded-full",
                  active
                    ? mode === "proctoring"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                    : "bg-muted-foreground/60",
                )}
              />
            </span>
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CameraStatusIndicator;
