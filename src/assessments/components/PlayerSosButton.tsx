import { useState } from "react";
import { AlertTriangle, LifeBuoy, Loader2, Mail, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_EMAIL = "support@parikshaa.app";
const SUPPORT_PHONE = "+91 80000 00000";

const QUICK_ISSUES = [
  "Camera or microphone stopped working",
  "Internet keeps disconnecting",
  "Question won't load / page frozen",
  "Power outage or device failure",
  "Other emergency — need help now",
];

interface Props {
  attemptId?: string | null;
  assessmentTitle?: string;
  compact?: boolean;
}

export function PlayerSosButton({ attemptId, assessmentTitle, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "details">("confirm");
  const [issue, setIssue] = useState<string>(QUICK_ISSUES[0]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setStep("confirm");
    setIssue(QUICK_ISSUES[0]);
    setNotes("");
    setSending(false);
  };

  const buildSubject = () =>
    encodeURIComponent(`SOS during assessment${assessmentTitle ? ` — ${assessmentTitle}` : ""}`);
  const buildBody = () =>
    encodeURIComponent(
      [
        `Issue: ${issue}`,
        notes ? `\nDetails:\n${notes}` : "",
        attemptId ? `\nAttempt ID: ${attemptId}` : "",
        `Time: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n")
    );

  /**
   * Notify the proctor backend:
   *  1. Insert an `sos` event into attempt_events so org members see it in the feed.
   *  2. Post a system chat message so it appears in the proctor's chat dock.
   * Best-effort: if either fails, fall back to email so the candidate is never stranded.
   */
  const notifyProctor = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!attemptId) return { ok: false, error: "No active attempt" };
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id ?? null;

      const eventInsert = supabase.from("attempt_events").insert({
        attempt_id: attemptId,
        kind: "sos",
        payload: {
          issue,
          notes: notes || null,
          raised_at: new Date().toISOString(),
          assessment_title: assessmentTitle ?? null,
        },
      });

      const chatInsert = userId
        ? supabase.from("assessment_chat_messages").insert({
            attempt_id: attemptId,
            sender_user_id: userId,
            sender_role: "system",
            body: `🚨 SOS raised by candidate — ${issue}${notes ? `\n\nDetails: ${notes}` : ""}`,
          })
        : Promise.resolve({ error: null } as any);

      const [evt, chat] = await Promise.all([eventInsert, chatInsert]);
      if (evt.error) throw evt.error;
      if ((chat as any).error) {
        // Non-fatal: event already logged.
        console.warn("SOS chat post failed", (chat as any).error);
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Network error" };
    }
  };

  const sendSos = async () => {
    setSending(true);
    const result = await notifyProctor();
    setSending(false);

    if (result.ok) {
      toast.success("Proctor notified", {
        description: "A proctor has been alerted and will respond in chat shortly.",
      });
      setOpen(false);
      reset();
      return;
    }

    // Fallback: open email so the candidate still gets help.
    toast.error("Couldn't reach proctor — opening email backup", {
      description: result.error ?? "Please send the email so support can call back.",
    });
    const url = `mailto:${SUPPORT_EMAIL}?subject=${buildSubject()}&body=${buildBody()}`;
    window.location.href = url;
    setOpen(false);
    reset();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className={cn(
              "h-8 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive font-semibold",
              compact ? "w-8 p-0" : "px-2"
            )}
            aria-label="Emergency help (SOS)"
          >
            <LifeBuoy className="h-4 w-4" />
            {!compact && <span className="hidden sm:inline ml-1.5">SOS</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Emergency help — your test stays safe</TooltipContent>
      </Tooltip>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-destructive/15 text-destructive grid place-items-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Emergency help</DialogTitle>
                <DialogDescription className="text-xs">
                  Your timer keeps running. Answers are auto-saved.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {step === "confirm" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use SOS only for genuine emergencies during the test (technical failure, power loss,
                health issue). A proctor will be notified.
              </p>
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 text-sm">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${buildSubject()}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{SUPPORT_EMAIL}</span>
                </a>
                <a
                  href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{SUPPORT_PHONE}</span>
                </a>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep("details")}
                  className="font-semibold"
                >
                  <AlertTriangle className="h-4 w-4 mr-1.5" /> Continue to SOS
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  What's the issue?
                </Label>
                <div className="grid gap-1.5">
                  {QUICK_ISSUES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setIssue(q)}
                      className={cn(
                        "text-left text-sm px-3 py-2 rounded-md border transition-colors",
                        issue === q
                          ? "border-destructive/60 bg-destructive/10 text-foreground"
                          : "border-border hover:bg-muted/60"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sos-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Add details (optional)
                </Label>
                <Textarea
                  id="sos-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. webcam went black after Q3, can't reconnect"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={() => setStep("confirm")}>
                  Back
                </Button>
                <Button variant="destructive" onClick={sendEmail} className="font-semibold">
                  <Send className="h-4 w-4 mr-1.5" /> Send SOS
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
