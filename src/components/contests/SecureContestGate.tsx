import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useContestSecureMode } from "@/hooks/useContestSecureMode";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import { WebcamPiP } from "./WebcamPiP";
import { IdentityCaptureStep } from "./IdentityCaptureStep";
import { ShieldCheck, Eye, Maximize2, Camera, Ban, AlertTriangle, Lock, Monitor, Mic } from "lucide-react";
import { toast } from "sonner";
import ContestLobby from "./ContestLobby";

interface Props {
  contestId: string;
  contestSlug: string;
  startsAt: string;
  registeredCount: number;
  honorAccepted: boolean;
  onHonorAccepted: () => void;
  hasStarted: boolean;
  hasEnded: boolean;
  isRegistered: boolean;
  isDisqualified: boolean;
  onSessionChange?: (hasActive: boolean) => void;
  /** Slug of the first contest problem so we can navigate into the kiosk on start. */
  firstProblemSlug?: string;
}

export default function SecureContestGate({
  contestId,
  contestSlug,
  startsAt,
  registeredCount,
  honorAccepted,
  onHonorAccepted,
  hasStarted,
  hasEnded,
  isRegistered,
  isDisqualified,
  onSessionChange,
  firstProblemSlug,
}: Props) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [checklistReady, setChecklistReady] = useState(false);
  const identityKey = `contest-identity-verified:${contestId}`;
  const [identityVerified, setIdentityVerified] = useState<boolean>(() => {
    try { return localStorage.getItem(identityKey) === "1"; } catch { return false; }
  });
  const [audioConsent, setAudioConsent] = useState<boolean>(() => {
    try { return localStorage.getItem(`contest-audio-consent:${contestId}`) === "1"; } catch { return false; }
  });
  const markVerified = () => {
    try { localStorage.setItem(identityKey, "1"); } catch { /* ignore */ }
    setIdentityVerified(true);
  };
  const secure = useContestSecureMode(contestId, !!honorAccepted && hasStarted && !hasEnded);
  const active = useActiveContestSession(contestId);
  const recorder = useScreenRecorder({
    contestId,
    sessionId: secure.sessionId,
    enabled: !!secure.sessionId && hasStarted && !hasEnded,
    onScreenShareStopped: () => {
      void secure.logViolation("session_invalidated", "flag", { reason: "screen_share_stopped" });
      toast.error("Screen sharing stopped — please re-share to keep submitting");
    },
  });

  // Bubble session state up so the parent can gate the Problems tab.
  useEffect(() => {
    onSessionChange?.(active.hasActive);
  }, [active.hasActive, onSessionChange]);

  // Auto-jump into kiosk once session + screen share are live.
  useEffect(() => {
    if (secure.sessionId && recorder.sharing && firstProblemSlug && hasStarted && !hasEnded) {
      navigate(`/contests/${contestSlug}/play/${firstProblemSlug}`);
    }
  }, [secure.sessionId, recorder.sharing, firstProblemSlug, hasStarted, hasEnded, contestSlug, navigate]);

  if (!isRegistered) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-300">
          <Lock className="h-4 w-4" />
          Register before the contest starts to participate. Late entry is disabled in Secure Mode.
        </div>
      </Card>
    );
  }

  if (isDisqualified || secure.disqualified) {
    return (
      <Alert variant="destructive">
        <Ban className="h-4 w-4" />
        <AlertTitle>You have been disqualified</AlertTitle>
        <AlertDescription>
          Too many anti-cheat violations were recorded during this contest. Contact admins if this is in error.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasEnded) return null;

  // Honor code step
  if (!honorAccepted) {
    const accept = async () => {
      if (!agreed) return;
      setAccepting(true);
      const { error } = await supabase.rpc("contest_accept_honor_code" as never, {
        _contest_id: contestId,
      } as never);
      setAccepting(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      onHonorAccepted();
      toast.success("Honor code accepted");
    };

    return (
      <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Secure Mode — Honor Code</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This contest runs in Secure Mode. By participating you agree to the following rules:
        </p>
        <ul className="space-y-2 text-sm">
          <Rule icon={Eye} text="Tab switching, copy/paste, and right-click are tracked. After 3 violations you are flagged; after 5 you are auto-disqualified." />
          <Rule icon={Maximize2} text="The browser must remain in fullscreen. Exiting fullscreen counts as a violation." />
          <Rule icon={Camera} text="Webcam snapshots are captured periodically and stored privately for admin review." />
          <Rule icon={Lock} text="Only one active session is allowed. Joining from a second device will end this one." />
          <Rule icon={Monitor} text="Screen sharing is required and recorded for the duration of the contest." />
          <Rule icon={AlertTriangle} text="Close all other applications and avoid background processes for the duration of the contest." />
        </ul>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
          I have read and accept the contest honor code.
        </label>
        <Button onClick={accept} disabled={!agreed || accepting}>
          {accepting ? "Accepting…" : "Accept and continue"}
        </Button>
      </Card>
    );
  }

  // Pre-start lobby (waiting for contest to begin)
  if (!hasStarted) {
    return (
      <ContestLobby
        startsAt={startsAt}
        registeredCount={registeredCount}
        onChecklistComplete={setChecklistReady}
      />
    );
  }

  // Identity verification step (after webcam request, before session start)
  if (!secure.sessionId && !active.hasActive && !identityVerified) {
    return (
      <div className="space-y-3">
        {!secure.webcamReady && (
          <Card className="space-y-3 border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Enable webcam to verify identity</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              We need your webcam on to capture a live selfie for identity verification.
            </p>
            <Button onClick={secure.requestWebcam}>Grant webcam access</Button>
            {secure.startError && (
              <p className="text-xs text-red-300">{secure.startError}</p>
            )}
          </Card>
        )}
        {secure.webcamReady && (
          <IdentityCaptureStep
            contestId={contestId}
            sessionId={secure.sessionId}
            webcamStream={secure.webcamStream}
            onVerified={markVerified}
          />
        )}
      </div>
    );
  }

  // Start secure session
  if (!secure.sessionId && !active.hasActive) {
    return (
      <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Start Secure Session</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          The contest is live. Press start to enable lockdown, request your webcam, and enter fullscreen.
        </p>
        {!checklistReady && (
          <p className="text-xs text-amber-300">
            Tip: tick every item in the pre-flight checklist below for the best experience.
          </p>
        )}
        <label className="flex items-start gap-2 rounded border border-border/40 bg-muted/20 p-2.5 text-xs">
          <Checkbox
            checked={audioConsent}
            onCheckedChange={(c) => {
              const v = !!c;
              setAudioConsent(v);
              try { localStorage.setItem(`contest-audio-consent:${contestId}`, v ? "1" : "0"); } catch { /* ignore */ }
            }}
            className="mt-0.5"
          />
          <span>
            <Mic className="mr-1 inline h-3 w-3" />
            <strong>Optional audio proctoring:</strong> capture short (~6s) microphone snippets every 2 minutes to
            detect background voices or coaching. Stored privately for admin review only. You can decline.
          </span>
        </label>
        {secure.startError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not start session</AlertTitle>
            <AlertDescription>{secure.startError}</AlertDescription>
          </Alert>
        )}
        <Button
          disabled={secure.starting}
          onClick={async () => {
            await secure.requestWebcam();
            await recorder.requestShare();
            await secure.enterFullscreen();
            await secure.start();
          }}
        >
          {secure.starting ? "Starting…" : "Start secure session"}
        </Button>
        {recorder.error && (
          <p className="text-xs text-red-300">Screen share: {recorder.error}</p>
        )}
      </Card>
    );
  }

  // Live secure HUD — also mounts the WebcamPiP so the user always sees their camera.
  const violationsLeft = Math.max(0, 5 - secure.violationCount);
  return (
    <>
      <WebcamPiP stream={secure.webcamStream} />
      <Card className="space-y-3 border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium">Secure session active</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={secure.fullscreen ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
              <Maximize2 className="mr-1 h-3 w-3" /> {secure.fullscreen ? "Fullscreen" : "Not fullscreen"}
            </Badge>
            <Badge variant="outline" className={secure.webcamReady ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
              <Camera className="mr-1 h-3 w-3" /> {secure.webcamReady ? "Proctor on" : "No webcam"}
            </Badge>
            <Badge variant="outline" className={recorder.sharing ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
              <Monitor className="mr-1 h-3 w-3" /> {recorder.sharing ? "Screen recording" : "No screen share"}
            </Badge>
            <Badge variant="outline" className={secure.flagged ? "border-red-400/50 text-red-300" : "border-border"}>
              <AlertTriangle className="mr-1 h-3 w-3" /> {secure.violationCount}/5 violations · {violationsLeft} left
            </Badge>
          </div>
        </div>
        {!recorder.sharing && (
          <Button size="sm" variant="outline" onClick={recorder.requestShare}>
            Share screen again
          </Button>
        )}
        {!secure.fullscreen && (
          <Button size="sm" variant="outline" onClick={secure.enterFullscreen}>
            Re-enter fullscreen
          </Button>
        )}
        {firstProblemSlug && (
          <Button
            size="sm"
            onClick={() => navigate(`/contests/${contestSlug}/play/${firstProblemSlug}`)}
          >
            Enter contest workspace
          </Button>
        )}
      </Card>

      <Dialog
        open={active.invalidatedJustNow}
        onOpenChange={(o) => { if (!o) active.acknowledgeInvalidation(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Secure session ended</DialogTitle>
            <DialogDescription>
              Your secure session for this contest was ended — either you signed in from another device, an admin
              ended it, or you were disqualified. Reload the page to start a new session if you are still eligible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate(`/contests/${contestSlug}`)}>Back to contest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const Rule = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <li className="flex items-start gap-2">
    <Icon className="mt-0.5 h-4 w-4 text-primary" />
    <span>{text}</span>
  </li>
);
