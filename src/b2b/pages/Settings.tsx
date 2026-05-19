import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations, slugify } from "../hooks/useOrg";
import { useOrgMembers } from "../hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  SETTINGS_SECTIONS,
  SettingsLayout,
  useActiveSettingsSection,
  type SettingsSectionId,
} from "./settings/SettingsLayout";
import { GeneralSection } from "./settings/GeneralSection";
import { BrandingSection } from "./settings/BrandingSection";
import { ComingSoonSection } from "./settings/ComingSoonSection";
import { DangerSection } from "./settings/DangerSection";
import { DefaultsSection, type DefaultsState } from "./settings/DefaultsSection";
import { validateHexColor } from "./settings/hexColor";

const DEFAULT_DEFAULTS: DefaultsState = {
  duration: "60",
  proctoring: "basic",
  passMark: "40",
  allowRetake: false,
  autoRelease: true,
};

function orgToDefaults(org: {
  default_duration_min: number | null;
  default_proctoring: string | null;
  default_pass_mark: number | null;
  allow_retake_default: boolean | null;
  auto_release_results: boolean | null;
}): DefaultsState {
  return {
    duration: org.default_duration_min != null ? String(org.default_duration_min) : DEFAULT_DEFAULTS.duration,
    proctoring: (org.default_proctoring as DefaultsState["proctoring"]) ?? DEFAULT_DEFAULTS.proctoring,
    passMark: org.default_pass_mark != null ? String(org.default_pass_mark) : DEFAULT_DEFAULTS.passMark,
    allowRetake: org.allow_retake_default ?? DEFAULT_DEFAULTS.allowRetake,
    autoRelease: org.auto_release_results ?? DEFAULT_DEFAULTS.autoRelease,
  };
}

export default function B2BSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: orgs, isLoading } = useMyOrganizations();
  const org = orgs?.[0];
  const { data: members } = useOrgMembers(org?.id);

  const activeId = useActiveSettingsSection();
  const [, setParams] = useSearchParams();
  const setSection = (id: SettingsSectionId) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "general") next.delete("section");
      else next.set("section", id);
      return next;
    });
  };

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [defaults, setDefaults] = useState<DefaultsState>(DEFAULT_DEFAULTS);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setLogoUrl(org.logo_url ?? "");
      setBrandColor(org.brand_color ?? "");
      setDefaults(orgToDefaults(org));
    }
  }, [org?.id]);

  if (isLoading) {
    return (
      <OrgShell title="Settings">
        <div className="text-sm text-[hsl(var(--muted-foreground))]" />
      </OrgShell>
    );
  }
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner" || org.owner_id === user?.id;
  const canEdit = isOwner || myRole === "admin";
  const normalizedBrand = brandColor.trim();
  const brandValidation = validateHexColor(normalizedBrand);
  const dirty =
    name.trim() !== org.name ||
    (logoUrl || "") !== (org.logo_url ?? "") ||
    (normalizedBrand || "") !== (org.brand_color ?? "");

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

  const onDiscard = () => {
    setName(org.name);
    setLogoUrl(org.logo_url ?? "");
    setBrandColor(org.brand_color ?? "");
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

  const openPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHtml(null);
    setPreviewSubject("");
    try {
      const { data, error } = await supabase.functions.invoke("send-assessment-invite", {
        body: { org_id: org.id, preview: true },
      });
      if (error) throw new Error(error.message ?? "Preview failed");
      setPreviewHtml((data as { html?: string }).html ?? "");
      setPreviewSubject((data as { subject?: string }).subject ?? "");
    } catch (e) {
      toast.error((e as Error).message);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const activeMeta = SETTINGS_SECTIONS.find((s) => s.id === activeId)!;

  const renderSection = () => {
    switch (activeId) {
      case "general":
        return <GeneralSection org={org} canEdit={canEdit} name={name} setName={setName} />;
      case "branding":
        return (
          <BrandingSection
            canEdit={canEdit}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            dirty={dirty}
            onPreview={openPreview}
          />
        );
      case "defaults":
        return (
          <ComingSoonSection
            icon={activeMeta.icon}
            title="Assessment defaults"
            description="Set the defaults that every new assessment will inherit. Saves admins from re-picking the same options every time."
            fields={[
              "Default duration (minutes)",
              "Default proctoring profile: off / standard / strict",
              "Default pass mark (%)",
              "Allow candidate retake by default",
              "Auto-release results to candidates",
            ]}
          />
        );
      case "security":
        return (
          <ComingSoonSection
            icon={activeMeta.icon}
            title="Security & Access"
            description="Lock down who can take your assessments and how your team signs in."
            fields={[
              "Allowed candidate email domains (e.g. @iitb.ac.in)",
              "Require MFA for team members (owner only)",
              "Team session length (8h / 24h / 7d)",
              "Sign out all team sessions",
            ]}
          />
        );
      case "notifications":
        return (
          <ComingSoonSection
            icon={activeMeta.icon}
            title="Notifications"
            description="Pick where assessment results and proctoring alerts get delivered."
            fields={[
              "Email recipients for completion digests",
              "Slack / webhook URL for instant alerts",
              "Daily summary email toggle",
              "Recipients for proctoring incidents",
            ]}
          />
        );
      case "integrations":
        return (
          <ComingSoonSection
            icon={activeMeta.icon}
            title="Integrations"
            description="Plug your assessments into the rest of your stack."
            fields={[
              "Verified email sender domain status",
              "Results webhook URL + signing secret",
              "SSO / SAML for team sign-in",
            ]}
          />
        );
      case "audit":
        return (
          <ComingSoonSection
            icon={activeMeta.icon}
            title="Audit log"
            description="Read-only log of who did what in this organization. Filter by person and action, export to CSV."
            fields={[
              "Member added / removed",
              "Capability changes",
              "Assessment published or unpublished",
              "Invite created or revoked",
              "Org settings changed",
            ]}
          />
        );
      case "danger":
        return <DangerSection org={org} isOwner={isOwner} deleting={deleting} onDelete={onDelete} />;
    }
  };

  return (
    <OrgShell
      title={
        <>
          <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
            {org.name}
          </span>{" "}
          <span className="text-[hsl(var(--muted-foreground))] font-normal">· Settings</span>
        </>
      }
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
      <SettingsLayout activeId={activeId} onSelect={setSection}>
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold">{activeMeta.label}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{activeMeta.description}</p>
          </div>
          {renderSection()}
        </div>
      </SettingsLayout>

      {/* Sticky unsaved-changes bar */}
      {canEdit && dirty && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur shadow-lg flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs text-[hsl(var(--muted-foreground))] flex-1">
              You have unsaved changes.
            </span>
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle>Invitation email preview</DialogTitle>
            {previewSubject && (
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-medium text-[hsl(var(--foreground))]">Subject:</span> {previewSubject}
              </div>
            )}
            <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Sample candidate &amp; assessment shown — your real invites use the candidate's name and assessment details.
            </div>
          </DialogHeader>
          <div className="h-[70vh] bg-[#f4f5f7] border-t border-[hsl(var(--border))]">
            {previewLoading ? (
              <div className="h-full grid place-items-center text-sm text-[hsl(var(--muted-foreground))]">
                Rendering preview…
              </div>
            ) : (
              <iframe
                title="Email preview"
                srcDoc={previewHtml ?? ""}
                className="w-full h-full bg-white"
                sandbox=""
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </OrgShell>
  );
}
