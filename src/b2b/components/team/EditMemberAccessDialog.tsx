import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CapabilityCheckboxGrid } from "./CapabilityCheckboxGrid";
import { ROLE_CAPABILITY_PRESETS, type Capability } from "@/b2b/hooks/usePermissions";
import { useMemberCapabilities, useSetMemberCapabilities } from "@/b2b/hooks/useMemberCapabilities";
import type { OrgMember } from "@/b2b/hooks/useMembers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrgMember | null;
  orgId: string;
}

export function EditMemberAccessDialog({ open, onOpenChange, member, orgId }: Props) {
  const { data: existing } = useMemberCapabilities(member?.id);
  const save = useSetMemberCapabilities(orgId);
  const [caps, setCaps] = useState<Capability[]>([]);

  useEffect(() => {
    if (!open || !member) return;
    if (existing && existing.length > 0) setCaps(existing as Capability[]);
    else setCaps(ROLE_CAPABILITY_PRESETS[member.role] ?? []);
  }, [open, member, existing]);

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit access — {member.full_name ?? member.user_id}</DialogTitle>
          <DialogDescription>
            Pick exactly what this teammate can do. Overrides their role's defaults.
          </DialogDescription>
        </DialogHeader>
        <CapabilityCheckboxGrid value={caps} onChange={(n) => setCaps(n as Capability[])} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() =>
              save.mutate(
                { memberId: member.id, capabilities: caps },
                {
                  onSuccess: () => { toast.success("Access updated"); onOpenChange(false); },
                  onError: (e: any) => toast.error(e.message ?? "Save failed"),
                },
              )
            }
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
