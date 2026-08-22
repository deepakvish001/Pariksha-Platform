import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Monitor, Smartphone, Play, Pause, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCanProctor } from "../hooks/usePermissions";

type Kind = "webcam" | "screen" | "sideeye";

interface Chunk {
  id: string;
  kind: Kind;
  seq: number;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  storage_path: string;
}

interface Loaded extends Chunk {
  start_ms: number; // offset from attempt start
  end_ms: number;
  url: string | null;
}

const BUCKET = "assessment-proctor";
const KIND_ICON: Record<Kind, typeof Camera> = { webcam: Camera, screen: Monitor, sideeye: Smartphone };
const KIND_LABEL: Record<Kind, string> = { webcam: "Webcam", screen: "Screen", sideeye: "Side cam" };

interface Marker {
  at: string;
  label: string;
  tone?: "ok" | "warn" | "info";
}

interface Props {
  attemptId: string;
  attemptStartedAt: string | null;
  orgId?: string | null;
  markers?: Marker[];
}

export default function SessionTimelinePlayer({ attemptId, attemptStartedAt, orgId, markers = [] }: Props) {
  const { canProctor, isLoading: roleLoading } = useCanProctor(orgId);
  const [chunksByKind, setChunksByKind] = useState<Record<Kind, Loaded[]>>({
    webcam: [], screen: [], sideeye: [],
  });
  const [loading, setLoading] = useState(true);
  const [t, setT] = useState(0); // ms from attempt start
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const videoRefs = useRef<Record<Kind, HTMLVideoElement | null>>({
    webcam: null, screen: null, sideeye: null,
  });

  const loadChunks = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading((prev) => (chunksByKind.webcam.length + chunksByKind.screen.length + chunksByKind.sideeye.length === 0 ? true : prev));
      const { data, error } = await supabase
        .from("assessment_proctor_session_chunks")
        .select("id,kind,seq,started_at,ended_at,duration_ms,storage_path")
        .eq("attempt_id", attemptId)
        .order("started_at", { ascending: true });
      if (cancelled || error) { setLoading(false); return; }
      const rows = (data ?? []) as Chunk[];
      const paths = rows.map((r) => r.storage_path);
      const signed: Record<string, string> = {};
      for (let i = 0; i < paths.length; i += 80) {
        const batch = paths.slice(i, i + 80);
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrls(batch, 3600);
        (s ?? []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
      }
      const anchor = attemptStartedAt
        ? new Date(attemptStartedAt).getTime()
        : rows[0] ? new Date(rows[0].started_at).getTime() : Date.now();
      const grouped: Record<Kind, Loaded[]> = { webcam: [], screen: [], sideeye: [] };
      let maxEnd = 0;
      for (const r of rows) {
        const start_ms = new Date(r.started_at).getTime() - anchor;
        const end_ms = new Date(r.ended_at).getTime() - anchor;
        grouped[r.kind].push({ ...r, start_ms, end_ms, url: signed[r.storage_path] ?? null });
        if (end_ms > maxEnd) maxEnd = end_ms;
      }
      (Object.keys(grouped) as Kind[]).forEach((k) => grouped[k].sort((a, b) => a.start_ms - b.start_ms));
      if (cancelled) return;
      setChunksByKind(grouped);
      setDuration((prev) => Math.max(prev, maxEnd));
      setLoading(false);
    };
    loadChunks.current = run;
    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, attemptStartedAt]);

  // Realtime: pull in newly-uploaded chunks as they land (post-submit ingest, late side-cam uploads, etc.)
  useEffect(() => {
    const ch = supabase
      .channel(`attempt-session-chunks-${attemptId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessment_proctor_session_chunks", filter: `attempt_id=eq.${attemptId}` },
        () => { void loadChunks.current?.(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [attemptId]);


  // Locate active chunk + offset within it for a given kind at time `t`.
  const seekKind = (k: Kind, target: number) => {
    const v = videoRefs.current[k];
    if (!v) return;
    const list = chunksByKind[k];
    const active = list.find((c) => target >= c.start_ms && target < c.end_ms);
    if (!active) {
      if (!v.paused) v.pause();
      if (v.dataset.src !== "") {
        v.removeAttribute("src");
        v.load();
        v.dataset.src = "";
      }
      return;
    }
    const offsetSec = Math.max(0, (target - active.start_ms) / 1000);
    if (v.dataset.src !== active.url) {
      v.src = active.url ?? "";
      v.dataset.src = active.url ?? "";
      const onMeta = () => {
        try { v.currentTime = offsetSec; } catch { /* noop */ }
        v.removeEventListener("loadedmetadata", onMeta);
        if (playing) v.play().catch(() => { /* noop */ });
      };
      v.addEventListener("loadedmetadata", onMeta);
    } else if (Math.abs(v.currentTime - offsetSec) > 0.4) {
      try { v.currentTime = offsetSec; } catch { /* noop */ }
    }
  };

  // Sync all three videos whenever `t` changes from scrubbing.
  useEffect(() => {
    (Object.keys(chunksByKind) as Kind[]).forEach((k) => seekKind(k, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunksByKind]);

  // Playback loop using requestAnimationFrame; videos play themselves once
  // seeked, this loop just advances the canonical playhead `t`.
  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= duration) { setPlaying(false); return duration; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    (Object.keys(videoRefs.current) as Kind[]).forEach((k) => {
      const v = videoRefs.current[k];
      v?.play().catch(() => { /* noop */ });
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      (Object.keys(videoRefs.current) as Kind[]).forEach((k) => {
        videoRefs.current[k]?.pause();
      });
    };
  }, [playing, duration]);

  // When playhead crosses a chunk boundary, swap the video src for that kind.
  useEffect(() => {
    (Object.keys(chunksByKind) as Kind[]).forEach((k) => seekKind(k, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const totalChunks = useMemo(
    () => chunksByKind.webcam.length + chunksByKind.screen.length + chunksByKind.sideeye.length,
    [chunksByKind],
  );

  if (roleLoading) return null;
  if (!canProctor) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Session replay
          <Badge variant="secondary" className="text-[10px] h-5">{totalChunks} chunks</Badge>
          {duration > 0 && (
            <Badge variant="outline" className="text-[10px] h-5">{fmt(duration)}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading session…</p>
        ) : totalChunks === 0 ? (
          <p className="text-xs text-muted-foreground">
            No continuous recording was captured for this attempt. The candidate's session may
            have been completed before the feature was enabled, or full-session recording was
            disabled in the proctoring settings.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {(["webcam", "screen", "sideeye"] as Kind[]).map((k) => {
                const Icon = KIND_ICON[k];
                const list = chunksByKind[k];
                const hasAtT = list.some((c) => t >= c.start_ms && t < c.end_ms);
                return (
                  <div key={k} className="relative rounded-md overflow-hidden border border-[hsl(var(--border))] bg-black aspect-video">
                    <video
                      ref={(el) => { videoRefs.current[k] = el; }}
                      playsInline
                      muted
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                        <Icon className="h-3 w-3" /> {KIND_LABEL[k]}
                      </Badge>
                    </div>
                    {!hasAtT && (
                      <div className="absolute inset-0 grid place-items-center text-[11px] text-white/60 bg-black/70">
                        No signal at {fmt(t)}
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="outline" className="text-[10px] h-5 bg-black/50 text-white/80 border-white/20">
                        {list.length} chunks
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="h-8" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setPlaying(false); setT(0); }} aria-label="Restart">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {fmt(t)} / {fmt(duration)}
              </span>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, duration)}
                  step={500}
                  value={t}
                  onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
                  className="w-full accent-primary relative z-10"
                />
                {(() => {
                  const anchor = attemptStartedAt ? new Date(attemptStartedAt).getTime() : null;
                  if (!anchor || duration <= 0) return null;
                  return (
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
                      {markers.map((m, i) => {
                        const off = new Date(m.at).getTime() - anchor;
                        if (off < 0 || off > duration) return null;
                        const pct = (off / duration) * 100;
                        const color = m.tone === "warn" ? "bg-amber-500" : m.tone === "ok" ? "bg-emerald-500" : "bg-sky-500";
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setPlaying(false); setT(off); }}
                            title={`${m.label} — ${new Date(m.at).toLocaleTimeString()}`}
                            className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-0.5 ${color} hover:h-3 transition-all`}
                            style={{ left: `${pct}%` }}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Videos are independent per-eye streams. Gaps appear where that eye was offline.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
