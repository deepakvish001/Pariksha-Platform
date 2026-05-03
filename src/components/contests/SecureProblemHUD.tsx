import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Maximize2, Camera, AlertTriangle } from "lucide-react";
import { useContestSecureMode } from "@/hooks/useContestSecureMode";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { toast } from "sonner";

interface Props {
  contestId: string;
  contestSlug: string;
}

/**
 * Floating Secure Mode HUD for the problem-solving page. Mounted only when the
 * problem URL has `?contest=<slug>` and the contest exists. Re-arms the
 * lockdown listeners (paste/copy/contextmenu/blur/fullscreen) on the editor
 * page, shows live violation count, and warns the user when their secure
 * session ends from another device or via auto-DQ.
 */
export default function SecureProblemHUD({ contestId, contestSlug }: Props) {
  const navigate = useNavigate();
  const secure = useContestSecureMode(contestId, true);
  const active = useActiveContestSession(contestId);

  useEffect(() => {
    if (active.invalidatedJustNow) {
      toast.error("Secure session ended", {
        description: "Returning to the contest page.",
      });
      const t = window.setTimeout(() => navigate(`/contests/${contestSlug}`), 1500);
      return () => window.clearTimeout(t);
    }
  }, [active.invalidatedJustNow, contestSlug, navigate]);

  if (!active.hasActive && !active.loading) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck className="h-4 w-4" />
            No active secure session — submissions are disabled.
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(`/contests/${contestSlug}`)}>
            Back to contest
          </Button>
        </div>
      </Card>
    );
  }

  const violationsLeft = Math.max(0, 5 - secure.violationCount);
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure session active
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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
        </div>
      </div>
    </Card>
  );
}
