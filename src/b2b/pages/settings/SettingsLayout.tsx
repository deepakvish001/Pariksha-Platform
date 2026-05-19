import { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Building2,
  Palette,
  ClipboardList,
  ShieldCheck,
  Bell,
  Plug,
  History,
  AlertTriangle,
  Lock,
} from "lucide-react";

export type SettingsSectionId =
  | "general"
  | "branding"
  | "defaults"
  | "security"
  | "notifications"
  | "integrations"
  | "audit"
  | "danger";

interface Section {
  id: SettingsSectionId;
  label: string;
  icon: typeof Building2;
  description: string;
  /** "Coming soon" tabs render with a lock chip and read-only placeholder. */
  comingSoon?: boolean;
  /** Owner-only sections show a chip in the rail. */
  ownerOnly?: boolean;
}

export const SETTINGS_SECTIONS: Section[] = [
  { id: "general", label: "General", icon: Building2, description: "Organization profile and join link." },
  { id: "branding", label: "Branding & Email", icon: Palette, description: "Logo, brand color and invitation email." },
  { id: "defaults", label: "Assessment defaults", icon: ClipboardList, description: "Defaults applied to every new assessment." },
  { id: "security", label: "Security & Access", icon: ShieldCheck, description: "Allowed domains, MFA and team sessions." },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Where result digests and alerts go.", comingSoon: true },
  { id: "integrations", label: "Integrations", icon: Plug, description: "Webhooks, custom domains and SSO.", comingSoon: true },
  { id: "audit", label: "Audit log", icon: History, description: "Who changed what, and when.", comingSoon: true },
  { id: "danger", label: "Danger zone", icon: AlertTriangle, description: "Transfer or delete this organization.", ownerOnly: true },
];

export function useActiveSettingsSection(): SettingsSectionId {
  const [params] = useSearchParams();
  const raw = params.get("section") as SettingsSectionId | null;
  const valid = SETTINGS_SECTIONS.some((s) => s.id === raw);
  return valid && raw ? raw : "general";
}

interface Props {
  activeId: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
  children: ReactNode;
}

export function SettingsLayout({ activeId, onSelect, children }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-20 self-start">
        <nav className="b2b-card p-2 space-y-0.5" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40 hover:text-[hsl(var(--foreground))]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{s.label}</span>
                {s.comingSoon && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))]/40 text-[hsl(var(--muted-foreground))]"
                    title="Coming soon"
                  >
                    <Lock className="h-3 w-3" />
                    Soon
                  </span>
                )}
                {s.ownerOnly && !s.comingSoon && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive"
                    title="Owner only"
                  >
                    Owner
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
