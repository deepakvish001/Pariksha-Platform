import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ShieldCheck, X, Loader2, User, Check, CheckCheck, Circle, CheckCheck as MarkReadIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  markMessagesRead,
  sendChatMessage,
  useAssessmentChat,
  useAutoMarkRead,
  useAutoScrollRef,
  useChatPresence,
  useUnreadCount,
  type AssessmentChatMessage,
  type ChatRole,
} from "../hooks/useAssessmentChat";

interface Props {
  attemptId: string;
  viewerRole: "candidate" | "proctor";
  /** Render mode: floating FAB+panel (student) or embedded panel (proctor side) */
  variant?: "floating" | "embedded";
  className?: string;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function roleLabel(role: ChatRole) {
  return role === "proctor" ? "Proctor" : role === "system" ? "System" : "You";
}

function lastSeenLabel(ts: number | null) {
  if (!ts) return "Offline";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Active just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${new Date(ts).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function lastReadLabel(ts: number | null) {
  if (!ts) return "No reads yet";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Last read just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Last read ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last read ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Last read ${days}d ago`;
  return `Last read ${new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

function TypingDots() {
  // Purely decorative — the surrounding text (or sr-only announcer) carries
  // the meaning, so we hide the animated dots from assistive tech.
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      <span className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
      <span className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
      <span className="h-1 w-1 rounded-full bg-current animate-bounce" />
    </span>
  );
}

export function AssessmentChatDock({
  attemptId,
  viewerRole,
  variant = "floating",
  className,
}: Props) {
  const [open, setOpen] = useState(variant === "embedded");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: messages, isLoading } = useAssessmentChat(attemptId);
  const isPanelVisible = open || variant === "embedded";
  const unread = useUnreadCount(messages, viewerRole);
  useAutoMarkRead(attemptId, messages, viewerRole, isPanelVisible);
  const { peer, sendTyping } = useChatPresence(attemptId, viewerRole, user?.id ?? null);
  const scrollRef = useAutoScrollRef<HTMLDivElement>(
    `${messages?.length ?? 0}:${peer.typingByRole?.candidate ? 1 : 0}:${peer.typingByRole?.proctor ? 1 : 0}`
  );

  const ordered = useMemo(() => messages ?? [], [messages]);
  const peerLabel = viewerRole === "candidate" ? "Proctor" : "Candidate";

  // Per-role typing — every role except the viewer's own.
  const typingRoles = useMemo(() => {
    const out: Array<"candidate" | "proctor"> = [];
    if (viewerRole !== "candidate" && peer.typingByRole?.candidate) out.push("candidate");
    if (viewerRole !== "proctor" && peer.typingByRole?.proctor) out.push("proctor");
    return out;
  }, [peer.typingByRole, viewerRole]);
  const anyTyping = typingRoles.length > 0;
  const typingLabel =
    typingRoles.length === 0
      ? ""
      : typingRoles.length === 1
      ? `${typingRoles[0] === "proctor" ? "Proctor" : "Candidate"} is typing…`
      : "Proctor and Candidate are typing…";

  // Separate announcements for presence vs typing so screen readers don't
  // re-read the online status on every typing toggle and vice versa.
  const presenceAnnouncement = useMemo(() => {
    if (peer.online) return `${peerLabel} is online.`;
    if (peer.lastSeen) {
      return `${peerLabel} went offline. ${lastSeenLabel(peer.lastSeen)}.`;
    }
    return `${peerLabel} is offline.`;
  }, [peer.online, peer.lastSeen, peerLabel]);
  const typingAnnouncement = useMemo(() => {
    if (!anyTyping) return "";
    if (typingRoles.length === 1) {
      return `${typingRoles[0] === "proctor" ? "Proctor" : "Candidate"} is typing.`;
    }
    return "Proctor and candidate are typing.";
  }, [anyTyping, typingRoles]);

  // Most recent moment the peer read one of our messages.
  const peerLastReadAt = useMemo(() => {
    let latest = 0;
    for (const m of ordered) {
      if (m.sender_role === viewerRole && m.read_by_recipient && m.read_at) {
        const t = new Date(m.read_at).getTime();
        if (t > latest) latest = t;
      }
    }
    return latest || null;
  }, [ordered, viewerRole]);

  // Stop signalling "typing" shortly after the user stops typing or sends.
  const typingStopTimer = useRef<number | null>(null);
  const signalTyping = (isTyping: boolean) => {
    sendTyping(isTyping);
    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    if (isTyping) {
      typingStopTimer.current = window.setTimeout(() => sendTyping(false), 3000);
    }
  };
  useEffect(() => () => {
    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    sendTyping(false);
  }, [sendTyping]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendChatMessage({ attemptId, role: viewerRole, body });
      setDraft("");
      sendTyping(false);
      if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    } catch (e) {
      toast.error("Couldn't send message", {
        description: e instanceof Error ? e.message : "Try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!attemptId || markingRead) return;
    const unreadMsgs = (messages ?? []).filter(
      (m) =>
        m.attempt_id === attemptId &&
        m.sender_role !== viewerRole &&
        m.sender_role !== "system" &&
        !m.read_by_recipient
    );
    if (!unreadMsgs.length) return;
    const ids = unreadMsgs.map((m) => m.id);
    const nowIso = new Date().toISOString();
    setMarkingRead(true);
    qc.setQueryData<AssessmentChatMessage[]>(["assessment-chat", attemptId], (prev) =>
      (prev ?? []).map((m) =>
        ids.includes(m.id) ? { ...m, read_by_recipient: true, read_at: nowIso } : m
      )
    );
    try {
      await markMessagesRead(ids, { attemptId, viewerRole });
      toast.success(`Marked ${ids.length} message${ids.length === 1 ? "" : "s"} as read`);
    } catch (e) {
      qc.invalidateQueries({ queryKey: ["assessment-chat", attemptId] });
      toast.error("Couldn't mark as read", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setMarkingRead(false);
    }
  };

  const Panel = (
    <div
      className={cn(
        "flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden",
        variant === "floating" ? "w-[340px] h-[440px]" : "w-full h-[420px]",
        className
      )}
      role="region"
      aria-label={viewerRole === "candidate" ? "Chat with proctor" : "Candidate chat"}
    >
      {/* Dedicated live regions so screen readers announce presence and
          typing changes independently, without re-reading the other state. */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {presenceAnnouncement}
      </span>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {typingAnnouncement}
      </span>
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-7 w-7 rounded-md bg-primary/15 text-primary grid place-items-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <Circle
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-card",
                peer.online
                  ? "fill-emerald-500 text-emerald-500"
                  : "fill-muted-foreground/60 text-muted-foreground/60"
              )}
              aria-hidden="true"
            />
            {/* Static label for AT — dynamic changes are announced via the
                dedicated live region below. */}
            <span className="sr-only">
              {peer.online ? `${peerLabel} online` : `${peerLabel} offline`}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate flex items-center gap-1.5">
              <span className="truncate">
                {viewerRole === "candidate" ? "Chat with proctor" : "Candidate chat"}
              </span>
              {unread > 0 && (
                <span
                  className="h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center shrink-0"
                  aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </p>
            {/* Visible status — decorative; the sr-only live regions below
                handle screen-reader announcements so presence and typing
                changes don't re-announce each other. */}
            <p
              className={cn(
                "text-[10px] leading-tight truncate flex items-center gap-1",
                anyTyping
                  ? "text-primary"
                  : peer.online
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
              aria-hidden="true"
            >
              {anyTyping ? (
                <>
                  <TypingDots />
                  <span>{typingLabel}</span>
                </>
              ) : peer.online ? (
                <span>{peerLabel} online</span>
              ) : (
                <span>{lastSeenLabel(peer.lastSeen)}</span>
              )}
            </p>
            <p
              className="text-[10px] leading-tight truncate text-muted-foreground"
              title={peerLastReadAt ? new Date(peerLastReadAt).toLocaleString() : undefined}
            >
              {lastReadLabel(peerLastReadAt)}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={handleMarkAllRead}
            disabled={markingRead}
            aria-label={`Mark ${unread} message${unread === 1 ? "" : "s"} as read`}
            title="Mark all as read"
          >
            {markingRead ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MarkReadIcon className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">Mark read</span>
          </Button>
        )}
        {variant === "floating" && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)} aria-label="Close chat">
            <X className="h-4 w-4" />
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 text-sm">
        {isLoading ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : ordered.length === 0 ? (
          <div className="h-full grid place-items-center text-center px-4">
            <div className="space-y-2 text-muted-foreground">
              <MessageCircle className="h-6 w-6 mx-auto opacity-70" />
              <p className="text-xs">
                {viewerRole === "candidate"
                  ? "Reach out to your proctor with any issues during the test."
                  : "No messages yet. Send the candidate a note if needed."}
              </p>
            </div>
          </div>
        ) : (
          ordered.map((m) => {
            const mine = m.sender_role === viewerRole;
            const sys = m.sender_role === "system";
            return (
              <div
                key={m.id}
                className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                  {!mine && !sys && (
                    <span className="inline-flex items-center gap-1">
                      {m.sender_role === "proctor" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {roleLabel(m.sender_role)}
                    </span>
                  )}
                  <span>{timeLabel(m.created_at)}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-1.5 text-sm leading-snug whitespace-pre-wrap break-words border",
                    sys
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 mx-auto text-center text-xs"
                      : mine
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border"
                  )}
                >
                  {m.body}
                </div>
                {mine && !sys && (
                  <div
                    className="flex items-center gap-1 text-[10px] text-muted-foreground px-1"
                    aria-label={m.read_by_recipient ? "Read" : "Sent"}
                    title={
                      m.read_by_recipient && m.read_at
                        ? `Read ${timeLabel(m.read_at)}`
                        : "Sent"
                    }
                  >
                    {m.read_by_recipient ? (
                      <>
                        <CheckCheck className="h-3 w-3 text-primary" />
                        <span className="text-primary">Read</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        {anyTyping && ordered.length > 0 && (
          // Visual-only — announcer above already speaks the typing state.
          <div className="flex flex-col gap-1 items-start" aria-hidden="true">
            {typingRoles.map((role) => (
              <div
                key={role}
                className="max-w-[85%] rounded-lg px-3 py-2 bg-muted text-muted-foreground border border-border inline-flex items-center gap-1.5 text-xs"
              >
                <TypingDots />
                <span>{role === "proctor" ? "Proctor" : "Candidate"} is typing…</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2 bg-card">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              signalTyping(v.trim().length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              viewerRole === "candidate"
                ? "Message your proctor… (Enter to send)"
                : "Message the candidate… (Enter to send)"
            }
            rows={2}
            maxLength={2000}
            className="resize-none text-sm min-h-[44px]"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="h-9 w-9 p-0 shrink-0"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  if (variant === "embedded") return Panel;

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-3"
          >
            {Panel}
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-12 w-12 rounded-full p-0 shadow-xl relative"
          aria-label={`Open chat${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center border-2 border-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
