import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Building2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import type { Organization } from "../../hooks/useOrg";

interface Props {
  org: Organization;
  canEdit: boolean;
  name: string;
  setName: (v: string) => void;
}

export function GeneralSection({ org, canEdit, name, setName }: Props) {
  const joinUrl = `${window.location.origin}/assessments/join`;
  const TypeIcon = org.type === "college" ? GraduationCap : Building2;

  return (
    <div className="space-y-6">
      <section className="b2b-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TypeIcon className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Organization profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="org-display-name" className="text-xs">Display name</Label>
            <Input
              id="org-display-name"
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="Acme University"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <div className="mt-1 text-sm capitalize">{org.type}</div>
            </div>
            <div>
              <Label className="text-xs">Created</Label>
              <div className="mt-1 text-sm">{new Date(org.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="b2b-card p-5">
        <h2 className="text-sm font-semibold mb-1">Candidate join link</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Share with candidates so they can enter an invite code and start their assessment.
        </p>
        <div className="flex gap-2">
          <Input value={joinUrl} readOnly className="font-mono text-xs" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(joinUrl);
              toast.success("Copied");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          Org slug: <code className="text-[hsl(var(--foreground))]">{org.slug}</code>
        </div>
      </section>
    </div>
  );
}
