import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, Bell, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface AuditEvent {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  detail: any;
}

interface FrameRow {
  id: string;
  captured_at: string;
  severity: string;
  ai_summary: any;
  storage_path: string;
}

interface NotificationRow {
  id: string;
  created_at: string;
  type: string;
  title: string | null;
  message: string | null;
  data: any;
}

interface Props {
  sessionId: string;
  event: AuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** time window (minutes) to use when event has no exact frame */
  windowMinutes?: number;
}

const sevColor: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  critical: "bg-red-500/25 text-red-300 border-red-500/50",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  flag: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  fatal: "bg-red-500/25 text-red-300 border-red-500/50",
};

const KINDS = ["secondary_device", "extra_person", "candidate_absent", "earpiece_visible", "looking_down_at_notes"];

export const SideEyeAuditDetailsDrawer = ({ sessionId, event, open, onOpenChange, windowMinutes = 2 }: Props) => {
  const [frame, setFrame] = useState<FrameRow | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    let alive = true;
    setLoading(true);
    setFrame(null);
    setThumb(null);
    setNotifications(null);

    (async () => {
      const eventTime = new Date(event.created_at);
      const lo = new Date(eventTime.getTime() - windowMinutes * 60_000).toISOString();
      const hi = new Date(eventTime.getTime() + windowMinutes * 60_000).toISOString();

      // 1) Find the most relevant frame: prefer the storage_path embedded in audit detail
      const detailPath: string | undefined = event.detail?.storage_path;
      let f: FrameRow | null = null;

      if (detailPath) {
        const { data } = await supabase
          .from("contest_side_camera_frames")
          .select("id, captured_at, severity, ai_summary, storage_path")
          .eq("session_id", sessionId)
          .eq("storage_path", detailPath)
          .maybeSingle();
        f = (data as FrameRow) ?? null;
      }
      if (!f) {
        const { data } = await supabase
          .from("contest_side_camera_frames")
          .select("id, captured_at, severity, ai_summary, storage_path")
          .eq("session_id", sessionId)
          .gte("captured_at", lo)
          .lte("captured_at", hi)
          .order("captured_at", { ascending: false })
          .limit(1);
        f = ((data as FrameRow[]) ?? [])[0] ?? null;
      }

      // 2) Signed URL for thumbnail
      let signed: string | null = null;
      if (f?.storage_path) {
        const { data: s } = await supabase.storage
          .from("contest-side-camera")
          .createSignedUrl(f.storage_path, 300);
        signed = s?.signedUrl ?? null;
      }

      // 3) Related notifications in the same time window for this session
      const { data: n } = await supabase
        .from("notifications")
        .select("id, created_at, type, title, body, metadata")
        .gte("created_at", lo)
        .lte("created_at", hi)
        .like("type", "contest_%")
        .order("created_at", { ascending: false })
        .limit(50);

      const filtered = ((n as NotificationRow[]) ?? []).filter(
        (row) => row.metadata?.session_id === sessionId,
      );

      if (!alive) return;
      setFrame(f);
      setThumb(signed);
      setNotifications(filtered);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [open, event, sessionId, windowMinutes]);

  if (!event) return null;

  const tags = KINDS.filter((k) => frame?.ai_summary?.[k]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            {event.event_type}
            <Badge variant="outline" className={`${sevColor[event.severity] ?? ""} text-[10px]`}>
              {event.severity}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {format(new Date(event.created_at), "PPpp")} • Session {sessionId.slice(0, 8)}…
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading details…
          </div>
        )}

        {/* Thumbnail */}
        <section className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Frame snapshot
          </h4>
          {thumb ? (
            <a href={thumb} target="_blank" rel="noreferrer">
              <img
                src={thumb}
                alt="Side camera frame"
                className="w-full rounded border border-border/40 object-cover max-h-72"
              />
            </a>
          ) : (
            <div className="text-xs text-muted-foreground rounded border border-dashed border-border/40 px-3 py-4 text-center">
              No frame available within ±{windowMinutes} min of this event.
            </div>
          )}
          {frame && (
            <div className="text-[11px] text-muted-foreground">
              Captured {format(new Date(frame.captured_at), "HH:mm:ss")} •{" "}
              <Badge variant="outline" className={`${sevColor[frame.severity] ?? ""} text-[9px]`}>
                {frame.severity}
              </Badge>
            </div>
          )}
        </section>

        {/* AI findings */}
        <section className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> AI findings
          </h4>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="destructive" className="text-[9px]">
                  {t.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          )}
          <div className="rounded border border-border/40 bg-muted/20 p-2 text-xs whitespace-pre-wrap">
            {frame?.ai_summary?.notes ?? event.detail?.summary?.notes ?? "(no AI notes)"}
          </div>
          {(frame?.ai_summary || event.detail?.summary) && (
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer">Raw AI summary</summary>
              <pre className="mt-1 p-2 rounded bg-muted/30 overflow-auto text-[10px]">
                {JSON.stringify(frame?.ai_summary ?? event.detail?.summary, null, 2)}
              </pre>
            </details>
          )}
        </section>

        {/* Audit detail JSON */}
        <section className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold">Audit event detail</h4>
          <pre className="text-[10px] p-2 rounded bg-muted/30 overflow-auto max-h-40">
            {JSON.stringify(event.detail ?? {}, null, 2)}
          </pre>
        </section>

        {/* Related notifications */}
        <section className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Bell className="h-3 w-3" /> Related notifications
            {notifications && (
              <span className="text-[10px] text-muted-foreground">({notifications.length})</span>
            )}
          </h4>
          <div className="divide-y divide-border/40 border border-border/40 rounded max-h-56 overflow-auto">
            {(notifications ?? []).map((n) => (
              <div key={n.id} className="px-2 py-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{n.title ?? n.type}</span>
                  <span className="font-mono text-muted-foreground shrink-0">
                    {format(new Date(n.created_at), "HH:mm:ss")}
                  </span>
                </div>
                {n.body && <p className="text-muted-foreground line-clamp-2">{n.body}</p>}
              </div>
            ))}
            {notifications && notifications.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">
                No notifications fired in this time window.
              </div>
            )}
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
};

export default SideEyeAuditDetailsDrawer;
