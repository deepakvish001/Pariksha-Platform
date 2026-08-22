import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, IdCard, Loader2, ShieldCheck, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  contestId: string;
  /** Active session id for the participant. Required so the verify edge
   *  function can attribute checks to the right secure session. */
  sessionId: string | null;
  /** The live webcam MediaStream from useContestSecureMode. We capture the
   *  selfie from this rather than re-prompting the user for camera access. */
  webcamStream: MediaStream | null;
  /** Called when verification succeeds so the parent can advance the gate. */
  onVerified: () => void;
}

type Verdict = "pending" | "verified" | "failed";

/**
 * Identity capture step shown inside SecureContestGate AFTER honor-code
 * acceptance and BEFORE the secure session starts. The user uploads a
 * government-ID photo and snaps a selfie from the active webcam; both go
 * to the private `contest-identity` bucket and the verify edge function
 * scores the match using Gemini vision.
 *
 * Failure is non-blocking by default — the user can retry. After 3 failed
 * attempts they're told to contact admins.
 */
export function IdentityCaptureStep({ contestId, sessionId, webcamStream, onVerified }: Props) {
  const { user } = useAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const captureSelfie = async () => {
    if (!webcamStream) {
      toast.error("Webcam is not active. Grant access first.");
      return;
    }
    const video = videoRef.current ?? document.createElement("video");
    video.srcObject = webcamStream;
    await video.play();
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.85));
    video.pause();
    if (!blob) return;
    setSelfieBlob(blob);
    setSelfiePreview(URL.createObjectURL(blob));
  };

  const onIdSelected = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("ID must be an image");
      return;
    }
    if (f.size > 5_000_000) {
      toast.error("ID image too large (max 5MB)");
      return;
    }
    setIdFile(f);
    setIdPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!user || !idFile || !selfieBlob) {
      toast.error("Add both your ID photo and a selfie first");
      return;
    }
    setVerifying(true);
    setVerdict(null);
    setReasoning(null);
    try {
      const ts = Date.now();
      const sessionFolder = sessionId ?? "pre-session";
      const idPath = `${user.id}/${contestId}/${sessionFolder}/id-${ts}.${idFile.type.split("/")[1] || "jpg"}`;
      const selfiePath = `${user.id}/${contestId}/${sessionFolder}/selfie-${ts}.jpg`;
      const [idUp, selfieUp] = await Promise.all([
        supabase.storage.from("contest-identity").upload(idPath, idFile, {
          contentType: idFile.type,
          upsert: false,
        }),
        supabase.storage.from("contest-identity").upload(selfiePath, selfieBlob, {
          contentType: "image/jpeg",
          upsert: false,
        }),
      ]);
      if (idUp.error) throw new Error(`ID upload failed: ${idUp.error.message}`);
      if (selfieUp.error) throw new Error(`Selfie upload failed: ${selfieUp.error.message}`);

      const { data, error } = await supabase.functions.invoke("contest-identity-verify", {
        body: {
          contest_id: contestId,
          session_id: sessionId,
          kind: "initial",
          selfie_path: selfiePath,
          id_document_path: idPath,
        },
      });
      if (error) throw error;
      const res = data as { verdict: Verdict; match_score: number | null; reasoning: string };
      setVerdict(res.verdict);
      setScore(res.match_score);
      setReasoning(res.reasoning);
      setAttempts((a) => a + 1);
      if (res.verdict === "verified") {
        toast.success("Identity verified");
        onVerified();
      } else if (res.verdict === "failed") {
        toast.error("Identity check failed", { description: res.reasoning });
      } else {
        toast.message("Identity check pending review", { description: res.reasoning });
        // Pending = let them in; an admin will review.
        onVerified();
      }
    } catch (e) {
      const msg = (e as Error).message;
      toast.error("Verification failed", { description: msg });
      setVerdict("failed");
      setReasoning(msg);
      setAttempts((a) => a + 1);
    } finally {
      setVerifying(false);
    }
  };

  const retry = () => {
    setSelfieBlob(null);
    setSelfiePreview(null);
    setIdFile(null);
    setIdPreview(null);
    setVerdict(null);
    setReasoning(null);
    setScore(null);
  };

  const tooManyAttempts = attempts >= 3 && verdict !== "verified" && verdict !== "pending";

  return (
    <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Identity verification</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        We compare a photo of your government ID with a live selfie to confirm you're the registered participant.
        Both images are stored privately and only visible to admins.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="identity-id-photo" className="flex items-center gap-1.5 text-sm font-medium">
            <IdCard className="h-4 w-4" /> Government ID photo
          </label>
          <input
            id="identity-id-photo"
            type="file"
            accept="image/*"
            disabled={verifying}
            onChange={(e) => onIdSelected(e.target.files?.[0] ?? null)}
            className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:text-foreground"
          />
          {idPreview && (
            <img src={idPreview} alt="ID preview" className="h-32 w-full rounded border border-border object-cover" />
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <Camera className="h-4 w-4" /> Live selfie
          </label>
          <Button
            size="sm"
            variant="outline"
            disabled={verifying || !webcamStream}
            onClick={captureSelfie}
          >
            {selfiePreview ? "Retake selfie" : "Capture selfie"}
          </Button>
          {!webcamStream && (
            <p className="text-xs text-amber-300">Webcam not active yet — request webcam access first.</p>
          )}
          {selfiePreview && (
            <img src={selfiePreview} alt="Selfie preview" className="h-32 w-full rounded border border-border object-cover" />
          )}
          <video ref={videoRef} className="hidden" muted playsInline />
        </div>
      </div>

      {verdict && (
        <Alert variant={verdict === "failed" ? "destructive" : "default"}>
          {verdict === "verified" ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle className="capitalize">
            {verdict}{score !== null && ` · match ${(score * 100).toFixed(0)}%`}
          </AlertTitle>
          {reasoning && <AlertDescription>{reasoning}</AlertDescription>}
        </Alert>
      )}

      {tooManyAttempts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Too many failed attempts</AlertTitle>
          <AlertDescription>
            Contact a contest administrator before retrying. Your session cannot start until verification succeeds.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={submit} disabled={verifying || !idFile || !selfieBlob || tooManyAttempts}>
          {verifying ? (
            <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Verifying…</>
          ) : (
            "Verify identity"
          )}
        </Button>
        {(verdict === "failed" || (selfiePreview && !verifying)) && (
          <Button variant="ghost" size="sm" onClick={retry} disabled={verifying}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        )}
        {attempts > 0 && (
          <Badge variant="outline" className="ml-auto">
            Attempt {attempts}/3
          </Badge>
        )}
      </div>
    </Card>
  );
}
