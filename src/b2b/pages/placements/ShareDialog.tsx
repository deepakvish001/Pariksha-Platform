import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

type Target =
  | { kind: "profile"; studentId: string; studentName: string }
  | { kind: "shortlist"; studentIds: string[] };

export function ShareDialog({
  orgId, target, onClose,
}: { orgId: string; target: Target; onClose: () => void }) {
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [message, setMessage] = useState("");
  const [expiresDays, setExpiresDays] = useState("30");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + Number(expiresDays) * 86400 * 1000).toISOString();
      const payload: any = {
        org_id: orgId,
        kind: target.kind,
        token,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_name: recruiterName.trim() || null,
        message: message.trim() || null,
        expires_at: expiresAt,
      };
      if (target.kind === "profile") {
        payload.student_id = target.studentId;
        payload.student_ids = [target.studentId];
      } else {
        payload.student_ids = target.studentIds;
      }
      const { data, error } = await supabase
        .from("student_share_links" as any)
        .insert(payload)
        .select("token, kind")
        .single();
      if (error) throw error;
      return data as { token: string; kind: "profile" | "shortlist" };
    },
    onSuccess: (row) => {
      const base = window.location.origin;
      const path = row.kind === "profile" ? `/p/student/${row.token}` : `/p/shortlist/${row.token}`;
      setShareUrl(`${base}${path}`);
      toast.success("Share link created");
    },
    onError: (e: any) => toast.error(e?.message || "Could not create link"),
  });

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {target.kind === "profile"
              ? `Share profile · ${target.studentName}`
              : `Share shortlist · ${target.studentIds.length} students`}
          </DialogTitle>
          <DialogDescription>
            Generate a recruiter-safe link with watermark, expiry, and view tracking.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Recruiter name (optional)</Label>
                <Input value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} placeholder="e.g. Priya HR" />
              </div>
              <div>
                <Label className="text-xs">Expires in</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(e.target.value)}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>
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
              <Label className="text-xs">Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Top candidates from our 2025 batch…"
                rows={3}
              />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
              {create.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              Generate link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Share this link with HR:</div>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <Button size="icon" onClick={copy} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full">
              <a href={shareUrl} target="_blank" rel="noreferrer">Preview link</a>
            </Button>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
