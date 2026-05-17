import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  WifiOff,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-sidecam`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 1700; // portrait A4-ish
const JPEG_QUALITY = 0.78;

type Page = {
  /** Local-only id (uuid) until uploaded. */
  localId: string;
  /** Server id once persisted. */
  serverId?: string;
  /** Local data URL preview. */
  dataUrl: string;
  ordinal: number;
  uploaded: boolean;
};

function uid() {
  return `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function SortablePage({
  page,
  onDelete,
  onPreview,
}: {
  page: Page;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.localId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-md overflow-hidden border bg-card",
        page.uploaded ? "border-emerald-500/50" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className="block w-full aspect-[3/4] bg-black"
        aria-label={`Preview page ${page.ordinal}`}
      >
        <img src={page.dataUrl} alt="" className="w-full h-full object-cover" />
      </button>
      <div className="absolute top-1 left-1 flex items-center gap-1">
        <button
          type="button"
          className="h-6 w-6 grid place-items-center rounded bg-black/55 text-white"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="h-6 px-2 grid place-items-center rounded bg-black/55 text-white text-[10px] font-mono">
          {page.ordinal}
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded bg-destructive/85 text-white"
        aria-label={`Remove page ${page.ordinal}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {page.uploaded && (
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] px-1.5 py-0.5 rounded">
          <CheckCircle2 className="h-3 w-3" /> Synced
        </span>
      )}
    </div>
  );
}

export default function SideCameraUploadPage() {
  const { token = "", questionId = "" } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const startCamera = async () => {
    setStatus("starting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not access camera.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load already-uploaded pages on mount
  useEffect(() => {
    if (!token || !questionId) return;
    (async () => {
      try {
        const r = await fetch(
          `${FN_URL}?action=answer-list&token=${encodeURIComponent(token)}&questionId=${encodeURIComponent(questionId)}`,
          { headers: { apikey: ANON } }
        );
        const j = await r.json();
        if (Array.isArray(j?.pages) && j.pages.length) {
          setPages(
            j.pages.map((p: { id: string; ordinal: number }) => ({
              localId: p.id,
              serverId: p.id,
              dataUrl: "",
              ordinal: p.ordinal,
              uploaded: true,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
  }, [token, questionId]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // letterbox fit
    const vr = video.videoWidth / video.videoHeight;
    const cr = CAPTURE_WIDTH / CAPTURE_HEIGHT;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (vr > cr) {
      sw = video.videoHeight * cr;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cr;
      sy = (video.videoHeight - sh) / 2;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    setPages((prev) => [
      ...prev,
      { localId: uid(), dataUrl, ordinal: prev.length + 1, uploaded: false },
    ]);
  };

  const removePage = async (localId: string) => {
    const p = pages.find((x) => x.localId === localId);
    if (p?.serverId) {
      try {
        await fetch(`${FN_URL}?action=answer-delete&token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { apikey: ANON, "Content-Type": "application/json", "x-pair-token": token },
          body: JSON.stringify({ id: p.serverId }),
        });
      } catch {/* ignore */}
    }
    setPages((prev) =>
      prev
        .filter((x) => x.localId !== localId)
        .map((x, i) => ({ ...x, ordinal: i + 1 }))
    );
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setPages((prev) => {
      const oldIndex = prev.findIndex((x) => x.localId === active.id);
      const newIndex = prev.findIndex((x) => x.localId === over.id);
      const moved = arrayMove(prev, oldIndex, newIndex);
      return moved.map((x, i) => ({ ...x, ordinal: i + 1 }));
    });
  };

  const upload = async () => {
    if (!pages.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const p of pages) {
        if (!p.dataUrl) continue; // already uploaded
        const r = await fetch(`${FN_URL}?action=answer-upload`, {
          method: "POST",
          headers: { apikey: ANON, "Content-Type": "application/json", "x-pair-token": token },
          body: JSON.stringify({ dataUrl: p.dataUrl, questionId, ordinal: p.ordinal }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Upload failed");
      }
      setDone(true);
      stopCamera();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setConfirmOpen(false);
    }
  };

  const counter = useMemo(
    () => ({ total: pages.length, pending: pages.filter((p) => !p.uploaded).length }),
    [pages]
  );

  if (done) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 grid place-items-center">
        <Card className="w-full max-w-md border-emerald-500/40">
          <CardContent className="p-6 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-lg font-bold">Uploaded</h1>
            <p className="text-sm text-muted-foreground">
              {pages.length} page{pages.length === 1 ? "" : "s"} uploaded. Switch back to your
              laptop and click <strong>Sync</strong> on the question to attach them.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDone(false);
                setPages([]);
                startCamera();
              }}
            >
              Capture more pages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-card/85 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <Link
          to={`/assessments/sidecam/${token}`}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Third Eye
        </Link>
        <div className="text-xs tabular-nums">
          <span className="font-semibold">{counter.total}</span> page{counter.total === 1 ? "" : "s"}
          {counter.pending > 0 && (
            <span className="text-amber-600 ml-2">{counter.pending} to upload</span>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <div>
          <h1 className="text-base font-bold">Upload answer sheets</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Capture each page one by one. You can re-order or remove pages before uploading.
          </p>
        </div>

        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          {status !== "ready" && (
            <div className="absolute inset-0 grid place-items-center text-white/80 text-xs">
              {status === "starting" ? "Starting camera…" : "Camera idle"}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={capture} disabled={status !== "ready"} className="flex-1 h-11">
            <Camera className="h-4 w-4 mr-2" /> Capture page {pages.length + 1}
          </Button>
          {status === "error" && (
            <Button variant="outline" onClick={startCamera}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
            <WifiOff className="h-3.5 w-3.5 mt-0.5" /> {error}
          </div>
        )}

        {pages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview &amp; reorder
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Drag the handle to reorder
              </span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={pages.map((p) => p.localId)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-2">
                  {pages.map((p, i) => (
                    <SortablePage
                      key={p.localId}
                      page={p}
                      onDelete={() => removePage(p.localId)}
                      onPreview={() => setPreviewIdx(i)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              className="w-full h-11"
              onClick={() => setConfirmOpen(true)}
              disabled={uploading || counter.pending === 0}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload {counter.pending} page{counter.pending === 1 ? "" : "s"}
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Make sure each page is well-lit, in focus, and fully inside the frame before capturing.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload {counter.pending} page{counter.pending === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pages will be attached to your answer in the order shown. You can capture more pages
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={upload} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewIdx !== null && pages[previewIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setPreviewIdx(null)}
        >
          <div className="flex-1 grid place-items-center p-4">
            <img
              src={pages[previewIdx].dataUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="text-center text-white text-xs py-3 tabular-nums">
            Page {pages[previewIdx].ordinal} of {pages.length} · tap anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
