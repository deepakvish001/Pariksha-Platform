import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Camera, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface CandidateDetailsPayload {
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  college: string;
  branch: string;
  year: string;
  id_photo_url: string;
  selfie_url: string;
}

const detailsSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone")
    .max(20)
    .regex(/^[+\d][\d\s\-()]+$/, "Digits only"),
  roll_number: z.string().trim().min(1, "Roll number required").max(50),
  college: z.string().trim().min(2, "College required").max(150),
  branch: z.string().trim().min(1, "Branch required").max(80),
  year: z.string().trim().min(1, "Year required").max(20),
});

interface Props {
  attemptId: string;
  userId: string;
  onComplete: (payload: CandidateDetailsPayload) => void;
  done: boolean;
}

export function CandidateDetailsStep({ attemptId, userId, onComplete, done }: Props) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    roll_number: "",
    college: "",
    branch: "",
    year: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const update = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const uploadFile = async (file: File, kind: "id" | "selfie"): Promise<string> => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${attemptId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("attempt-identity")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) throw error;
    return path;
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setGlobalError("ID photo must be under 5 MB");
      return;
    }
    setBusy(true);
    setGlobalError(null);
    try {
      const path = await uploadFile(file, "id");
      setIdPhotoUrl(path);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const startCamera = async () => {
    setGlobalError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
        audio: false,
      });
      streamRef.current = s;
      setCameraOn(true);
      // attach on next tick
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? `Camera blocked: ${err.message}` : "Camera permission required",
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const captureSelfie = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    try {
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 480;
      canvas.height = v.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Capture failed"))), "image/jpeg", 0.85),
      );
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const path = await uploadFile(file, "selfie");
      setSelfieUrl(path);
      setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.7));
      stopCamera();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setGlobalError(null);
    const parsed = detailsSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = String(i.path[0] ?? "");
        if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!idPhotoUrl) {
      setGlobalError("Please upload your government ID photo");
      return;
    }
    if (!selfieUrl) {
      setGlobalError("Please capture a live selfie");
      return;
    }
    setBusy(true);
    try {
      const candidate_details = { ...parsed.data, captured_at: new Date().toISOString() };
      const { error } = await supabase
        .from("assessment_attempts")
        .update({
          candidate_details: candidate_details as never,
          id_photo_url: idPhotoUrl,
          selfie_url: selfieUrl,
        })
        .eq("id", attemptId);
      if (error) throw error;
      await supabase
        .from("attempt_events")
        .insert({ attempt_id: attemptId, kind: "candidate_details_saved", payload: {} as never });
      onComplete({ ...parsed.data, id_photo_url: idPhotoUrl, selfie_url: selfieUrl });
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Could not save details");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" /> Details verified and saved
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Field label="Full name" error={errors.full_name}>
          <Input
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            maxLength={100}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            maxLength={255}
            placeholder="jane@college.edu"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            maxLength={20}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="Roll number / Student ID" error={errors.roll_number}>
          <Input
            value={form.roll_number}
            onChange={(e) => update("roll_number", e.target.value)}
            maxLength={50}
          />
        </Field>
        <Field label="College / Institution" error={errors.college}>
          <Input
            value={form.college}
            onChange={(e) => update("college", e.target.value)}
            maxLength={150}
          />
        </Field>
        <Field label="Branch" error={errors.branch}>
          <Input
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
            maxLength={80}
            placeholder="CSE"
          />
        </Field>
        <Field label="Year" error={errors.year}>
          <Input
            value={form.year}
            onChange={(e) => update("year", e.target.value)}
            maxLength={20}
            placeholder="3rd year"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="rounded-md border border-border p-2.5 space-y-2">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Government ID photo
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleIdUpload}
            disabled={busy}
            className="text-xs w-full file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground"
          />
          {idPhotoUrl && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Uploaded
            </div>
          )}
        </div>

        <div className="rounded-md border border-border p-2.5 space-y-2">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Live selfie
          </div>
          {selfieDataUrl ? (
            <div className="flex items-center gap-2">
              <img
                src={selfieDataUrl}
                alt="Selfie preview"
                className="h-16 w-16 rounded object-cover border border-emerald-500/40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelfieDataUrl(null);
                  setSelfieUrl(null);
                  startCamera();
                }}
                disabled={busy}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retake
              </Button>
            </div>
          ) : cameraOn ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full max-w-[200px] rounded border border-border bg-black aspect-[4/3] object-cover"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={captureSelfie} disabled={busy}>
                  <Camera className="h-3.5 w-3.5 mr-1" /> Capture
                </Button>
                <Button size="sm" variant="ghost" onClick={stopCamera} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startCamera} disabled={busy}>
              <Camera className="h-3.5 w-3.5 mr-1" /> Start camera
            </Button>
          )}
        </div>
      </div>

      {globalError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {globalError}
        </div>
      )}

      <Button onClick={handleSave} disabled={busy} size="sm" className="font-semibold">
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…
          </>
        ) : (
          "Save details & continue"
        )}
      </Button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <div className="text-[11px] text-destructive">{error}</div>}
    </div>
  );
}
