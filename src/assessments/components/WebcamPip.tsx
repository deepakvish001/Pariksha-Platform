import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, Eye, EyeOff, Magnet, RotateCcw } from "lucide-react";

interface Props {
  attemptId: string;
  stream: MediaStream | null;
  /** Seconds between snapshots. Default 15. */
  intervalSec?: number;
  /** Called when the camera track is unexpectedly stopped/muted. */
  onLost?: () => void;
}

const POS_STORAGE_PREFIX = "assess.webcam.pip.pos:";
/** Legacy global key, kept for one-time migration to per-attempt storage. */
const LEGACY_POS_STORAGE_KEY = "assess.webcam.pip.pos";
const SNAP_PREF_KEY = "assess.webcam.pip.snap";
const HIDDEN_PREF_KEY = "assess.webcam.pip.hidden";
const DEFAULT_POS = { x: 16, y: 16 };
/** PIP width / height for corner math (must match render below). */
const PIP_W = 120;
const PIP_H = 110;
const EDGE_MARGIN = 16;
/** Distance (px) within which we snap to the nearest corner. */
const SNAP_THRESHOLD = 64;

function storageKeyFor(attemptId: string) {
  return `${POS_STORAGE_PREFIX}${attemptId || "default"}`;
}

function clampPos(p: { x: number; y: number }) {
  if (typeof window === "undefined") return p;
  return {
    x: Math.max(4, Math.min(window.innerWidth - PIP_W, p.x)),
    y: Math.max(4, Math.min(window.innerHeight - PIP_H + 10, p.y)),
  };
}

/**
 * Snap to nearest corner if within SNAP_THRESHOLD of one.
 * Coordinates are stored as right/bottom offsets, so the four
 * corners are simple combinations of EDGE_MARGIN and
 * (viewport - PIP_size - EDGE_MARGIN).
 */
function snapToCorner(p: { x: number; y: number }) {
  if (typeof window === "undefined") return p;
  const rightX = EDGE_MARGIN;
  const leftX = Math.max(EDGE_MARGIN, window.innerWidth - PIP_W - EDGE_MARGIN);
  const bottomY = EDGE_MARGIN;
  const topY = Math.max(EDGE_MARGIN, window.innerHeight - PIP_H - EDGE_MARGIN);
  const corners = [
    { x: rightX, y: bottomY }, // bottom-right
    { x: leftX, y: bottomY }, // bottom-left
    { x: rightX, y: topY }, // top-right
    { x: leftX, y: topY }, // top-left
  ];
  let best = p;
  let bestDist = Infinity;
  for (const c of corners) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return bestDist <= SNAP_THRESHOLD ? best : p;
}

function loadPos(attemptId: string): { x: number; y: number } {
  try {
    const raw =
      localStorage.getItem(storageKeyFor(attemptId)) ??
      localStorage.getItem(LEGACY_POS_STORAGE_KEY);
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

function loadSnapPref(): boolean {
  try {
    const raw = localStorage.getItem(SNAP_PREF_KEY);
    if (raw == null) return true; // default ON
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

function loadHiddenPref(): boolean {
  try {
    return localStorage.getItem(HIDDEN_PREF_KEY) === "1";
  } catch {
    return false;
  }
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
  const [pos, setPos] = useState<{ x: number; y: number }>(() => loadPos(attemptId));
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const [active, setActive] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(() => loadSnapPref());
  const [snapping, setSnapping] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => loadHiddenPref());

  // Persist snap preference
  useEffect(() => {
    try {
      localStorage.setItem(SNAP_PREF_KEY, snapEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [snapEnabled]);

  // Persist hidden preference (proctoring keeps running either way)
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_PREF_KEY, hidden ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [hidden]);




  // Load persisted position when the attempt changes, with a brief
  // animated transition so the PIP eases to its new corner instead of
  // teleporting between attempts.
  useEffect(() => {
    const next = loadPos(attemptId);
    setPos((prev) => {
      if (prev.x === next.x && prev.y === next.y) return prev;
      setSwitching(true);
      window.setTimeout(() => setSwitching(false), 420);
      return next;
    });
  }, [attemptId]);

  // Persist position whenever it changes (scoped per attempt)
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(attemptId), JSON.stringify(pos));
    } catch {
      /* ignore quota */
    }
  }, [pos, attemptId]);

  // Keep PIP on-screen across viewport resizes and orientation changes.
  // Orientation flips swap width/height, which can leave the persisted
  // position off-screen; we re-clamp on the next frame (after the browser
  // has reported the new innerWidth/innerHeight).
  useEffect(() => {
    const reclamp = () => setPos((p) => clampPos(p));
    const onOrientation = () => {
      // Delay to let the viewport settle after rotation.
      window.requestAnimationFrame(() => window.setTimeout(reclamp, 50));
    };
    window.addEventListener("resize", reclamp);
    window.addEventListener("orientationchange", onOrientation);
    const mql = window.matchMedia?.("(orientation: portrait)");
    mql?.addEventListener?.("change", onOrientation);
    return () => {
      window.removeEventListener("resize", reclamp);
      window.removeEventListener("orientationchange", onOrientation);
      mql?.removeEventListener?.("change", onOrientation);
    };
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
    setPos(clampPos({ x: nx, y: ny }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
    if (snapEnabled) {
      setPos((p) => {
        const snapped = snapToCorner(p);
        if (snapped.x !== p.x || snapped.y !== p.y) {
          setSnapping(true);
          window.setTimeout(() => setSnapping(false), 220);
        }
        return snapped;
      });
    }
  };

  return (
    <>
      {hidden ? (
        // Collapsed pill — keeps proctoring running (video stays mounted
        // off-screen below) but frees the PIP area on screen.
        <button
          type="button"
          onClick={() => setHidden(false)}
          style={{
            right: pos.x,
            bottom: pos.y,
            transition: switching
              ? "right 380ms cubic-bezier(0.22, 1, 0.36, 1), bottom 380ms cubic-bezier(0.22, 1, 0.36, 1)"
              : snapping
              ? "right 180ms ease-out, bottom 180ms ease-out"
              : undefined,
          }}
          className={
            "fixed z-[60] inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold shadow-lg border bg-black/80 backdrop-blur text-white hover:bg-black " +
            (active
              ? "border-emerald-500/60 ring-1 ring-emerald-500/40"
              : "border-destructive/70 ring-1 ring-destructive/40")
          }
          title="Show webcam preview (proctoring is still recording)"
          aria-label="Show webcam preview"
        >
          {active ? (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          ) : (
            <CameraOff className="h-3 w-3" />
          )}
          <span>REC</span>
          <Eye className="h-3 w-3 opacity-80" />
        </button>
      ) : (
        <div
          role="region"
          aria-label="Live webcam preview"
          style={{
            right: pos.x,
            bottom: pos.y,
            transition: switching
              ? "right 380ms cubic-bezier(0.22, 1, 0.36, 1), bottom 380ms cubic-bezier(0.22, 1, 0.36, 1)"
              : snapping
              ? "right 180ms ease-out, bottom 180ms ease-out"
              : undefined,
          }}
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
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSnapEnabled((v) => !v)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title={snapEnabled ? "Snap to corners: on" : "Snap to corners: off"}
                  aria-label="Toggle snap to corners"
                  aria-pressed={snapEnabled}
                  className={
                    "grid place-items-center h-4 w-4 rounded transition-colors " +
                    (snapEnabled
                      ? "bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40"
                      : "text-white/60 hover:bg-white/15 hover:text-white")
                  }
                >
                  <Magnet className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={resetPos}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Reset webcam position"
                  aria-label="Reset webcam position"
                  className="grid place-items-center h-4 w-4 rounded hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setHidden(true)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Hide webcam preview (proctoring keeps recording)"
                  aria-label="Hide webcam preview"
                  className="grid place-items-center h-4 w-4 rounded hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
                <Camera className="h-3 w-3 opacity-70" />
              </span>
            </div>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-[90px] object-cover bg-black"
            />
          </div>
        </div>
      )}

      {/*
        When hidden, the video element must still exist (and be playing) so
        the snapshot loop can draw frames. We render it off-screen but with
        non-zero size so the browser keeps decoding frames.
      */}
      {hidden && (
        <video
          ref={videoRef}
          muted
          playsInline
          aria-hidden
          tabIndex={-1}
          className="fixed left-[-9999px] top-0 w-[2px] h-[2px] opacity-0 pointer-events-none"
        />
      )}
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </>
  );
}
