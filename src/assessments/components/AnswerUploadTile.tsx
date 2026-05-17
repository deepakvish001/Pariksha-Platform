import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Smartphone, CheckCircle2, ImageIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

/**
 * Tile shown inside descriptive (subjective) questions. Lets the candidate
 * deep-link their already-paired phone into the answer-sheet capture flow,
 * then pulls the resulting pages back into the question answer with a Sync
 * button (also auto-syncs via realtime).
 */
export function AnswerUploadTile({ attemptId, questionId, onPagesChange }: Props) {
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

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

  return (
    <div className="rounded-lg border bg-card/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" /> Upload answer sheets from phone
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Capture handwritten pages on your paired phone, then click <strong>Sync</strong> to
            attach them to this answer.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={sync} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Sync</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs">
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
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreviewIdx(i)}
              className={cn(
                "relative aspect-[3/4] rounded border bg-muted overflow-hidden",
                "hover:ring-2 hover:ring-primary/40"
              )}
              aria-label={`Page ${p.ordinal}`}
            >
              {p.url ? (
                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="grid place-items-center h-full text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[10px] font-mono bg-black/55 text-white px-1 rounded">
                {p.ordinal}
              </span>
            </button>
          ))}
        </div>
      )}

      {previewIdx !== null && pages[previewIdx]?.url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4"
          onClick={() => setPreviewIdx(null)}
        >
          <img
            src={pages[previewIdx].url ?? ""}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
          <div className="absolute bottom-3 left-0 right-0 text-center text-white text-xs">
            Page {pages[previewIdx].ordinal} of {pages.length} · tap to close
          </div>
        </div>
      )}
    </div>
  );
}
