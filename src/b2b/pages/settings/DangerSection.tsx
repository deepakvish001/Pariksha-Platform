import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Organization } from "../../hooks/useOrg";
import type { OrgMember } from "../../hooks/useMembers";

interface Props {
  org: Organization;
  isOwner: boolean;
  deleting: boolean;
  onDelete: () => void;
  members: OrgMember[];
  currentUserId?: string;
}

function memberLabel(m: OrgMember) {
  return m.full_name?.trim() || m.user_id.slice(0, 8);
}

export function DangerSection({
  org,
  isOwner,
  deleting,
  onDelete,
  members,
  currentUserId,
}: Props) {
  const qc = useQueryClient();
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [transferring, setTransferring] = useState(false);

  const eligible = useMemo(
    () => members.filter((m) => m.user_id !== currentUserId && m.role !== "owner"),
    [members, currentUserId],
  );
  const target = eligible.find((m) => m.user_id === targetUserId) ?? null;
  const confirmOk = confirmText.trim().toLowerCase() === org.name.trim().toLowerCase();

  const onTransfer = async () => {
    if (!target || !confirmOk) return;
    setTransferring(true);
    const { error } = await supabase.rpc("transfer_org_ownership", {
      _org_id: org.id,
      _new_owner_user_id: target.user_id,
    });
    setTransferring(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Ownership transferred to ${memberLabel(target)}`);
    setTransferOpen(false);
    setTargetUserId("");
    setConfirmText("");
    qc.invalidateQueries({ queryKey: ["b2b", "orgs"] });
    qc.invalidateQueries({ queryKey: ["b2b", "members", org.id] });
    qc.invalidateQueries({ queryKey: ["b2b", "audit", org.id] });
  };

  if (!isOwner) {
    return (
      <div className="b2b-card p-5">
        <h2 className="text-sm font-semibold mb-1">Danger zone</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Only the organization owner can transfer ownership or delete <strong>{org.name}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transfer ownership */}
      <div className="b2b-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Transfer ownership</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Hand over <strong>{org.name}</strong> to another member. You'll be demoted to an admin
          and the new owner will gain full control, including billing and deletion rights.
        </p>
        {eligible.length === 0 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Invite another team member first — there's no one to transfer ownership to yet.
          </p>
        ) : (
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            Transfer ownership…
          </Button>
        )}
      </div>

      {/* Delete */}
      <div className="b2b-card p-5 border border-destructive/40">
        <div className="flex items-center gap-2 mb-1 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Delete organization</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Deleting <strong>{org.name}</strong> will permanently remove all of its assessments, invites,
          attempts, and member access. This cannot be undone.
        </p>
        <Button variant="destructive" onClick={onDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete organization"}
        </Button>
      </div>

      <Dialog
        open={transferOpen}
        onOpenChange={(o) => {
          setTransferOpen(o);
          if (!o) {
            setTargetUserId("");
            setConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer ownership of {org.name}</DialogTitle>
            <DialogDescription>
              The new owner takes over billing, deletion rights, and all admin controls. You will be
              kept on as an admin and can be re-promoted later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">New owner</label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member…" />
                </SelectTrigger>
                <SelectContent>
                  {eligible.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {memberLabel(m)}
                      <span className="text-[hsl(var(--muted-foreground))] ml-2 text-xs">
                        · {m.role}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Type <span className="font-mono">{org.name}</span> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={org.name}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setTransferOpen(false)} disabled={transferring}>
              Cancel
            </Button>
            <Button
              onClick={onTransfer}
              disabled={!target || !confirmOk || transferring}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              {transferring ? "Transferring…" : "Transfer ownership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
