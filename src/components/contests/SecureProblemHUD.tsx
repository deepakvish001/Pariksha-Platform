import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldOff, Maximize2, Camera, AlertTriangle, Wifi, WifiOff, Loader2, Timer } from "lucide-react";
import { useContestSecureMode } from "@/hooks/useContestSecureMode";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useContestTrustScore } from "@/hooks/useContestTrustScore";
import { useDevtoolsDetector } from "@/hooks/useDevtoolsDetector";
import { useFetchInterceptor } from "@/hooks/useFetchInterceptor";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import { useIdentityRecheck } from "@/hooks/useIdentityRecheck";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { toast } from "sonner";

interface Props {
  contestId: string;
  contestSlug: string;
  /** Notifies the parent whenever submission readiness changes so the page
   *  can disable the Submit button while the heartbeat is offline/reconnecting. */
  onSubmissionReadyChange?: (ready: boolean) => void;
}

type Status = "loading" | "active" | "missing" | "ended";

/**
 * Floating Secure Mode HUD for the problem-solving page. Shows the live
 * session state (active / missing / ended), heartbeat health, an estimated
 * reconnect countdown during backoff, and the next action to take.
 */
export default function SecureProblemHUD({ contestId, contestSlug, onSubmissionReadyChange }: Props) {
  const navigate = useNavigate();
  const secure = useContestSecureMode(contestId, true);
  const active = useActiveContestSession(contestId);
  const trust = useContestTrustScore(contestId);

  // Periodically ping the proctor-analyze edge function (~every 2 min)
  useEffect(() => {
    if (!contestId || !active.hasActive) return;
    const ping = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.functions.invoke("proctor-analyze", {
          body: { contest_id: contestId, session_id: active.sessionId },
        });
      } catch { /* ignore */ }
    };
    void ping();
    const id = window.setInterval(ping, 120_000);
    return () => window.clearInterval(id);
  }, [contestId, active.hasActive, active.sessionId]);

  const status: Status = useMemo(() => {
    if (active.loading) return "loading";
    if (active.invalidatedJustNow) return "ended";
    if (active.hasActive) return "active";
    return "missing";
  }, [active.loading, active.hasActive, active.invalidatedJustNow]);

  // Live ticking countdown for the reconnect ETA
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!secure.nextRetryAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [secure.nextRetryAt]);
  const retryInSec = secure.nextRetryAt
    ? Math.max(0, Math.ceil((secure.nextRetryAt - now) / 1000))
    : null;

  // Push readiness up to the parent for Submit-button gating.
  useEffect(() => {
    onSubmissionReadyChange?.(secure.submissionAllowed && status === "active");
  }, [secure.submissionAllowed, status, onSubmissionReadyChange]);

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
      ? !secure.online || secure.reconnecting
        ? retryInSec !== null
          ? `Network lost — retrying heartbeat in ${retryInSec}s. Submissions paused.`
          : "Network lost — reconnecting heartbeat. Submissions paused."
        : secure.fullscreen
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
              <TrustScoreBadge trust={trust} />
              <Badge
                variant="outline"
                className={
                  !secure.online || secure.reconnecting
                    ? "border-amber-400/40 text-amber-300"
                    : "border-emerald-400/40 text-emerald-300"
                }
              >
                {secure.reconnecting ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : secure.online ? (
                  <Wifi className="mr-1 h-3 w-3" />
                ) : (
                  <WifiOff className="mr-1 h-3 w-3" />
                )}
                {secure.reconnecting ? "Reconnecting" : secure.online ? "Online" : "Offline"}
              </Badge>
              {retryInSec !== null && (secure.reconnecting || !secure.online) && (
                <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                  <Timer className="mr-1 h-3 w-3" /> Retry in {retryInSec}s
                </Badge>
              )}
              {(secure.reconnecting || !secure.online) && (
                <Button size="sm" variant="outline" onClick={secure.reconnect}>
                  Reconnect now
                </Button>
              )}
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
