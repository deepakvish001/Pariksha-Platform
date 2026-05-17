import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ShieldCheck, X, Loader2, User, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  sendChatMessage,
  useAssessmentChat,
  useAutoMarkRead,
  useAutoScrollRef,
  useUnreadCount,
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

export function AssessmentChatDock({
  attemptId,
  viewerRole,
  variant = "floating",
  className,
}: Props) {
  const [open, setOpen] = useState(variant === "embedded");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages, isLoading } = useAssessmentChat(attemptId);
  const isPanelVisible = open || variant === "embedded";
  const unread = useUnreadCount(messages, viewerRole);
  useAutoMarkRead(attemptId, messages, viewerRole, isPanelVisible);
  const scrollRef = useAutoScrollRef<HTMLDivElement>(messages?.length ?? 0);

  const ordered = useMemo(() => messages ?? [], [messages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendChatMessage({ attemptId, role: viewerRole, body });
      setDraft("");
    } catch (e) {
      toast.error("Couldn't send message", {
        description: e instanceof Error ? e.message : "Try again in a moment.",
      });
    } finally {
      setSending(false);
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
      aria-label="Proctor chat"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/15 text-primary grid place-items-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {viewerRole === "candidate" ? "Chat with proctor" : "Candidate chat"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">
              {ordered.length} {ordered.length === 1 ? "message" : "messages"} · live
            </p>
          </div>
        </div>
        {variant === "floating" && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
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
      </div>

      <div className="border-t border-border p-2 bg-card">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
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
