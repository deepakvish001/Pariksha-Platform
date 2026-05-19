import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Organization } from "../../hooks/useOrg";

interface Props {
  org: Organization;
  isOwner: boolean;
  deleting: boolean;
  onDelete: () => void;
}

export function DangerSection({ org, isOwner, deleting, onDelete }: Props) {
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
    <div className="b2b-card p-5 border border-destructive/40">
      <div className="flex items-center gap-2 mb-1 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Danger zone</h2>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
        Deleting <strong>{org.name}</strong> will permanently remove all of its assessments, invites,
        attempts, and member access. This cannot be undone.
      </p>
      <Button variant="destructive" onClick={onDelete} disabled={deleting}>
        {deleting ? "Deleting…" : "Delete organization"}
      </Button>
      <p className="mt-4 text-[11px] text-[hsl(var(--muted-foreground))]">
        Transfer ownership is coming soon. For now, contact support if you need to hand off this org.
      </p>
    </div>
  );
}
