import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CapabilityCheckboxGrid } from "./CapabilityCheckboxGrid";
import { type Capability, ROLE_CAPABILITY_PRESETS } from "@/b2b/hooks/usePermissions";
import type { OrgMemberRole } from "@/b2b/hooks/useMembers";
import { buildOrgJoinUrl, useCreateOrgInvite } from "@/b2b/hooks/useOrgInvites";
import { Copy, Send } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

const PRESET_OPTIONS: { value: OrgMemberRole | "custom"; label: string }[] = [
  { value: "admin", label: "Admin (most things)" },
  { value: "proctor", label: "Proctor (live monitoring)" },
  { value: "recruiter", label: "Recruiter (results & PII)" },
  { value: "viewer", label: "Viewer (read-only)" },
  { value: "custom", label: "Custom" },
];

export function InviteTeacherDialog({ open, onOpenChange, orgId }: Props) {
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<OrgMemberRole | "custom">("admin");
  const [caps, setCaps] = useState<Capability[]>(ROLE_CAPABILITY_PRESETS.admin);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const create = useCreateOrgInvite(orgId);

  useEffect(() => {
    if (preset !== "custom") setCaps(ROLE_CAPABILITY_PRESETS[preset]);
  }, [preset]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPreset("admin");
      setCaps(ROLE_CAPABILITY_PRESETS.admin);
      setCreatedLink(null);
    }
  }, [open]);

  const isDirty = () => {
    if (createdLink) return false;
    if (email.trim().length > 0) return true;
    if (preset !== "admin") return true;
    const defaults = ROLE_CAPABILITY_PRESETS.admin;
    if (caps.length !== defaults.length) return true;
    return caps.some((c) => !defaults.includes(c));
  };

  const tryCancel = () => {
    if (isDirty()) {
      const ok = window.confirm("Discard this invite? Your unsent changes will be lost.");
      if (!ok) return;
    }
    onOpenChange(false);
  };

  const submit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    create.mutate(
      {
        email: trimmed,
        capabilities: caps,
        role_preset: preset === "custom" ? "viewer" : preset,
        send_email: true,
      },
      {
        onSuccess: (inv) => {
          setCreatedLink(buildOrgJoinUrl(inv.token));
          toast.success(`Invite sent to ${inv.email}`);
        },
        onError: (e: any) => toast.error(e.message ?? "Could not create invite"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) tryCancel(); else onOpenChange(true); }}>
      <DialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(e) => { e.preventDefault(); tryCancel(); }}
      >
        <DialogHeader>
          <DialogTitle>Invite a teacher</DialogTitle>
          <DialogDescription>
            Send a private join link. Only the email you enter here will be able to use it.
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="invite-email">Teacher email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Preset</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Capabilities</Label>
              <CapabilityCheckboxGrid
                value={caps}
                onChange={(next) => { setCaps(next); setPreset("custom"); }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border bg-card/50 p-3 text-sm">
              <div className="font-medium mb-1">Invite created for {email}</div>
              <div className="text-[hsl(var(--muted-foreground))]">
                We've emailed them the link. You can also copy it below to share manually.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={createdLink} className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(createdLink);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!createdLink ? (
            <>
              <Button variant="ghost" onClick={tryCancel}>Cancel</Button>
              <Button onClick={submit} disabled={create.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {create.isPending ? "Sending…" : "Send invite"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
