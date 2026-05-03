import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldOff, Maximize2, Camera, AlertTriangle } from "lucide-react";
import { useContestSecureMode } from "@/hooks/useContestSecureMode";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { toast } from "sonner";

interface Props {
  contestId: string;
  contestSlug: string;
}

type Status = "loading" | "active" | "missing" | "ended";

/**
 * Floating Secure Mode HUD for the problem-solving page. Shows the live
 * session state (active / missing / ended) and the next action to take.
 */
export default function SecureProblemHUD({ contestId, contestSlug }: Props) {
  const navigate = useNavigate();
  const secure = useContestSecureMode(contestId, true);
  const active = useActiveContestSession(contestId);

  const status: Status = useMemo(() => {
    if (active.loading) return "loading";
    if (active.invalidatedJustNow) return "ended";
    if (active.hasActive) return "active";
    return "missing";
  }, [active.loading, active.hasActive, active.invalidatedJustNow]);

  useEffect(() => {
    if (status === "ended") {
      toast.error("Secure session ended", { description: "Returning to the contest page." });
      const t = window.setTimeout(() => navigate(`/contests/${contestSlug}`), 1500);
      return () => window.clearTimeout(t);
    }
  }, [status, contestSlug, navigate]);

  if (status === "loading") return null;

  const tone = {
    active: "border-emerald-500/30 bg-emerald-500/5",
    missing: "border-amber-500/30 bg-amber-500/5",
    ended: "border-red-500/40 bg-red-500/5",
  }[status];

  const Icon = status === "active" ? ShieldCheck : status === "missing" ? ShieldAlert : ShieldOff;
  const iconTone =
    status === "active" ? "text-emerald-300" : status === "missing" ? "text-amber-300" : "text-red-300";

  const headline =
    status === "active" ? "Secure session active"
    : status === "missing" ? "No active secure session"
    : "Secure session ended";

  const nextAction =
    status === "active"
      ? secure.fullscreen
        ? "Stay in this tab — submissions are enabled."
        : "Re-enter fullscreen to keep your session in good standing."
      : status === "missing"
      ? "Open the contest page and press Start Secure Session."
      : "Reload from the contest page to start a new session.";

  const violationsLeft = Math.max(0, 5 - secure.violationCount);

  return (
    <Card className={`p-2.5 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${iconTone}`} />
          <div className="min-w-0">
            <div className="text-xs font-medium">{headline}</div>
            <div className="truncate text-[11px] text-muted-foreground">{nextAction}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {status === "active" && (
            <>
              <Badge variant="outline" className={secure.fullscreen ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
                <Maximize2 className="mr-1 h-3 w-3" /> {secure.fullscreen ? "Fullscreen" : "Windowed"}
              </Badge>
              <Badge variant="outline" className={secure.webcamReady ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
                <Camera className="mr-1 h-3 w-3" /> {secure.webcamReady ? "Proctor" : "No webcam"}
              </Badge>
              <Badge variant="outline" className={secure.flagged ? "border-red-400/50 text-red-300" : "border-border"}>
                <AlertTriangle className="mr-1 h-3 w-3" /> {secure.violationCount}/5 · {violationsLeft} left
              </Badge>
              {!secure.fullscreen && (
                <Button size="sm" variant="outline" onClick={secure.enterFullscreen}>
                  Re-enter fullscreen
                </Button>
              )}
            </>
          )}
          {status !== "active" && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/contests/${contestSlug}`)}>
              Back to contest
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
