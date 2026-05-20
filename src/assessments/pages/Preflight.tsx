import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mic,
  Monitor,
  ShieldCheck,
  Smartphone,
  Volume2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "@/lib/routing/slug";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CompatibilityMatrix,
  detectEnvironment,
} from "@/assessments/components/CompatibilityMatrix";
import { SideCameraPairing } from "@/assessments/components/SideCameraPairing";
import {
  PreflightSummaryDialog,
  SUMMARY_ICONS,
  type SummaryCheck,
  type CheckState,
} from "@/assessments/components/PreflightSummaryDialog";
import { PaletteLegend } from "@/assessments/components/PaletteLegend";
import "@/b2b/theme.css";

type StepState = "pending" | "active" | "passed" | "failed";

interface StepDef {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Camera;
}

const STEPS: StepDef[] = [
  { id: "device", title: "Device check", subtitle: "Browser & OS", icon: Monitor },
  { id: "permissions", title: "Permissions", subtitle: "Camera & microphone", icon: ShieldCheck },
  { id: "av", title: "Audio / Video", subtitle: "Self-test", icon: Volume2 },
  { id: "thirdeye", title: "Third Eye", subtitle: "Pair your phone", icon: Smartphone },
  { id: "ready", title: "Ready", subtitle: "Start the test", icon: CheckCircle2 },
];

function StepRail({
  current,
  stateById,
}: {
  current: number;
  stateById: Record<string, StepState>;
}) {
  return (
    <ol className="space-y-1">
      {STEPS.map((s, i) => {
        const state = i === current ? "active" : stateById[s.id] ?? "pending";
        const Icon = s.icon;
        return (
          <li key={s.id}>
            <div
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors",
                state === "active" &&
                  "bg-[hsl(var(--primary))]/10 ring-1 ring-inset ring-[hsl(var(--primary))]/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 h-7 w-7 shrink-0 rounded-full grid place-items-center text-xs font-semibold",
                  state === "passed"
                    ? "bg-emerald-500 text-white"
                    : state === "failed"
                    ? "bg-destructive text-destructive-foreground"
                    : state === "active"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--secondary))] text-muted-foreground",
                )}
              >
                {state === "passed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : state === "failed" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{s.title}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {s.subtitle}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

/* ──────────────────────── Step 1: Device ──────────────────────── */
function DeviceStep({ onPass, onFail }: { onPass: () => void; onFail: () => void }) {
  const env = useMemo(() => detectEnvironment(), []);
  useEffect(() => {
    if (env.supported) onPass();
    else onFail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.supported]);

  return (
    <StepShell
      title="Let's check your device"
      description="We've auto-detected your operating system and browser. Make sure your browser is updated to the latest version."
    >
      <CompatibilityMatrix os={env.os} browser={env.browser} />
      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-sm flex items-start gap-3",
          env.supported
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-destructive/40 bg-destructive/10",
        )}
      >
        {env.supported ? (
          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
        )}
        <div className="min-w-0">
          <div className="font-medium">
            {env.supported
              ? "Your browser is supported."
              : "Your browser may not be supported."}
          </div>
          <div className="text-muted-foreground text-xs mt-0.5">
            Detected: {env.os} · {env.browser}. We recommend the latest Chrome or
            Edge on desktop, and Chrome on Android / Safari on iOS.
          </div>
        </div>
      </div>
    </StepShell>
  );
}

/* ─────────────────── Step 2: Permissions ─────────────────── */
function PermissionsStep({
  onPass,
  onStream,
  stream,
}: {
  onPass: () => void;
  onStream: (s: MediaStream | null) => void;
  stream: MediaStream | null;
}) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(!!stream);

  const request = async () => {
    setRequesting(true);
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      onStream(s);
      setGranted(true);
      onPass();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Camera & microphone access was denied.",
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <StepShell
      title="Grant camera & microphone access"
      description="Your browser will ask you to allow camera and microphone. Click Allow on every prompt — these are used by the proctor for the duration of the test only."
    >
      <ol className="space-y-2 text-sm">
        {[
          "Click the Allow button below to trigger your browser's permission dialog.",
          "Choose Allow for both Camera and Microphone in the popup.",
          "Once granted, the green check will appear on the next step.",
        ].map((line, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-3 py-2"
          >
            <span className="h-5 w-5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center text-[11px] font-semibold shrink-0">
              {i + 1}
            </span>
            <span className="text-muted-foreground">{line}</span>
          </li>
        ))}
      </ol>

      {!granted ? (
        <Button onClick={request} disabled={requesting}>
          {requesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4 mr-2" />
          )}
          {requesting ? "Requesting…" : "Allow camera & microphone"}
        </Button>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Permissions granted
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <div className="text-xs mt-1 text-destructive/80">
            Open your browser site settings and reset camera/microphone permissions
            for this page, then try again.
          </div>
        </div>
      )}
    </StepShell>
  );
}

/* ─────────────────── Step 3: Audio / Video ─────────────────── */
function AvStep({
  stream,
  onPass,
}: {
  stream: MediaStream | null;
  onPass: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [level, setLevel] = useState(0);
  const [audioOk, setAudioOk] = useState(false);
  const [videoOk, setVideoOk] = useState(false);
  const [speakerOk, setSpeakerOk] = useState(false);
  const [playingTone, setPlayingTone] = useState(false);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
    const track = stream.getVideoTracks()[0];
    if (track && track.readyState === "live") setVideoOk(true);
  }, [stream]);

  // Audio meter
  useEffect(() => {
    if (!stream) return;
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      setLevel(peak);
      if (peak > 0.08) setAudioOk(true);
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.cancelAnimationFrame(raf);
      ctx.close().catch(() => {});
    };
  }, [stream]);

  /** Plays a short 440 Hz tone through the system speakers so the candidate
   *  can confirm playback works (not just the mic). */
  const playTone = async () => {
    if (playingTone) return;
    setPlayingTone(true);
    try {
      const AudioCtx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        setPlayingTone(false);
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      // gentle envelope to avoid clicks
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.2, now + 1.05);
      gain.gain.linearRampToValueAtTime(0, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.25);
      osc.onended = () => {
        ctx.close().catch(() => {});
        setPlayingTone(false);
      };
    } catch {
      setPlayingTone(false);
    }
  };

  useEffect(() => {
    if (audioOk && videoOk && speakerOk) onPass();
  }, [audioOk, videoOk, speakerOk, onPass]);

  return (
    <StepShell
      title="Test your audio and video"
      description="Confirm your webcam preview is visible, speak to see the microphone meter respond, then play the tone to confirm your speakers work."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden bg-black aspect-video relative">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
            <Camera className="h-3 w-3" />
            Webcam preview
          </div>
          {videoOk && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 bg-emerald-500/90 text-white text-[10px] px-2 py-1 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> OK
            </div>
          )}
        </div>
        <div className="rounded-lg border border-[hsl(var(--border))] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mic className="h-4 w-4" />
            Microphone meter
            {audioOk && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Detected
              </span>
            )}
          </div>
          <div className="h-3 w-full rounded-full bg-[hsl(var(--secondary))] overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[hsl(var(--primary))] transition-[width] duration-75"
              style={{ width: `${Math.min(100, Math.round(level * 220))}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Say "hello" — the bar should move. If it stays flat, check your system
            input device.
          </p>
        </div>
      </div>

      {/* Speaker playback self-test */}
      <div className="rounded-lg border border-[hsl(var(--border))] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="h-4 w-4" />
          Speaker check
          {speakerOk && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Confirmed
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Tap <strong>Play tone</strong> and confirm you hear it — this proves the
          proctor's audio messages will reach you.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={playTone}
            disabled={playingTone}
          >
            {playingTone ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {playingTone ? "Playing…" : speakerOk ? "Play again" : "Play tone"}
          </Button>
          {!speakerOk ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setSpeakerOk(true)}
                disabled={playingTone}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Yes, I heard it
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Didn't hear it? Check your volume and connected output device, then
                tap Play tone again.
              </span>
            </>
          ) : (
            <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Speakers working
            </span>
          )}
        </div>
      </div>
    </StepShell>
  );
}

/* ─────────────────── Step 4: Third Eye ─────────────────── */
function ThirdEyeStep({
  attemptId,
  onPass,
  onUnpaired,
}: {
  attemptId: string;
  onPass: () => void;
  onUnpaired?: () => void;
}) {
  return (
    <StepShell
      title="Pair your phone as Third Eye"
      description="Your phone acts as a side camera so the proctor can see your workspace. Scan the QR with your phone and follow the on-screen steps."
    >
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-4">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4">
          <SideCameraPairing attemptId={attemptId} onPaired={onPass} onUnpaired={onUnpaired} />
        </div>
        <ol className="space-y-2 text-sm">
          {[
            "Open the camera app on your phone and scan the QR shown here.",
            "Sign in or continue as guest, then tap Allow when asked for camera access.",
            "Place the phone in landscape, 3–4 feet to your side, so it can see your desk and hands.",
            "Turn on Auto-Rotate and Do Not Disturb so the phone doesn't sleep or interrupt.",
            "Wait for the green Connected indicator before continuing.",
          ].map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-3 py-2"
            >
              <span className="h-5 w-5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center text-[11px] font-semibold shrink-0">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </StepShell>
  );
}

/* ─────────────────── Step 5: Ready ─────────────────── */
function ReadyStep({
  title,
  durationMin,
  onStart,
}: {
  title: string;
  durationMin?: number;
  onStart: () => void;
}) {
  return (
    <StepShell
      title="You're all set"
      description="Everything checks out. Take a deep breath — once you click Start test, the timer cannot be paused."
    >
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 grid place-items-center shrink-0">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Duration: <strong className="text-foreground">{durationMin ?? "—"} min</strong>
            {" · "}Third Eye paired{" · "}Camera & mic ready
          </div>
        </div>
      </div>
      <PaletteLegend title="Before you start — palette color key" />
      <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
        Start test
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <p className="text-xs text-muted-foreground">
        Do not close this tab, lock your phone, or switch apps during the test.
      </p>
    </StepShell>
  );
}

/* ──────────────────────── Page ──────────────────────── */
export default function Preflight() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [stateById, setStateById] = useState<Record<string, StepState>>({});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const env = useMemo(() => detectEnvironment(), []);

  const { data, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      let q = supabase
        .from("assessment_attempts")
        .select(
          "*, assessment:assessments(id,title,duration_min,proctoring_enabled,starts_at,ends_at,status)",
        );
      q = isUuid(attemptId) ? q.eq("id", attemptId) : q.eq("slug", attemptId);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Clean up the temporary preflight stream when leaving — the player
  // requests its own fresh stream so we don't hold the camera here.
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const a = (data?.assessment ?? null) as
    | {
        title?: string;
        description?: string | null;
        duration_min?: number;
        proctoring_enabled?: boolean;
        starts_at?: string | null;
        ends_at?: string | null;
        status?: string | null;
      }
    | null;
  const needsThirdEye = !!a?.proctoring_enabled;

  // Schedule / publish gating (was previously on the Lobby page).
  const now = Date.now();
  const startMs = a?.starts_at ? new Date(a.starts_at).getTime() : null;
  const endMs = a?.ends_at ? new Date(a.ends_at).getTime() : null;
  const notYetOpen = !!startMs && now < startMs;
  const closed = !!endMs && now > endMs;
  const notPublished = !!a?.status && a.status !== "published";
  const blocked = notYetOpen || closed || notPublished;
  const blockReason = notPublished
    ? "This assessment isn't open yet — the recruiter hasn't published it."
    : notYetOpen
    ? `This assessment opens on ${new Date(startMs!).toLocaleString()}.`
    : closed
    ? `This assessment closed on ${new Date(endMs!).toLocaleString()}.`
    : null;

  // If proctoring is off, drop the Third Eye step from the rail entirely.
  const activeSteps = useMemo(
    () => STEPS.filter((s) => (s.id === "thirdeye" ? needsThirdEye : true)),
    [needsThirdEye],
  );

  const markCurrent = (state: StepState) => {
    const id = activeSteps[current]?.id;
    if (!id) return;
    setStateById((prev) =>
      prev[id] === state ? prev : { ...prev, [id]: state },
    );
  };

  const passCurrent = () => markCurrent("passed");
  const failCurrent = () => markCurrent("failed");

  const goNext = () => setCurrent((c) => Math.min(activeSteps.length - 1, c + 1));
  const goBack = () => setCurrent((c) => Math.max(0, c - 1));

  const onStart = () => {
    navigate(`/assessments/${data?.id ?? attemptId}/play`);
  };

  // Build the summary rows shown in the confirmation modal.
  const toCheckState = (id: string): CheckState => {
    const s = stateById[id];
    if (s === "passed") return "passed";
    if (s === "failed") return "failed";
    return "pending";
  };
  const summaryChecks: SummaryCheck[] = useMemo(() => {
    const rows: SummaryCheck[] = [
      {
        id: "device",
        label: "Device & browser",
        detail: `${env.os} · ${env.browser}`,
        state: toCheckState("device"),
        icon: SUMMARY_ICONS.device,
      },
      {
        id: "permissions",
        label: "Camera & microphone permission",
        detail: stream ? "Allowed" : "Not granted yet",
        state: toCheckState("permissions"),
        icon: SUMMARY_ICONS.permissions,
      },
      {
        id: "av",
        label: "Audio / video self-test",
        detail: "Webcam preview and mic meter responding",
        state: toCheckState("av"),
        icon: SUMMARY_ICONS.av,
      },
    ];
    rows.push(
      needsThirdEye
        ? {
            id: "thirdeye",
            label: "Third Eye (side camera)",
            detail: "Phone paired and streaming",
            state: toCheckState("thirdeye"),
            icon: SUMMARY_ICONS.thirdeye,
          }
        : {
            id: "thirdeye",
            label: "Third Eye (side camera)",
            detail: "Not required for this assessment",
            state: "skipped",
            icon: SUMMARY_ICONS.thirdeye,
          },
    );
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateById, stream, env.os, env.browser, needsThirdEye]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-sm text-muted-foreground">
        Attempt not found.
      </div>
    );
  }

  const currentId = activeSteps[current]?.id;
  const canAdvance = stateById[currentId] === "passed";

  return (
    <div className="theme-b2b min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold text-sm">
              P
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">
                {a.title ?? "Assessment"}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Pre-flight check
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessments")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Exit
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
        {/* Welcome / context strip — merged from the old Lobby page */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[hsl(var(--primary))] font-semibold mb-1">
                Test invitation
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                {a?.title ?? "Assessment"}
              </h1>
              {a?.description && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {a.description}
                </p>
              )}
            </div>
            {a?.proctoring_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                <ShieldCheck className="h-3 w-3" /> Proctored
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-[hsl(var(--border))]/40 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" /> Duration
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {a?.duration_min ?? "—"} min
              </div>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))]/40 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Proctoring
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                {a?.proctoring_enabled ? "Enabled" : "Off"}
              </div>
            </div>
            {(startMs || endMs) && (
              <div className="rounded-lg border border-[hsl(var(--border))]/40 bg-white/[0.02] px-3 py-2 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <CalendarClock className="h-3 w-3" /> Window
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {startMs ? new Date(startMs).toLocaleString() : "now"} →{" "}
                  {endMs ? new Date(endMs).toLocaleString() : "open"}
                </div>
              </div>
            )}
          </div>

          {blocked && blockReason && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{blockReason}</div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-[hsl(var(--border))]/40 bg-white/[0.02] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Before you begin
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--primary))] shrink-0" /> The timer cannot be paused once you start.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--primary))] shrink-0" /> Keep your camera and microphone on for the entire session.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--primary))] shrink-0" /> Do not switch tabs, open new windows, or use AI tools.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--primary))] shrink-0" /> Have your photo ID ready for verification.</li>
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
        {/* Step rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <StepRail
            current={current}
            stateById={activeSteps.reduce<Record<string, StepState>>(
              (acc, s, i) => {
                acc[s.id] =
                  i === current ? "active" : stateById[s.id] ?? "pending";
                return acc;
              },
              {},
            )}
          />
        </aside>

        {/* Step body */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl p-5 sm:p-8 shadow-[0_10px_30px_-12px_hsl(0_0%_0%/0.5)]">
            <AnimatePresence mode="wait">
              <div key={currentId}>
                {currentId === "device" && (
                  <DeviceStep onPass={passCurrent} onFail={failCurrent} />
                )}
                {currentId === "permissions" && (
                  <PermissionsStep
                    stream={stream}
                    onStream={setStream}
                    onPass={passCurrent}
                  />
                )}
                {currentId === "av" && (
                  <AvStep stream={stream} onPass={passCurrent} />
                )}
                {currentId === "thirdeye" && (
                  <ThirdEyeStep
                    attemptId={attemptId}
                    onPass={() => {
                      passCurrent();
                      // Auto-advance to the Ready step so users don't
                      // have to hunt for the Continue button below the fold.
                      setTimeout(() => goNext(), 600);
                    }}
                    onUnpaired={() => {
                      setStateById((prev) => ({ ...prev, thirdeye: "failed" }));
                      // If the user has moved past Third Eye, bounce them
                      // back so they're forced to re-pair before starting.
                      const teIndex = activeSteps.findIndex((s) => s.id === "thirdeye");
                      if (teIndex >= 0 && current > teIndex) setCurrent(teIndex);
                    }}
                  />
                )}
                {currentId === "ready" && (
                  <ReadyStep
                    title={a.title ?? "Assessment"}
                    durationMin={a.duration_min}
                    onStart={() => !blocked && setSummaryOpen(true)}
                  />
                )}
              </div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={current === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">
              Step {current + 1} of {activeSteps.length}
            </div>
            {currentId !== "ready" && (
              <Button onClick={goNext} disabled={!canAdvance}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </section>
        </div>
      </main>

      <PreflightSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        title={a.title ?? "Assessment"}
        durationMin={a.duration_min}
        environment={{ os: env.os, browser: env.browser }}
        checks={summaryChecks}
        onStart={onStart}
      />
    </div>
  );
}
