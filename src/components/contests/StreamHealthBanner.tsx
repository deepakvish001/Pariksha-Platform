import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Camera, Monitor } from "lucide-react";

interface Props {
  webcamHealthy: boolean;
  screenHealthy: boolean;
  graceUntil: number | null;
  onReshareScreen: () => void;
  onReshareWebcam: () => void;
}

/**
 * Persistent red banner shown in the contest kiosk when webcam or screen
 * stream health is degraded. Counts down a 30s grace before auto-DQ and
 * exposes Reshare buttons. While unhealthy, the editor is forced read-only
 * by the parent — see CodingProblemDetail's `streamHealthy` plumbing.
 */
export function StreamHealthBanner({
  webcamHealthy,
  screenHealthy,
  graceUntil,
  onReshareScreen,
  onReshareWebcam,
}: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const allHealthy = webcamHealthy && screenHealthy;
  if (allHealthy) return null;

  const remaining = graceUntil ? Math.max(0, Math.ceil((graceUntil - now) / 1000)) : null;

  return (
    <div className="border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-destructive-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="font-medium text-destructive">
          {!screenHealthy && !webcamHealthy
            ? "Webcam and screen sharing stopped"
            : !screenHealthy
              ? "Screen sharing stopped"
              : "Webcam stopped"}
        </span>
        {remaining !== null && (
          <span className="text-destructive">
            — auto-disqualification in <strong>{remaining}s</strong>
          </span>
        )}
        <span className="ml-auto flex flex-wrap gap-2">
          {!screenHealthy && (
            <Button size="sm" variant="outline" onClick={onReshareScreen}>
              <Monitor className="mr-1 h-3 w-3" /> Reshare screen
            </Button>
          )}
          {!webcamHealthy && (
            <Button size="sm" variant="outline" onClick={onReshareWebcam}>
              <Camera className="mr-1 h-3 w-3" /> Re-grant webcam
            </Button>
          )}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        The editor is read-only and submissions are blocked until both streams resume.
      </p>
    </div>
  );
}
