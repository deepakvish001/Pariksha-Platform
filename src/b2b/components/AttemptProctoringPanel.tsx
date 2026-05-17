import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Monitor, Smartphone, Sparkles, RefreshCw, AlertTriangle, Video, Trash2, Download, ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Snap = { id: string; source: string; storage_path: string; captured_at: string; reviewed: boolean };
type Frame = { id: string; storage_path: string; captured_at: string };
type Finding = { id: string; snapshot_id: string; severity: string; finding: any; created_at: string };
type Recording = {
  id: string;
  kind: "webcam" | "screen" | "sideeye";
  storage_path: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
};

const BUCKET = "assessment-proctor";

async function signMany(paths: string[]) {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 600);
  const map: Record<string, string> = {};
  (data ?? []).forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
  return map;
}

import { useCanProctor } from "../hooks/usePermissions";

export default function AttemptProctoringPanel({ attemptId, orgId }: { attemptId: string; orgId?: string | null }) {
  const { canProctor, isLoading: roleLoading } = useCanProctor(orgId);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [s, f, fd, rec] = await Promise.all([
      supabase.from("assessment_proctor_snapshots").select("id,source,storage_path,captured_at,reviewed")
        .eq("attempt_id", attemptId).order("captured_at", { ascending: false }).limit(36),
      supabase.from("assessment_side_camera_frames").select("id,storage_path,captured_at")
        .eq("attempt_id", attemptId).order("captured_at", { ascending: false }).limit(18),
      supabase.from("assessment_proctor_findings").select("id,snapshot_id,severity,finding,created_at")
        .eq("attempt_id", attemptId).order("created_at", { ascending: false }).limit(50),
      supabase.from("assessment_proctor_recordings").select("id,kind,storage_path,started_at,ended_at,duration_ms,size_bytes")
        .eq("attempt_id", attemptId).order("started_at", { ascending: false }).limit(30),
    ]);
    const snapRows = (s.data ?? []) as Snap[];
    const frameRows = (f.data ?? []) as Frame[];
    const recRows = (rec.data ?? []) as Recording[];
    setSnaps(snapRows);
    setFrames(frameRows);
    setFindings((fd.data ?? []) as Finding[]);
    setRecordings(recRows);
    const allPaths = [
      ...snapRows.map((x) => x.storage_path),
      ...frameRows.map((x) => x.storage_path),
      ...recRows.map((x) => x.storage_path),
    ];
    setUrls(await signMany(allPaths));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [attemptId]);

  useEffect(() => {
    const ch = supabase.channel(`attempt-proctor-${attemptId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_snapshots", filter: `attempt_id=eq.${attemptId}` }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_side_camera_frames", filter: `attempt_id=eq.${attemptId}` }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_findings", filter: `attempt_id=eq.${attemptId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "assessment_proctor_recordings", filter: `attempt_id=eq.${attemptId}` }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [attemptId]);

  const findingBySnap = useMemo(() => {
    const m = new Map<string, Finding>();
    for (const f of findings) if (!m.has(f.snapshot_id)) m.set(f.snapshot_id, f);
    return m;
  }, [findings]);

  const webcam = snaps.filter((s) => s.source === "webcam");
  const screen = snaps.filter((s) => s.source === "screen");

  const sevColor = (sev: string) =>
    sev === "high" || sev === "critical" ? "bg-red-500/15 text-red-600 border-red-500/30"
    : sev === "medium" ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";

  const runReview = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("assessment-snapshot-review", { body: { attempt_id: attemptId } });
      if (error) throw error;
      toast.success("AI review queued");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "Review failed");
    } finally {
      setRunning(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const exportEvidence = async () => {
    setExporting(true);
    const t = toast.loading("Preparing evidence export…");
    try {
      // Pull EVERYTHING for this attempt (the on-screen lists are paginated).
      const [s, f, fd, rec] = await Promise.all([
        supabase.from("assessment_proctor_snapshots")
          .select("id,source,storage_path,captured_at,reviewed")
          .eq("attempt_id", attemptId).order("captured_at", { ascending: true }),
        supabase.from("assessment_side_camera_frames")
          .select("id,storage_path,captured_at")
          .eq("attempt_id", attemptId).order("captured_at", { ascending: true }),
        supabase.from("assessment_proctor_findings")
          .select("id,snapshot_id,severity,finding,created_at")
          .eq("attempt_id", attemptId).order("created_at", { ascending: true }),
        supabase.from("assessment_proctor_recordings")
          .select("id,kind,storage_path,started_at,ended_at,duration_ms,size_bytes")
          .eq("attempt_id", attemptId).order("started_at", { ascending: true }),
      ]);

      const allSnaps = (s.data ?? []) as Snap[];
      const allFrames = (f.data ?? []) as Frame[];
      const allFindings = (fd.data ?? []) as Finding[];
      const allRecs = (rec.data ?? []) as Recording[];

      const paths = [
        ...allSnaps.map((x) => x.storage_path),
        ...allFrames.map((x) => x.storage_path),
        ...allRecs.map((x) => x.storage_path),
      ];

      // Sign URLs in batches (createSignedUrls accepts up to ~100).
      const signed: Record<string, string> = {};
      for (let i = 0; i < paths.length; i += 80) {
        const batch = paths.slice(i, i + 80);
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(batch, 600);
        (data ?? []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
      }

      const zip = new JSZip();
      const root = zip.folder(`attempt-${attemptId}-evidence`)!;

      const safeName = (p: string) => p.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "file";
      const stamp = (iso: string) => iso.replace(/[:.]/g, "-");

      const downloadInto = async (
        folder: JSZip,
        rows: Array<{ storage_path: string; captured_at?: string; started_at?: string }>,
      ) => {
        let ok = 0, fail = 0;
        await Promise.all(rows.map(async (row) => {
          const url = signed[row.storage_path];
          if (!url) { fail++; return; }
          try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(String(r.status));
            const blob = await r.blob();
            const ts = stamp(row.captured_at ?? row.started_at ?? "");
            folder.file(`${ts}__${safeName(row.storage_path)}`, blob);
            ok++;
          } catch { fail++; }
        }));
        return { ok, fail };
      };

      const webcamFolder = root.folder("webcam")!;
      const screenFolder = root.folder("screen")!;
      const sideeyeFolder = root.folder("sideeye")!;
      const recFolder = root.folder("recordings")!;

      const [w, sc, se, rc] = await Promise.all([
        downloadInto(webcamFolder, allSnaps.filter((x) => x.source === "webcam")),
        downloadInto(screenFolder, allSnaps.filter((x) => x.source === "screen")),
        downloadInto(sideeyeFolder, allFrames),
        downloadInto(recFolder, allRecs),
      ]);

      root.file("findings.json", JSON.stringify(allFindings, null, 2));
      root.file(
        "index.json",
        JSON.stringify(
          {
            attempt_id: attemptId,
            exported_at: new Date().toISOString(),
            counts: {
              webcam: allSnaps.filter((x) => x.source === "webcam").length,
              screen: allSnaps.filter((x) => x.source === "screen").length,
              sideeye: allFrames.length,
              recordings: allRecs.length,
              findings: allFindings.length,
            },
            results: { webcam: w, screen: sc, sideeye: se, recordings: rc },
            snapshots: allSnaps,
            frames: allFrames,
            recordings: allRecs,
          },
          null,
          2,
        ),
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attempt-${attemptId}-evidence.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);

      const total = w.ok + sc.ok + se.ok + rc.ok;
      const failed = w.fail + sc.fail + se.fail + rc.fail;
      toast.success(
        failed
          ? `Exported ${total} files (${failed} failed)`
          : `Exported ${total} evidence files`,
        { id: t },
      );
    } catch (e) {
      toast.error((e as Error).message ?? "Export failed", { id: t });
    } finally {
      setExporting(false);
    }
  };

  type GalleryItem = {
    key: string;
    kind: "image" | "video";
    source: "webcam" | "screen" | "sideeye" | "recording-webcam" | "recording-screen" | "recording-sideeye";
    path: string;
    captured_at: string;
    finding?: Finding;
    label: string;
    duration_ms?: number | null;
    size_bytes?: number | null;
  };

  const gallery: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    for (const s of snaps) {
      items.push({
        key: `snap-${s.id}`,
        kind: "image",
        source: (s.source as any) === "screen" ? "screen" : "webcam",
        path: s.storage_path,
        captured_at: s.captured_at,
        finding: findingBySnap.get(s.id),
        label: s.source === "screen" ? "Screen capture" : "Webcam snapshot",
      });
    }
    for (const f of frames) {
      items.push({
        key: `frame-${f.id}`,
        kind: "image",
        source: "sideeye",
        path: f.storage_path,
        captured_at: f.captured_at,
        label: "Side-camera frame",
      });
    }
    for (const r of recordings) {
      items.push({
        key: `rec-${r.id}`,
        kind: "video",
        source: `recording-${r.kind}` as GalleryItem["source"],
        path: r.storage_path,
        captured_at: r.started_at,
        label: `${r.kind} recording`,
        duration_ms: r.duration_ms,
        size_bytes: r.size_bytes,
      });
    }
    return items;
  }, [snaps, frames, recordings, findingBySnap]);

  const [lightboxKey, setLightboxKey] = useState<string | null>(null);
  const lightboxIdx = lightboxKey ? gallery.findIndex((g) => g.key === lightboxKey) : -1;
  const lightboxItem = lightboxIdx >= 0 ? gallery[lightboxIdx] : null;
  const openLightbox = (key: string) => setLightboxKey(key);
  const stepLightbox = (delta: number) => {
    if (lightboxIdx < 0) return;
    const next = (lightboxIdx + delta + gallery.length) % gallery.length;
    setLightboxKey(gallery[next].key);
  };

  useEffect(() => {
    if (!lightboxKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") stepLightbox(1);
      else if (e.key === "ArrowLeft") stepLightbox(-1);
      else if (e.key === "Escape") setLightboxKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxKey, lightboxIdx, gallery.length]);

  const downloadOne = async (path: string) => {
    const url = urls[path] ?? (await signMany([path]))[path];
    if (!url) { toast.error("Could not load file"); return; }
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = path.split("/").pop() ?? "evidence";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 30_000);
    } catch (e) {
      toast.error("Download failed");
    }
  };

  const Tile = ({ item }: { item: GalleryItem }) => {
    const url = urls[item.path];
    const sev = item.finding?.severity ?? "";
    const isVideo = item.kind === "video";
    const srcIcon =
      item.source === "screen" || item.source === "recording-screen" ? Monitor
      : item.source === "sideeye" || item.source === "recording-sideeye" ? Smartphone
      : Camera;
    const SrcIcon = srcIcon;
    return (
      <button
        type="button"
        onClick={() => openLightbox(item.key)}
        className="group relative rounded-md overflow-hidden border border-[hsl(var(--border))] bg-black/40 aspect-video text-left focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {url ? (
          isVideo
            ? <video src={url} preload="metadata" muted className="w-full h-full object-cover" />
            : <img src={url} alt={item.path} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full animate-pulse bg-muted" />
        )}
        {isVideo && (
          <div className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="rounded-full bg-black/60 p-2"><Play className="h-4 w-4 text-white" /></div>
          </div>
        )}
        <div className="absolute top-1 left-1 flex gap-1">
          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
            <SrcIcon className="h-3 w-3" />
            {item.source.replace("recording-", "")}
          </Badge>
          {item.finding && <Badge variant="outline" className={`text-[10px] h-5 ${sevColor(sev)}`}>{sev}</Badge>}
        </div>
        <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[10px] text-white/85 bg-gradient-to-t from-black/70 to-transparent">
          {new Date(item.captured_at).toLocaleTimeString()}
        </div>
      </button>
    );
  };

  const highCount = findings.filter((f) => f.severity === "high" || f.severity === "critical").length;

  // Defence-in-depth: refuse to render proctoring evidence to non-proctor roles
  // even if a parent forgets to gate this component.
  if (roleLoading) return null;
  if (!canProctor) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 text-xs text-muted-foreground">
          You do not have permission to view proctoring evidence for this attempt.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Proctoring evidence
          {highCount > 0 && (
            <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-600 border-red-500/30 gap-1">
              <AlertTriangle className="h-3 w-3" /> {highCount} high
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportEvidence}
            disabled={exporting || (snaps.length === 0 && frames.length === 0 && recordings.length === 0)}
            title="Download all evidence (snapshots, side-cam, recordings) as ZIP"
          >
            <Download className="h-3 w-3 mr-1" /> {exporting ? "Exporting…" : "Export evidence"}
          </Button>
          <Button size="sm" variant="outline" onClick={runReview} disabled={running || snaps.length === 0}>
            <Sparkles className="h-3 w-3 mr-1" /> {running ? "Reviewing…" : "Run AI review"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {snaps.length === 0 && frames.length === 0 ? (
          <p className="text-xs text-muted-foreground">No proctoring evidence captured for this attempt.</p>
        ) : null}

        {webcam.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Camera className="h-3 w-3" /> Webcam snapshots ({webcam.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {webcam.slice(0, 12).map((s) => <Tile key={s.id} path={s.storage_path} captured_at={s.captured_at} finding={findingBySnap.get(s.id)} />)}
            </div>
          </div>
        )}

        {screen.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Monitor className="h-3 w-3" /> Screen captures ({screen.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {screen.slice(0, 9).map((s) => <Tile key={s.id} path={s.storage_path} captured_at={s.captured_at} finding={findingBySnap.get(s.id)} />)}
            </div>
          </div>
        )}

        {frames.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3" /> Third Eye side-camera ({frames.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {frames.slice(0, 12).map((f) => <Tile key={f.id} path={f.storage_path} captured_at={f.captured_at} source="sideeye" />)}
            </div>
          </div>
        )}

        {findings.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">AI findings ({findings.length})</p>
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {findings.map((f) => {
                const d = f.finding ?? {};
                const flags = [
                  d.phone_in_frame && "phone",
                  d.looking_away && "away",
                  typeof d.person_count === "number" && d.person_count !== 1 && `${d.person_count} people`,
                  d.identity_unclear && "identity unclear",
                ].filter(Boolean);
                return (
                  <div key={f.id} className="flex items-start gap-2 text-xs p-2 rounded border border-[hsl(var(--border))]">
                    <Badge variant="outline" className={`text-[10px] ${sevColor(f.severity)}`}>{f.severity}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{flags.length ? flags.join(" · ") : "clean"}</div>
                      {d.notes && <div className="text-muted-foreground line-clamp-2">{d.notes}</div>}
                    </div>
                    <span className="text-muted-foreground shrink-0">{new Date(f.created_at).toLocaleTimeString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recordings.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Video className="h-3 w-3" /> Recorded clips ({recordings.length})
            </p>
            <div className="space-y-2">
              {recordings.map((r) => {
                const url = urls[r.storage_path];
                const Icon = r.kind === "screen" ? Monitor : r.kind === "sideeye" ? Smartphone : Camera;
                const secs = r.duration_ms ? Math.round(r.duration_ms / 1000) : 0;
                const mb = r.size_bytes ? (r.size_bytes / 1_048_576).toFixed(1) : null;
                return (
                  <div key={r.id} className="rounded-md border border-[hsl(var(--border))] p-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium capitalize">{r.kind}</span>
                      <Badge variant="outline" className="text-[10px] h-5">{Math.floor(secs / 60)}m {secs % 60}s</Badge>
                      {mb && <span className="text-muted-foreground">{mb} MB</span>}
                      <span className="ml-auto text-muted-foreground">{new Date(r.started_at).toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5"
                        onClick={async () => {
                          const { error } = await supabase.from("assessment_proctor_recordings").delete().eq("id", r.id);
                          if (error) toast.error(error.message);
                          else {
                            await supabase.storage.from(BUCKET).remove([r.storage_path]).catch(() => { /* noop */ });
                            void refresh();
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {url ? (
                      <video src={url} controls preload="metadata" className="w-full max-h-72 rounded bg-black" />
                    ) : (
                      <div className="h-24 grid place-items-center text-[10px] text-muted-foreground">Loading…</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
