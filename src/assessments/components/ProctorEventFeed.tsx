import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Camera,
  Clipboard,
  Eye,
  EyeOff,
  Flag,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  StickyNote,
  Trash2,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";


type Severity = "info" | "warn" | "critical" | "chat";

interface FeedEntry {
  key: string;
  ts: number; // ms epoch for sorting
  iso: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  severity: Severity;
  source: "event" | "chat";
}

interface EventRow {
  id: string;
  kind: string;
  payload: any;
  created_at: string;
}

interface ChatRow {
  id: string;
  sender_role: "candidate" | "proctor" | "system" | string;
  body: string;
  created_at: string;
}

interface NoteRow {
  id: string;
  event_id: string;
  attempt_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  attemptId: string;
  className?: string;
  maxHeight?: number;
}

const KIND_MAP: Record<string, { icon: LucideIcon; label: string; severity: Severity }> = {
  sos: { icon: LifeBuoy, label: "SOS raised", severity: "critical" },
  focus_loss: { icon: EyeOff, label: "Window focus lost", severity: "warn" },
  focus_return: { icon: Eye, label: "Window focus returned", severity: "info" },
  tab_switch: { icon: EyeOff, label: "Tab switched", severity: "warn" },
  fullscreen_exit: { icon: EyeOff, label: "Left full-screen", severity: "warn" },
  fullscreen_enter: { icon: Eye, label: "Entered full-screen", severity: "info" },
  paste: { icon: Clipboard, label: "Paste detected", severity: "warn" },
  copy: { icon: Clipboard, label: "Copy detected", severity: "info" },
  network_offline: { icon: WifiOff, label: "Network dropped", severity: "warn" },
  network_online: { icon: Wifi, label: "Network restored", severity: "info" },
  camera_lost: { icon: Camera, label: "Camera lost", severity: "critical" },
  camera_ok: { icon: Camera, label: "Camera restored", severity: "info" },
  mic_lost: { icon: MicOff, label: "Mic lost", severity: "critical" },
  mic_ok: { icon: Mic, label: "Mic restored", severity: "info" },
  thirdeye_paired: { icon: Smartphone, label: "Third Eye paired", severity: "info" },
  thirdeye_lost: { icon: Smartphone, label: "Third Eye disconnected", severity: "warn" },
  answer_save: { icon: Save, label: "Answer saved", severity: "info" },
  flag: { icon: Flag, label: "Question flagged", severity: "info" },
  submit: { icon: ShieldCheck, label: "Test submitted", severity: "info" },
  pause: { icon: Pause, label: "Attempt paused", severity: "warn" },
  resume: { icon: Play, label: "Attempt resumed", severity: "info" },
  violation: { icon: ShieldAlert, label: "Integrity violation", severity: "critical" },
};

function describeEvent(row: EventRow): FeedEntry {
  const map = KIND_MAP[row.kind] ?? {
    icon: Activity,
    label: row.kind.replace(/_/g, " "),
    severity: "info" as Severity,
  };
  let detail: string | undefined;
  if (row.payload && typeof row.payload === "object") {
    if (row.kind === "sos") {
      detail = [row.payload.issue, row.payload.notes].filter(Boolean).join(" — ");
    } else if (row.payload.message) {
      detail = String(row.payload.message);
    } else if (row.payload.reason) {
      detail = String(row.payload.reason);
    }
  }
  return {
    key: `e:${row.id}`,
    ts: new Date(row.created_at).getTime(),
    iso: row.created_at,
    icon: map.icon,
    label: map.label,
    detail,
    severity: map.severity,
    source: "event",
  };
}

function describeChat(row: ChatRow): FeedEntry {
  const who =
    row.sender_role === "candidate"
      ? "Candidate"
      : row.sender_role === "proctor"
      ? "Proctor"
      : "System";
  return {
    key: `c:${row.id}`,
    ts: new Date(row.created_at).getTime(),
    iso: row.created_at,
    icon: row.sender_role === "system" ? AlertTriangle : MessageSquare,
    label: `${who} message`,
    detail: row.body,
    severity: row.sender_role === "system" ? "warn" : "chat",
    source: "chat",
  };
}

const SEVERITY_STYLES: Record<Severity, string> = {
  info: "border-border bg-muted/30 text-foreground",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "border-destructive/50 bg-destructive/10 text-destructive",
  chat: "border-primary/30 bg-primary/5 text-foreground",
};

const ICON_STYLES: Record<Severity, string> = {
  info: "text-muted-foreground",
  warn: "text-amber-600 dark:text-amber-400",
  critical: "text-destructive",
  chat: "text-primary",
};

export function ProctorEventFeed({ attemptId, className, maxHeight = 420 }: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [filter, setFilter] = useState<"all" | "events" | "chat" | "critical">("all");
  const [autoscroll, setAutoscroll] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Identify the proctor so we can stamp authorship and gate delete actions.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (cancelled || !user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCurrentUserName(
        profile?.full_name?.trim() ||
          (user.user_metadata as any)?.full_name ||
          user.email ||
          null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  // Initial load + realtime subscriptions for both streams.
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    (async () => {
      const [evtRes, chatRes, noteRes] = await Promise.all([
        supabase
          .from("attempt_events")
          .select("id, kind, payload, created_at")
          .eq("attempt_id", attemptId)
          .order("created_at", { ascending: true })
          .limit(500),
        supabase
          .from("assessment_chat_messages")
          .select("id, sender_role, body, created_at")
          .eq("attempt_id", attemptId)
          .order("created_at", { ascending: true })
          .limit(500),
        supabase
          .from("attempt_event_notes")
          .select("*")
          .eq("attempt_id", attemptId)
          .order("created_at", { ascending: true })
          .limit(1000),
      ]);
      if (cancelled) return;
      if (evtRes.data) setEvents(evtRes.data as EventRow[]);
      if (chatRes.data) setChats(chatRes.data as ChatRow[]);
      if (noteRes.data) setNotes(noteRes.data as NoteRow[]);
    })();

    const channel = supabase
      .channel(`proctor-feed-${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attempt_events",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as EventRow]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assessment_chat_messages",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          setChats((prev) => [...prev, payload.new as ChatRow]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attempt_event_notes",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          setNotes((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as NoteRow;
              if (prev.some((n) => n.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as NoteRow;
              return prev.map((n) => (n.id === row.id ? row : n));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Partial<NoteRow>;
              return prev.filter((n) => n.id !== row.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  const merged = useMemo<FeedEntry[]>(() => {
    const all = [...events.map(describeEvent), ...chats.map(describeChat)];
    all.sort((a, b) => a.ts - b.ts);
    if (filter === "events") return all.filter((e) => e.source === "event");
    if (filter === "chat") return all.filter((e) => e.source === "chat");
    if (filter === "critical") return all.filter((e) => e.severity === "critical" || e.severity === "warn");
    return all;
  }, [events, chats, filter]);

  useEffect(() => {
    if (!autoscroll) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [merged, autoscroll]);

  const counts = useMemo(() => {
    const critical = events.filter((e) => KIND_MAP[e.kind]?.severity === "critical").length;
    const warn = events.filter((e) => KIND_MAP[e.kind]?.severity === "warn").length;
    return { total: events.length + chats.length, critical, warn, chat: chats.length };
  }, [events, chats]);

  const notesByEvent = useMemo(() => {
    const map = new Map<string, NoteRow[]>();
    for (const n of notes) {
      const arr = map.get(n.event_id) ?? [];
      arr.push(n);
      map.set(n.event_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return map;
  }, [notes]);

  const addNote = async (eventId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return false;
    if (!currentUserId) {
      toast.error("Sign in required to add notes");
      return false;
    }
    // Optimistic insert keeps the thread snappy while realtime catches up.
    const tempId = `temp-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    setNotes((prev) => [
      ...prev,
      {
        id: tempId,
        event_id: eventId,
        attempt_id: attemptId,
        author_id: currentUserId,
        author_name: currentUserName,
        body: trimmed,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
    const { data, error } = await supabase
      .from("attempt_event_notes")
      .insert({
        event_id: eventId,
        attempt_id: attemptId,
        author_id: currentUserId,
        author_name: currentUserName,
        body: trimmed,
      })
      .select("*")
      .single();
    if (error) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      toast.error("Couldn't save note", { description: error.message });
      return false;
    }
    setNotes((prev) => {
      const without = prev.filter((n) => n.id !== tempId && n.id !== data.id);
      return [...without, data as NoteRow];
    });
    return true;
  };

  const deleteNote = async (noteId: string) => {
    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    const { error } = await supabase.from("attempt_event_notes").delete().eq("id", noteId);
    if (error) {
      setNotes(snapshot);
      toast.error("Couldn't delete note", { description: error.message });
    }
  };


  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      <header className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mr-auto">
          <span className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-primary">
            <Activity className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Live event feed</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Streaming
              </span>
              <span>·</span>
              <span className="tabular-nums">{counts.total} entries</span>
              {counts.critical > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                  {counts.critical} critical
                </Badge>
              )}
              {counts.warn > 0 && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-300"
                >
                  {counts.warn} warn
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-medium">
          {(["all", "events", "chat", "critical"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-2 py-1 capitalize transition-colors",
                filter === f
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAutoscroll((s) => !s)}
              className={cn("h-7 px-2 text-[11px]", autoscroll && "border-primary/40 text-primary")}
              aria-pressed={autoscroll}
            >
              <ArrowDownToLine className="h-3 w-3 mr-1" />
              {autoscroll ? "Auto" : "Manual"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Auto-scroll to newest</TooltipContent>
        </Tooltip>
      </header>

      <div
        ref={scrollRef}
        className="overflow-y-auto px-2 py-2 space-y-1.5"
        style={{ maxHeight }}
      >
        {merged.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">
            No events yet. Activity will appear here in real time.
          </div>
        ) : (
          merged.map((e) => {
            const Icon = e.icon;
            const time = new Date(e.iso).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const eventId = e.source === "event" ? e.key.slice(2) : null;
            const eventNotes = eventId ? notesByEvent.get(eventId) ?? [] : [];
            return (
              <div
                key={e.key}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs",
                  SEVERITY_STYLES[e.severity]
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", ICON_STYLES[e.severity])} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold leading-tight truncate">{e.label}</span>
                    <span className="ml-auto text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {time}
                    </span>
                  </div>
                  {e.detail && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug whitespace-pre-wrap break-words">
                      {e.detail}
                    </div>
                  )}
                  {eventId && (
                    <EventNotesThread
                      notes={eventNotes}
                      currentUserId={currentUserId}
                      canAdd={!!currentUserId}
                      onAdd={(body) => addNote(eventId, body)}
                      onDelete={deleteNote}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function authorInitials(name: string | null, fallbackId: string): string {
  const src = (name && name.trim()) || fallbackId;
  const parts = src.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

interface EventNotesThreadProps {
  notes: NoteRow[];
  currentUserId: string | null;
  canAdd: boolean;
  onAdd: (body: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void> | void;
}

function EventNotesThread({ notes, currentUserId, canAdd, onAdd, onDelete }: EventNotesThreadProps) {
  const [open, setOpen] = useState(notes.length > 0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Auto-expand when a note arrives from realtime, so collaborating
    // proctors see context the moment a teammate adds it.
    if (notes.length > 0) setOpen(true);
  }, [notes.length]);

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const ok = await onAdd(draft);
    setSaving(false);
    if (ok) {
      setDraft("");
      setComposing(false);
    }
  };

  const hasNotes = notes.length > 0;

  return (
    <div className="mt-2 -ml-5 pl-5 border-l border-border/60">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          aria-expanded={open}
        >
          <StickyNote className="h-3 w-3" />
          <span>
            Proctor notes
            {hasNotes && <span className="ml-1 tabular-nums">({notes.length})</span>}
          </span>
        </button>
        {canAdd && !composing && (
          <button
            type="button"
            onClick={() => {
              setComposing(true);
              setOpen(true);
            }}
            className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add note
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1.5 space-y-1.5">
          {hasNotes ? (
            notes.map((n) => {
              const mine = n.author_id === currentUserId;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5"
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-semibold"
                    aria-hidden
                  >
                    {authorInitials(n.author_name, n.author_id)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground truncate">
                        {n.author_name?.trim() || "Proctor"}
                        {mine && <span className="ml-1 text-[9px] text-primary">(you)</span>}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="tabular-nums">{formatRelative(n.created_at)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(n.created_at).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                      {mine && (
                        <button
                          type="button"
                          onClick={() => onDelete(n.id)}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-foreground/90 mt-0.5 leading-snug whitespace-pre-wrap break-words">
                      {n.body}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            !composing && (
              <div className="text-[10px] text-muted-foreground italic">
                No notes on this event yet.
              </div>
            )
          )}

          {composing && (
            <div className="rounded-md border border-border bg-background/80 p-1.5 space-y-1.5">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add context for the team (e.g. confirmed via call, false alarm)…"
                rows={2}
                className="text-[11px] resize-none min-h-[44px]"
                autoFocus
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    setComposing(false);
                    setDraft("");
                  }}
                  disabled={saving}
                >
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => void submit()}
                  disabled={saving || !draft.trim()}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save note
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
