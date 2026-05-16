import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

interface Props {
  attemptId: string;
  stream: MediaStream | null;
  /** Seconds between snapshots. Default 15. */
  intervalSec?: number;
  /** Called when the camera track is unexpectedly stopped/muted. */
  onLost?: () => void;
}

const POS_STORAGE_KEY = "assess.webcam.pip.pos";
const DEFAULT_POS = { x: 16, y: 16 };

function clampPos(p: { x: number; y: number }) {
  if (typeof window === "undefined") return p;
  return {
    x: Math.max(4, Math.min(window.innerWidth - 120, p.x)),
    y: Math.max(4, Math.min(window.innerHeight - 100, p.y)),
  };
}

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return DEFAULT_POS;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return clampPos(parsed);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_POS;
}

/**
 * Always-visible draggable PIP of the candidate webcam.
 * Captures a JPEG every {intervalSec}s, uploads to the
 * `assessment-proctor` bucket and logs a `webcam_snapshot` event.
 *
 * Position is persisted across sessions in localStorage under
 * `assess.webcam.pip.pos`. Use the reset button in the header to
 * return to the default bottom-right corner.
 */
export function WebcamPip({ attemptId, stream, intervalSec = 15, onLost }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => loadPos());
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const [active, setActive] = useState(true);

  // Persist position whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore quota */
    }
  }, [pos]);

  // Keep PIP on-screen across viewport resizes
  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const resetPos = () => setPos(DEFAULT_POS);

  // Attach stream
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
  }, [stream]);

  // Detect camera loss
  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const handleEnded = () => {
      setActive(false);
      onLost?.();
    };
    const handleMute = () => {
      setActive(false);
      onLost?.();
    };
    track.addEventListener("ended", handleEnded);
    track.addEventListener("mute", handleMute);
    return () => {
      track.removeEventListener("ended", handleEnded);
      track.removeEventListener("mute", handleMute);
    };
  }, [stream, onLost]);

  // Snapshot loop
  useEffect(() => {
    if (!stream || !active) return;
    let cancelled = false;

    const snap = async () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.readyState < 2) return;
      c.width = 320;
      c.height = 240;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const blob: Blob | null = await new Promise((res) =>
        c.toBlob((b) => res(b), "image/jpeg", 0.6)
      );
      if (!blob || cancelled) return;
      const ts = Date.now();
      const path = `${attemptId}/${ts}.jpg`;
      const { error } = await supabase.storage
        .from("assessment-proctor")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (!error) {
        await supabase
          .from("attempt_events")
          .insert({
            attempt_id: attemptId,
            kind: "webcam_snapshot",
            payload: { path, ts } as never,
          });
      }
    };

    // first snapshot soon, then regular interval
    const initial = window.setTimeout(snap, 2000);
    const id = window.setInterval(snap, intervalSec * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [attemptId, stream, active, intervalSec]);

  // Drag handlers (uses bottom-right offsets so it sticks during resize)
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      ox: e.clientX + pos.x - window.innerWidth,
      oy: e.clientY + pos.y - window.innerHeight,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = window.innerWidth - (e.clientX - dragRef.current.ox);
    const ny = window.innerHeight - (e.clientY - dragRef.current.oy);
    setPos({
      x: Math.max(4, Math.min(window.innerWidth - 120, nx)),
      y: Math.max(4, Math.min(window.innerHeight - 100, ny)),
    });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <>
      <div
        role="region"
        aria-label="Live webcam preview"
        style={{ right: pos.x, bottom: pos.y }}
        className="fixed z-[60] select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className={
            "w-[120px] rounded-lg overflow-hidden border shadow-xl bg-black cursor-grab active:cursor-grabbing " +
            (active
              ? "border-emerald-500/60 ring-1 ring-emerald-500/40"
              : "border-destructive/70 ring-1 ring-destructive/40")
          }
        >
          <div className="flex items-center justify-between gap-1 px-2 py-1 text-[10px] font-semibold bg-black/70 text-white">
            <span className="inline-flex items-center gap-1">
              {active ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC
                </>
              ) : (
                <>
                  <CameraOff className="h-3 w-3" /> LOST
                </>
              )}
            </span>
            <Camera className="h-3 w-3 opacity-70" />
          </div>
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-[90px] object-cover bg-black"
          />
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </>
  );
}
