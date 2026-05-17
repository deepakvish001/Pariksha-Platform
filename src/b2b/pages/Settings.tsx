import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations, slugify } from "../hooks/useOrg";
import { useOrgMembers } from "../hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, GraduationCap, Copy, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function B2BSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: orgs, isLoading } = useMyOrganizations();
  const org = orgs?.[0];
  const { data: members } = useOrgMembers(org?.id);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setLogoUrl(org.logo_url ?? "");
      setBrandColor(org.brand_color ?? "");
    }
  }, [org?.id]);

  if (isLoading) {
    return (
      <OrgShell title="Settings">
        <div className="text-sm text-[hsl(var(--muted-foreground))]"></div>
      </OrgShell>
    );
  }
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner" || org.owner_id === user?.id;
  const canEdit = isOwner || myRole === "admin";
  const normalizedBrand = brandColor.trim();
  const brandValidation = validateHexColor(normalizedBrand);
  const isValidBrand = brandValidation.ok;
  // Expand `#abc` -> `#aabbcc` for the swatch preview, uppercase for display.
  const brandPreview = isValidBrand && normalizedBrand
    ? expandHex(normalizedBrand).toUpperCase()
    : null;
  const dirty =
    name.trim() !== org.name ||
    (logoUrl || "") !== (org.logo_url ?? "") ||
    (normalizedBrand || "") !== (org.brand_color ?? "");

  const joinUrl = `${window.location.origin}/assessments/join`;

  const onSave = async () => {
    if (!canEdit || !dirty) return;
    if (brandValidation.ok !== true) {
      toast.error((brandValidation as { ok: false; error: string }).error);
      return;
    }
    setSaving(true);
    const newSlug = slugify(name) ? `${slugify(name)}-${org.slug.split("-").pop()}` : org.slug;
    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        brand_color: normalizedBrand || null,
        slug: newSlug,
      })
      .eq("id", org.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Organization updated");
    qc.invalidateQueries({ queryKey: ["b2b", "orgs"] });
  };

  const onDelete = async () => {
    if (!isOwner) return;
    if (!confirm(`Permanently delete "${org.name}"? This cannot be undone.`)) return;
    if (!confirm("All assessments, invites, and attempts for this org will be removed. Continue?")) return;
    setDeleting(true);
    const { error } = await supabase.from("organizations").delete().eq("id", org.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Organization deleted");
    qc.invalidateQueries({ queryKey: ["b2b", "orgs"] });
    navigate("/b2b/onboarding", { replace: true });
  };

  const TypeIcon = org.type === "college" ? GraduationCap : Building2;

  return (
    <OrgShell
      title={<><span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">{org.name}</span> <span className="text-[hsl(var(--muted-foreground))] font-normal">· Settings</span></>}
      actions={
        canEdit && (
          <Button
            disabled={!dirty || saving}
            onClick={onSave}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        )
      }
    >
      <div className="space-y-6 max-w-2xl">
        <div className="b2b-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TypeIcon className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Organization profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Display name</Label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Acme University"
              />
            </div>
            <div>
              <Label className="text-xs">Logo URL (optional)</Label>
              <div className="mt-1 flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Org logo preview"
                    className="h-10 w-10 rounded-md border border-[hsl(var(--border))] object-contain bg-white"
                    onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md border border-dashed border-[hsl(var(--border))] grid place-items-center text-[10px] text-[hsl(var(--muted-foreground))]">
                    Logo
                  </div>
                )}
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://…/logo.png"
                />
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                Shown in invitation emails. Use a square PNG/SVG hosted on a public URL.
              </p>
            </div>
            <div>
              <Label className="text-xs">Brand color (optional)</Label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={/^#([0-9a-fA-F]{6})$/.test(normalizedBrand) ? normalizedBrand : "#0f172a"}
                  onChange={(e) => setBrandColor(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 w-12 rounded-md border border-[hsl(var(--border))] bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Pick brand color"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  disabled={!canEdit}
                  placeholder="#1f6feb"
                  className="font-mono"
                />
              </div>
              {!isValidBrand ? (
                <p className="mt-1 text-[11px] text-destructive">{brandValidation.error}</p>
              ) : brandPreview ? (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-sm border border-[hsl(var(--border))]"
                    style={{ background: brandPreview }}
                  />
                  <span>
                    Looks good. Saving as <span className="font-mono text-[hsl(var(--foreground))]">{brandPreview}</span>.
                  </span>
                </div>
              ) : null}
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                Used for the header and call-to-action in invitation emails. Accepts <span className="font-mono">#RGB</span> or <span className="font-mono">#RRGGBB</span>.
              </p>
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
        </div>

        <div className="b2b-card p-5">
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
        </div>

        {isOwner && (
          <div className="b2b-card p-5 border border-destructive/40">
            <div className="flex items-center gap-2 mb-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Danger zone</h2>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
              Deleting this organization will permanently remove all of its assessments, invites, attempts, and member
              access. This cannot be undone.
            </p>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete organization"}
            </Button>
          </div>
        )}
      </div>
    </OrgShell>
  );
}

/**
 * Validate a hex color string with actionable error messages.
 * Empty string is valid (means "use default" / not set).
 */
function validateHexColor(input: string): { ok: true } | { ok: false; error: string } {
  if (!input) return { ok: true };

  if (/\s/.test(input)) {
    return { ok: false, error: "Color can't contain spaces. Try something like #1F6FEB." };
  }

  if (!input.startsWith("#")) {
    // Be helpful: people often paste 1f6feb without the #
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(input)) {
      return { ok: false, error: `Add a leading "#" — e.g. #${input}.` };
    }
    return { ok: false, error: 'Hex colors must start with "#" (e.g. #1F6FEB).' };
  }

  const body = input.slice(1);

  if (body.length === 0) {
    return { ok: false, error: "Add 3 or 6 hex digits after #, e.g. #1F6FEB." };
  }

  if (/[^0-9a-fA-F]/.test(body)) {
    const bad = Array.from(new Set(body.match(/[^0-9a-fA-F]/g) ?? []))
      .slice(0, 3)
      .join(" ");
    return {
      ok: false,
      error: `Only 0-9 and A-F are allowed. Remove: ${bad}.`,
    };
  }

  if (body.length === 4 || body.length === 5) {
    return {
      ok: false,
      error: `#${body} has ${body.length} digits. Use 3 (e.g. #1AF) or 6 (e.g. #11AAFF).`,
    };
  }

  if (body.length === 7 || body.length === 8) {
    return {
      ok: false,
      error: "Alpha channel (#RRGGBBAA) isn't supported. Use 6 hex digits.",
    };
  }

  if (body.length !== 3 && body.length !== 6) {
    return {
      ok: false,
      error: `#${body} has ${body.length} digits. Use 3 or 6 hex digits (e.g. #1F6FEB).`,
    };
  }

  return { ok: true };
}

/** Expand `#abc` to `#aabbcc`. Assumes `value` is already a valid hex. */
function expandHex(value: string): string {
  const body = value.replace(/^#/, "");
  if (body.length === 3) {
    return "#" + body.split("").map((c) => c + c).join("");
  }
  return "#" + body;
}
