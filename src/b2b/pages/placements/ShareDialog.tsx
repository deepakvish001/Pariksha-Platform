import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Check, Link2, Loader2, Share2, MessageSquare,
  ChevronDown, History, Eye, Ban, FileText, Mail,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format, formatDistanceToNow } from "date-fns";

type Target =
  | { kind: "profile"; studentId: string; studentName: string }
  | { kind: "shortlist"; studentIds: string[] };

const PRESETS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "custom", label: "Custom date…" },
];

function buildUrl(token: string, kind: "profile" | "shortlist") {
  const path = kind === "profile" ? `/p/student/${token}` : `/p/shortlist/${token}`;
  return `${window.location.origin}${path}`;
}

type LinkStatus = "active" | "expired" | "revoked";

function deriveStatus(row: { revoked_at?: string | null; expires_at: string }): LinkStatus {
  if (row.revoked_at) return "revoked";
  if (new Date(row.expires_at).getTime() < Date.now()) return "expired";
  return "active";
}

function StatusPill({ status, expiresAt }: { status: LinkStatus; expiresAt?: string }) {
  const map = {
    active: {
      icon: CheckCircle2,
      label: expiresAt
        ? `Active · expires ${formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}`
        : "Active",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },
    expired: {
      icon: Clock,
      label: "Expired",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    revoked: {
      icon: XCircle,
      label: "Revoked",
      cls: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  } as const;
  const { icon: Icon, label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function ShareDialog({
  orgId, target, onClose,
}: { orgId: string; target: Target; onClose: () => void }) {
  const qc = useQueryClient();
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [message, setMessage] = useState("");
  const [expiresMode, setExpiresMode] = useState("30");
  const [customDate, setCustomDate] = useState("");
  const [allowResume, setAllowResume] = useState(true);
  const [allowContact, setAllowContact] = useState(false);
  const [share, setShare] = useState<{ token: string; kind: "profile" | "shortlist"; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const expiresAt = useMemo(() => {
    if (expiresMode === "custom") {
      if (!customDate) return null;
      const d = new Date(customDate);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    return new Date(Date.now() + Number(expiresMode) * 86400 * 1000);
  }, [expiresMode, customDate]);

  const maxDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 365);
    return d.toISOString().slice(0, 10);
  }, []);
  const minDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const expiryError = useMemo(() => {
    if (expiresMode !== "custom") return null;
    if (!customDate) return "Pick a date";
    const d = new Date(customDate);
    if (d <= new Date()) return "Must be in the future";
    const max = new Date(); max.setDate(max.getDate() + 365);
    if (d > max) return "Max 1 year ahead";
    return null;
  }, [expiresMode, customDate]);

  const recentKey = target.kind === "profile" ? target.studentId : target.studentIds.join(",");
  const recent = useQuery({
    queryKey: ["share-recent", orgId, target.kind, recentKey],
    queryFn: async () => {
      let q = (supabase as any)
        .from("student_share_links")
        .select("id, token, kind, recruiter_name, recruiter_email, created_at, expires_at, revoked_at, view_count, last_viewed_at")
        .eq("org_id", orgId)
        .eq("kind", target.kind)
        .order("created_at", { ascending: false })
        .limit(5);
      if (target.kind === "profile") q = q.eq("student_id", target.studentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!expiresAt) throw new Error("Invalid expiry date");
      const token = crypto.randomUUID().replace(/-/g, "");
      const payload: any = {
        org_id: orgId,
        kind: target.kind,
        token,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_name: recruiterName.trim() || null,
        message: message.trim() || null,
        expires_at: expiresAt.toISOString(),
        allow_resume: allowResume,
        allow_contact: allowContact,
      };
      if (target.kind === "profile") {
        payload.student_id = target.studentId;
        payload.student_ids = [target.studentId];
      } else {
        payload.student_ids = target.studentIds;
      }
      const { data, error } = await (supabase as any)
        .from("student_share_links")
        .insert(payload)
        .select("token, kind, expires_at")
        .single();
      if (error) throw error;
      return data as { token: string; kind: "profile" | "shortlist"; expires_at: string };
    },
    onSuccess: (row) => {
      setShare({ token: row.token, kind: row.kind, expiresAt: row.expires_at });
      qc.invalidateQueries({ queryKey: ["share-recent", orgId, target.kind, recentKey] });
      toast.success("Share link created");
    },
    onError: (e: any) => toast.error(e?.message || "Could not create link"),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("student_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["share-recent", orgId, target.kind, recentKey] });
      toast.success("Link revoked");
    },
    onError: (e: any) => toast.error(e?.message || "Could not revoke"),
  });

  const shareUrl = share ? buildUrl(share.token, share.kind) : null;

  const copy = async (text: string, which: "url" | "msg") => {
    await navigator.clipboard.writeText(text);
    if (which === "url") { setCopied(true); setTimeout(() => setCopied(false), 1500); }
    else { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 1500); }
  };

  const messageBlurb = useMemo(() => {
    if (!shareUrl || !share) return "";
    const greet = recruiterName.trim() ? `Hi ${recruiterName.trim()},` : "Hi team,";
    const body = message.trim() ? `\n\n${message.trim()}` : "";
    const exp = format(new Date(share.expiresAt), "PPP");
    return `${greet}${body}\n\nView: ${shareUrl}\n\nLink expires: ${exp}.`;
  }, [shareUrl, share, recruiterName, message]);

  const targetLabel = target.kind === "profile"
    ? `Share profile · ${target.studentName}`
    : `Share shortlist · ${target.studentIds.length} students`;

  // autofocus
  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById("share-recruiter-name")?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {targetLabel}
          </DialogTitle>
          <DialogDescription>
            Generate a recruiter-safe link with watermark, expiry, and view tracking.
          </DialogDescription>
        </DialogHeader>

        {!share ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="share-recruiter-name" className="text-xs">Recruiter name (optional)</Label>
                <Input
                  id="share-recruiter-name"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  placeholder="e.g. Priya HR"
                />
              </div>
              <div>
                <Label className="text-xs">Expires in</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={expiresMode}
                  onChange={(e) => setExpiresMode(e.target.value)}
                >
                  {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {expiresMode === "custom" && (
              <div>
                <Label className="text-xs">Custom expiry date</Label>
                <Input
                  type="date"
                  value={customDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
                {expiryError && <p className="mt-1 text-xs text-destructive">{expiryError}</p>}
              </div>
            )}

            <div>
              <Label className="text-xs">Recruiter email (optional)</Label>
              <Input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="hr@company.com"
              />
            </div>

            <div>
              <Label className="text-xs">Message to HR (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Top candidates from our 2025 batch…"
                rows={3}
              />
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Show resume</span>
                </div>
                <Switch checked={allowResume} onCheckedChange={setAllowResume} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Show contact info</span>
                </div>
                <Switch checked={allowContact} onCheckedChange={setAllowContact} />
              </div>
            </div>

            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !!expiryError}
              className="w-full"
            >
              {create.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Link2 className="h-4 w-4 mr-2" />}
              Generate link
            </Button>

            {recent.data && recent.data.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs font-medium hover:bg-muted/40">
                    <span className="flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Recent shares ({recent.data.length})
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {recent.data.map((r: any) => {
                    const status = deriveStatus(r);
                    const url = buildUrl(r.token, r.kind);
                    return (
                      <div key={r.id} className="rounded-md border border-border p-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {r.recruiter_name || r.recruiter_email || "Unnamed recipient"}
                            </div>
                            <div className="text-muted-foreground">
                              {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                              {" · expires "}{format(new Date(r.expires_at), "MMM d")}
                            </div>
                          </div>
                          <StatusPill status={status} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />{r.view_count || 0}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2"
                              onClick={() => copy(url, "url").then(() => toast.success("Link copied"))}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            {status === "active" && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                                onClick={() => revoke.mutate(r.id)} disabled={revoke.isPending}>
                                <Ban className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <StatusPill status="active" expiresAt={share.expiresAt} />
              <span className="text-[11px] text-muted-foreground">
                Expires {format(new Date(share.expiresAt), "PPP")}
              </span>
            </div>
            <div className="flex gap-2">
              <Input value={shareUrl!} readOnly className="font-mono text-xs" />
              <Button size="icon" onClick={() => copy(shareUrl!, "url")} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-center rounded-md border border-border bg-white p-4">
              <QRCodeSVG value={shareUrl!} size={160} includeMargin />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => copy(messageBlurb, "msg").then(() => toast.success("Message copied"))}
            >
              {copiedMsg ? <Check className="h-4 w-4 mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
              Copy as message
            </Button>

            <Button asChild variant="outline" className="w-full">
              <a href={shareUrl!} target="_blank" rel="noreferrer">Preview link</a>
            </Button>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
