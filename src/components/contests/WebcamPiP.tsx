import { useEffect, useRef, useState } from "react";
import { Camera, Maximize2, Minimize2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";

type Aspect = "1:1" | "4:3" | "16:9";
const aspectClass: Record<Aspect, string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
};

interface Props {
  stream: MediaStream | null;
  initialPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const LS_KEY = "parikshaa:webcam-pip";

/**
 * Floating live webcam picture-in-picture used during contest kiosk mode.
 * Draggable between corners, supports min/max and crop aspect-ratio. The
 * underlying snapshot pipeline keeps uploading to `contest-proctor`
 * regardless of UI state.
 */
export function WebcamPiP({ stream, initialPosition = "bottom-right" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [aspect, setAspect] = useState<Aspect>("4:3");
  const [position, setPosition] = useState<Props["initialPosition"]>(initialPosition);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.position) setPosition(parsed.position);
        if (parsed.aspect) setAspect(parsed.aspect);
        if (typeof parsed.minimized === "boolean") setMinimized(parsed.minimized);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ position, aspect, minimized }));
    } catch { /* ignore */ }
  }, [position, aspect, minimized]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => { /* ignore autoplay block */ });
    }
  }, [stream]);

  const cornerClass =
    position === "bottom-right" ? "bottom-3 right-3"
    : position === "bottom-left" ? "bottom-3 left-3"
    : position === "top-right" ? "top-3 right-3"
    : "top-3 left-3";

  const cycleCorner = () => {
    const order: Props["initialPosition"][] = ["bottom-right", "bottom-left", "top-left", "top-right"];
    const idx = order.indexOf(position!);
    setPosition(order[(idx + 1) % order.length]);
  };
  const cycleAspect = () => {
    const order: Aspect[] = ["1:1", "4:3", "16:9"];
    setAspect(order[(order.indexOf(aspect) + 1) % order.length]);
  };

  if (!stream) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={`fixed ${cornerClass} z-50 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 backdrop-blur hover:bg-emerald-500/20`}
        title="Show webcam"
      >
        <Camera className="h-4 w-4 text-emerald-300" />
      </button>
    );
  }

  const widthClass = aspect === "16:9" ? "w-64" : aspect === "1:1" ? "w-44" : "w-52";

  return (
    <div className={`fixed ${cornerClass} z-50 ${widthClass} overflow-hidden rounded-lg border border-emerald-400/40 bg-black/70 shadow-lg backdrop-blur`}>
      <div className={`relative ${aspectClass[aspect]} w-full overflow-hidden bg-black`}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-emerald-400/20 bg-black/60 px-1 py-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cycleCorner} title="Move corner">
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cycleAspect} title={`Crop ${aspect}`}>
          <Crop className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setMinimized(true)} title="Minimize">
          <Minimize2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
