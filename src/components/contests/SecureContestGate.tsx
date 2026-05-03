import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useContestSecureMode } from "@/hooks/useContestSecureMode";
import { ShieldCheck, Eye, Maximize2, Camera, Ban, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  contestId: string;
  contestSlug: string;
  honorAccepted: boolean;
  onHonorAccepted: () => void;
  hasStarted: boolean;
  hasEnded: boolean;
  isRegistered: boolean;
  isDisqualified: boolean;
}

export default function SecureContestGate({
  contestId,
  contestSlug,
  honorAccepted,
  onHonorAccepted,
  hasStarted,
  hasEnded,
  isRegistered,
  isDisqualified,
}: Props) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const secure = useContestSecureMode(contestId, !!honorAccepted && hasStarted && !hasEnded);

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
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          Honor code accepted. The secure session opens automatically when the contest starts.
        </div>
      </Card>
    );
  }

  // Start secure session
  if (!secure.sessionId) {
    return (
      <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Start Secure Session</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          The contest is live. Press start to enable lockdown, request your webcam, and enter fullscreen.
        </p>
        {secure.startError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Could not start session</AlertTitle>
            <AlertDescription>{secure.startError}</AlertDescription>
          </Alert>
        )}
        <Button
          disabled={secure.starting}
          onClick={async () => {
            await secure.requestWebcam();
            await secure.enterFullscreen();
            await secure.start();
          }}
        >
          {secure.starting ? "Starting…" : "Start secure session"}
        </Button>
      </Card>
    );
  }

  // Live secure HUD
  const violationsLeft = Math.max(0, 5 - secure.violationCount);
  return (
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
          <Badge variant="outline" className={secure.flagged ? "border-red-400/50 text-red-300" : "border-border"}>
            <AlertTriangle className="mr-1 h-3 w-3" /> {secure.violationCount}/5 violations · {violationsLeft} left
          </Badge>
        </div>
      </div>
      {!secure.fullscreen && (
        <Button size="sm" variant="outline" onClick={secure.enterFullscreen}>
          Re-enter fullscreen
        </Button>
      )}
      <Button size="sm" onClick={() => navigate(`/contests/${contestSlug}`)}>
        Open problems
      </Button>
    </Card>
  );
}

const Rule = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <li className="flex items-start gap-2">
    <Icon className="mt-0.5 h-4 w-4 text-primary" />
    <span>{text}</span>
  </li>
);

const AlertCircleIcon = () => <AlertTriangle className="h-4 w-4" />;
