import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  ImageIcon,
  ExternalLink,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  DndContext,
  PointerSensor,
  closestCenter,
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
import { toast } from "sonner";

interface Page {
  id: string;
  ordinal: number;
  url: string | null;
  storage_path: string;
  uploaded_at: string;
}

interface Props {
  attemptId: string;
  questionId: string;
  /** Called when the synced page list changes so the parent can mark answered. */
  onPagesChange?: (pages: Page[]) => void;
}

function SortableThumb({
  page,
  onPreview,
  onDelete,
  busy,
}: {
  page: Page;
  onPreview: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-[3/4] rounded border bg-muted overflow-hidden group"
    >
      <button
        type="button"
        onClick={onPreview}
        className="block w-full h-full hover:ring-2 hover:ring-primary/40"
        aria-label={`Preview page ${page.ordinal}`}
      >
        {page.url ? (
          <img src={page.url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="grid place-items-center h-full text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </button>
      <button
        type="button"
        className="absolute top-0.5 left-0.5 h-5 w-5 grid place-items-center rounded bg-black/55 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="absolute top-0.5 right-0.5 h-5 w-5 grid place-items-center rounded bg-destructive/85 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition disabled:opacity-50"
        aria-label={`Delete page ${page.ordinal}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <span className="absolute bottom-0.5 right-0.5 text-[10px] font-mono bg-black/55 text-white px-1 rounded">
        {page.ordinal}
      </span>
    </div>
  );
}

/**
 * Tile shown inside descriptive (subjective) questions. Lets the candidate
 * deep-link their already-paired phone into the answer-sheet capture flow,
 * then pulls the resulting pages back into the question answer with a Sync
 * button (also auto-syncs via realtime). Also supports previewing pages in
 * a full-screen lightbox, deleting, and drag-reordering them.
 */
export function AnswerUploadTile({ attemptId, questionId, onPagesChange }: Props) {
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Page | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllDone, setDownloadAllDone] = useState(0);
  const [downloadAllTotal, setDownloadAllTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const extFromMime = (mime: string | null | undefined): string | null => {
    if (!mime) return null;
    const m = mime.toLowerCase().split(";")[0].trim();
    const map: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/pjpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic",
      "image/heif": "heif",
      "image/avif": "avif",
      "image/bmp": "bmp",
      "image/tiff": "tiff",
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
    };
    if (map[m]) return map[m];
    // image/foo+bar -> foo
    const sub = m.split("/")[1];
    if (!sub) return null;
    return sub.split("+")[0].replace(/[^a-z0-9]/g, "") || null;
  };

  const extFromUrl = (raw: string | undefined | null): string | null => {
    if (!raw) return null;
    try {
      const u = new URL(raw, window.location.origin);
      const path = u.pathname;
      const m = /\.([a-zA-Z0-9]{2,5})$/.exec(path);
      if (!m) return null;
      const e = m[1].toLowerCase();
      // Only accept extensions we'd actually expect for an uploaded page
      const allowed = new Set([
        "jpg", "jpeg", "png", "webp", "gif", "heic", "heif",
        "avif", "bmp", "tiff", "svg", "pdf",
      ]);
      return allowed.has(e) ? (e === "jpeg" ? "jpg" : e) : null;
    } catch {
      return null;
    }
  };

  const downloadPage = async (p: Page): Promise<boolean> => {
    if (!p?.url) return false;
    try {
      const res = await fetch(p.url);
      const blob = await res.blob();
      const headerType = res.headers.get("content-type");
      const ext =
        extFromMime(headerType) ??
        extFromMime(blob.type) ??
        extFromUrl(p.url) ??
        "jpg";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `answer-page-${String(p.ordinal).padStart(2, "0")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  };

  const downloadAll = async () => {
    if (downloadingAll || pages.length === 0) return;
    setDownloadingAll(true);
    setDownloadAllDone(0);
    setDownloadAllTotal(pages.length);
    try {
      let i = 0;
      for (const p of pages) {
        await downloadPage(p);
        i += 1;
        setDownloadAllDone(i);
        // small gap so browsers don't collapse/cancel rapid downloads
        if (i < pages.length) await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch the most recent pair token for this attempt (RLS-restricted to owner)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_side_camera_pairings")
        .select("pair_token")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.pair_token) setPairToken(data.pair_token);
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "assessment-sidecam?action=answer-sign",
        { body: { attemptId, questionId } }
      );
      if (error) throw error;
      const next = (data?.pages ?? []) as Page[];
      setPages(next);
      onPagesChange?.(next);
    } finally {
      setLoading(false);
    }
  }, [attemptId, questionId, onPagesChange]);

  // Initial sync + whenever question changes
  useEffect(() => {
    sync();
  }, [sync]);

  // Realtime: pull new pages as soon as the phone uploads
  useEffect(() => {
    const channel = supabase
      .channel(`answer-uploads-${attemptId}-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assessment_answer_uploads",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { question_id?: string } | null;
          if (row?.question_id === questionId) sync();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId, questionId, sync]);

  const uploadUrl = useMemo(
    () =>
      pairToken
        ? `${window.location.origin}/assessments/sidecam/${pairToken}/upload/${questionId}`
        : null,
    [pairToken, questionId]
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    setPendingDelete(null);
    try {
      const { error } = await supabase.functions.invoke(
        "assessment-sidecam?action=answer-delete-auth",
        { body: { id: target.id } }
      );
      if (error) throw error;
      toast.success(`Page ${target.ordinal} deleted`);
      // Optimistic local update; realtime sync will also refresh
      setPages((prev) =>
        prev.filter((p) => p.id !== target.id).map((p, i) => ({ ...p, ordinal: i + 1 }))
      );
      sync();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete page");
    } finally {
      setBusyId(null);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(pages, oldIndex, newIndex).map((p, i) => ({ ...p, ordinal: i + 1 }));
    const prevPages = pages;
    setPages(next); // optimistic
    setReordering(true);
    try {
      const { error } = await supabase.functions.invoke(
        "assessment-sidecam?action=answer-reorder",
        {
          body: {
            attemptId,
            questionId,
            orderedIds: next.map((p) => p.id),
          },
        }
      );
      if (error) throw error;
      onPagesChange?.(next);
    } catch (err) {
      setPages(prevPages);
      toast.error(err instanceof Error ? err.message : "Could not reorder pages");
    } finally {
      setReordering(false);
    }
  };

  // Keyboard nav in preview
  useEffect(() => {
    if (previewIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewIdx(null);
      if (e.key === "ArrowRight")
        setPreviewIdx((i) => (i === null ? null : Math.min(pages.length - 1, i + 1)));
      if (e.key === "ArrowLeft")
        setPreviewIdx((i) => (i === null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIdx, pages.length]);

  return (
    <div className="rounded-lg border bg-card/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" /> Upload answer sheets from phone
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Capture handwritten pages on your paired phone, then click <strong>Sync</strong> to
            attach them. You can preview, reorder, or delete pages below.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={sync} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Sync</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="tabular-nums font-semibold">{pages.length}</span> page
          {pages.length === 1 ? "" : "s"} uploaded
        </span>
        {pages.length > 0 && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Synced
          </span>
        )}
        {reordering && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving order…
          </span>
        )}
      </div>

      {uploadUrl ? (
        <div className="flex items-stretch gap-3">
          <div className="shrink-0 grid place-items-center rounded-md border bg-white p-1.5">
            <QRCodeSVG value={uploadUrl} size={84} />
          </div>
          <div className="min-w-0 flex-1 text-xs text-muted-foreground space-y-1.5">
            <p className="leading-relaxed">
              On your paired phone, open <strong>Third Eye → Upload pages</strong> for this
              question, or scan this QR.
            </p>
            <a
              href={uploadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline break-all"
            >
              <ExternalLink className="h-3 w-3" />
              Open link
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pair your phone (Third Eye) from the lobby to enable phone uploads.
        </p>
      )}

      {pages.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Pages
            </span>
            <span className="text-[10px] text-muted-foreground">
              Drag the handle to reorder · hover for actions
            </span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {pages.map((p, i) => (
                  <SortableThumb
                    key={p.id}
                    page={p}
                    busy={busyId === p.id}
                    onPreview={() => setPreviewIdx(i)}
                    onDelete={() => setPendingDelete(p)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {previewIdx !== null && pages[previewIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setPreviewIdx(null)}
        >
          <div
            className="flex items-center justify-between px-4 py-3 text-white text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="tabular-nums">
              Page {pages[previewIdx].ordinal} of {pages.length}
            </span>
            <div className="flex items-center gap-3">
              {pages[previewIdx].url && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const p = pages[previewIdx];
                      if (!p?.url || downloadingId) return;
                      setDownloadingId(p.id);
                      try {
                        const ok = await downloadPage(p);
                        if (!ok && p?.url) window.open(p.url, "_blank", "noopener,noreferrer");
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    disabled={downloadingId === pages[previewIdx].id || downloadingAll}
                    className="inline-flex items-center gap-1 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={`Download page ${pages[previewIdx].ordinal}`}
                    aria-busy={downloadingId === pages[previewIdx].id}
                  >
                    {downloadingId === pages[previewIdx].id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Downloading…
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" /> Download
                      </>
                    )}
                  </button>
                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={downloadAll}
                      disabled={downloadingAll || downloadingId !== null}
                      className="inline-flex items-center gap-1 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label={`Download all ${pages.length} pages`}
                      aria-busy={downloadingAll}
                    >
                      {downloadingAll ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {downloadingAll
                        ? `Downloading ${downloadAllDone}/${downloadAllTotal}…`
                        : `Download all (${pages.length})`}
                    </button>
                  )}
                  <a
                    href={pages[previewIdx].url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline text-white/70"
                  >
                    Open original
                  </a>
                </>
              )}
              <button
                type="button"
                className="h-7 w-7 grid place-items-center rounded hover:bg-white/10"
                onClick={() => setPreviewIdx(null)}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            className="flex-1 grid place-items-center p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewIdx((i) => (i === null ? null : Math.max(0, i - 1)))}
              disabled={previewIdx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <img
              src={pages[previewIdx].url ?? ""}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() =>
                setPreviewIdx((i) =>
                  i === null ? null : Math.min(pages.length - 1, i + 1)
                )
              }
              disabled={previewIdx === pages.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center text-white/70 text-[11px] pb-3">
            Click outside, press Esc, or use ← → to navigate
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete page {pendingDelete?.ordinal}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the uploaded image from your answer. Remaining pages will be
              renumbered. You can re-capture and re-upload from your phone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
