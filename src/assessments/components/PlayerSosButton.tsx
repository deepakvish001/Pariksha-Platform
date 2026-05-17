import { useState } from "react";
import { AlertTriangle, LifeBuoy, Loader2, Mail, MessageCircle, MessageSquare, Phone, Send, X } from "lucide-react";
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
// Digits-only E.164 for tel:/sms:/wa.me links (no +, no spaces).
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/\D/g, "");

const QUICK_ISSUES = [
  "Camera or microphone stopped working",
  "Internet keeps disconnecting",
  "Question won't load / page frozen",
  "Power outage or device failure",
  "Other emergency — need help now",
];

/**
 * Snapshot of the candidate's environment at the moment SOS was raised.
 * All probes are wrapped in try/catch so a hostile / restricted browser
 * (Safari private mode, locked-down kiosk) never blocks the alert itself.
 */
async function collectSosMetadata(): Promise<Record<string, unknown>> {
  const nav: any = typeof navigator !== "undefined" ? navigator : {};
  const scr: any = typeof screen !== "undefined" ? screen : {};
  const win: any = typeof window !== "undefined" ? window : {};

  const safe = <T,>(fn: () => T): T | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  // Network — Network Information API where available
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection || null;
  const network = conn
    ? {
        effective_type: conn.effectiveType ?? null,
        downlink_mbps: typeof conn.downlink === "number" ? conn.downlink : null,
        rtt_ms: typeof conn.rtt === "number" ? conn.rtt : null,
        save_data: !!conn.saveData,
      }
    : null;

  // Camera / microphone permission + active device count.
  // Uses Permissions API + enumerateDevices, both wrapped defensively.
  const probePermission = async (name: PermissionName): Promise<string | null> => {
    if (!nav.permissions?.query) return null;
    try {
      const res = await nav.permissions.query({ name });
      return res.state ?? null;
    } catch {
      return null;
    }
  };

  const [cameraPerm, micPerm] = await Promise.all([
    probePermission("camera" as PermissionName),
    probePermission("microphone" as PermissionName),
  ]);

  let cameraCount: number | null = null;
  let micCount: number | null = null;
  let deviceLabels: { camera: boolean; mic: boolean } | null = null;
  try {
    if (nav.mediaDevices?.enumerateDevices) {
      const devices = await nav.mediaDevices.enumerateDevices();
      cameraCount = devices.filter((d: MediaDeviceInfo) => d.kind === "videoinput").length;
      micCount = devices.filter((d: MediaDeviceInfo) => d.kind === "audioinput").length;
      // Empty label => permission not granted yet
      deviceLabels = {
        camera: devices.some((d: MediaDeviceInfo) => d.kind === "videoinput" && !!d.label),
        mic: devices.some((d: MediaDeviceInfo) => d.kind === "audioinput" && !!d.label),
      };
    }
  } catch {
    // ignore
  }

  return {
    client_ts: new Date().toISOString(),
    page_url: safe(() => win.location?.href) ?? null,
    user_agent: nav.userAgent ?? null,
    platform: nav.userAgentData?.platform ?? nav.platform ?? null,
    languages: Array.isArray(nav.languages) ? nav.languages.slice(0, 4) : null,
    timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone) ?? null,
    online: typeof nav.onLine === "boolean" ? nav.onLine : null,
    cpu_cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    device_memory_gb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    viewport: {
      w: safe(() => win.innerWidth) ?? null,
      h: safe(() => win.innerHeight) ?? null,
      dpr: safe(() => win.devicePixelRatio) ?? null,
    },
    screen: {
      w: scr.width ?? null,
      h: scr.height ?? null,
    },
    network,
    media: {
      camera_permission: cameraPerm,
      mic_permission: micPerm,
      camera_count: cameraCount,
      mic_count: micCount,
      camera_active: deviceLabels?.camera ?? null,
      mic_active: deviceLabels?.mic ?? null,
    },
    visibility: safe(() => document.visibilityState) ?? null,
    fullscreen: safe(() => !!document.fullscreenElement),
  };
}

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
   *  1. Insert a row into `assessment_sos_events` — the permanent SOS history
   *     (status open → acknowledged → resolved by a proctor).
   *  2. Mirror to `attempt_events` so it shows in the live event feed.
   *  3. Post a system chat message so the proctor sees it instantly in chat.
   * Best-effort: if all fail, fall back to email so the candidate is never stranded.
   */
  const notifyProctor = async (): Promise<{ ok: boolean; error?: string; rateLimited?: boolean }> => {
    if (!attemptId) return { ok: false, error: "No active attempt" };
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id ?? null;
      if (!userId) return { ok: false, error: "Not signed in" };

      // ── Rate limit ───────────────────────────────────────────────
      // Ad-hoc guard against accidental floods / double-clicks:
      //   • At most 1 SOS every 60 seconds
      //   • At most 5 SOS per attempt total
      // Backed by the assessment_sos_events history table.
      const { data: recent, error: recentErr } = await supabase
        .from("assessment_sos_events")
        .select("id, created_at, status")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (recentErr) console.warn("SOS rate-limit lookup failed", recentErr);

      const MAX_PER_ATTEMPT = 5;
      const COOLDOWN_MS = 60_000;
      if (recent) {
        if (recent.length >= MAX_PER_ATTEMPT) {
          return {
            ok: false,
            rateLimited: true,
            error: `You've reached the limit of ${MAX_PER_ATTEMPT} SOS alerts for this attempt. Please use the call or WhatsApp option instead.`,
          };
        }
        const last = recent[0];
        if (last) {
          const sinceMs = Date.now() - new Date(last.created_at).getTime();
          if (sinceMs < COOLDOWN_MS) {
            const wait = Math.ceil((COOLDOWN_MS - sinceMs) / 1000);
            return {
              ok: false,
              rateLimited: true,
              error: `Another SOS was just sent. Please wait ${wait}s — proctors are already alerted.`,
            };
          }
        }
      }

      const raisedAt = new Date().toISOString();

      // ── Enriched context for proctors ────────────────────────────
      // Helps the proctor decide whether this is a device issue, a
      // network blip, or a user-side emergency without asking again.
      const metadata = await collectSosMetadata();

      const sosInsert = supabase
        .from("assessment_sos_events")
        .insert({
          attempt_id: attemptId,
          raised_by: userId,
          issue,
          notes: notes || null,
        })
        .select("id")
        .single();

      const eventInsert = supabase.from("attempt_events").insert({
        attempt_id: attemptId,
        kind: "sos",
        payload: {
          issue,
          notes: notes || null,
          raised_at: raisedAt,
          assessment_title: assessmentTitle ?? null,
          ...metadata,
        },
      });

      const chatInsert = supabase.from("assessment_chat_messages").insert({
        attempt_id: attemptId,
        sender_user_id: userId,
        sender_role: "system",
        body: `🚨 SOS raised by candidate — ${issue}${notes ? `\n\nDetails: ${notes}` : ""}`,
      });

      const [sos, evt, chat] = await Promise.all([sosInsert, eventInsert, chatInsert]);
      if (sos.error) throw sos.error;
      if (evt.error) console.warn("SOS event mirror failed", evt.error);
      if (chat.error) console.warn("SOS chat post failed", chat.error);
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

    // Rate limited → don't spam email fallback, just warn and stay on the dialog.
    if (result.rateLimited) {
      toast.warning("SOS not sent", {
        description: result.error ?? "Please wait before raising another alert.",
      });
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <a
                  href={`tel:${SUPPORT_PHONE_DIGITS}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Call</div>
                    <div className="font-mono text-xs truncate">{SUPPORT_PHONE}</div>
                  </div>
                </a>
                <a
                  href={`sms:${SUPPORT_PHONE_DIGITS}?&body=${buildBody()}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">SMS</div>
                    <div className="text-xs truncate">Text support</div>
                  </div>
                </a>
                <a
                  href={`https://wa.me/${SUPPORT_PHONE_DIGITS}?text=${buildBody()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 hover:border-emerald-500/70 hover:bg-emerald-500/15 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">WhatsApp</div>
                    <div className="text-xs truncate">Chat with proctor</div>
                  </div>
                </a>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${buildSubject()}&body=${buildBody()}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Email</div>
                    <div className="text-xs truncate">{SUPPORT_EMAIL}</div>
                  </div>
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
                <Button variant="ghost" onClick={() => setStep("confirm")} disabled={sending}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={sendSos}
                  disabled={sending}
                  className="font-semibold"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  {sending ? "Notifying proctor…" : "Send SOS"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
