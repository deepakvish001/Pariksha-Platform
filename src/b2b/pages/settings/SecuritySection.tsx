import { useState } from "react";
import { ShieldCheck, X, Plus, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecurityState {
  domains: string[];
  requireMfa: boolean;
  sessionMinutes: number; // 480 | 1440 | 10080
}

interface Props {
  canEdit: boolean;
  isOwner: boolean;
  state: SecurityState;
  setState: (next: SecurityState) => void;
  domainError: string | null;
}

const SESSION_OPTIONS = [
  { value: "480", label: "8 hours" },
  { value: "1440", label: "24 hours" },
  { value: "10080", label: "7 days" },
];

// Accepts "example.com" or "@example.com"; lowercase + strip leading @.
function normalizeDomain(raw: string): string | null {
  const v = raw.trim().toLowerCase().replace(/^@/, "");
  if (!v) return null;
  // Basic domain shape: at least one dot, no spaces, valid chars.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) return null;
  return v;
}

export function SecuritySection({ canEdit, isOwner, state, setState, domainError }: Props) {
  const [draft, setDraft] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const disabled = !canEdit;

  const addDomain = () => {
    const d = normalizeDomain(draft);
    if (!d) {
      toast.error("Enter a valid domain like iitb.ac.in");
      return;
    }
    if (state.domains.includes(d)) {
      toast.error("That domain is already in the list");
      return;
    }
    setState({ ...state, domains: [...state.domains, d] });
    setDraft("");
  };

  const removeDomain = (d: string) => {
    setState({ ...state, domains: state.domains.filter((x) => x !== d) });
  };

  const signOutEverywhere = async () => {
    if (!isOwner) return;
    if (!confirm("Sign out every team session, including your own? You'll need to log back in.")) return;
    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out everywhere");
  };

  return (
    <div className="space-y-4">
      {/* Allowed candidate domains */}
      <div className="b2b-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Allowed candidate email domains</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
          Only candidates whose email matches one of these domains can register or take your assessments.
          Leave empty to allow any domain.
        </p>

        <div className="flex gap-2">
          <Input
            value={draft}
            disabled={disabled}
            placeholder="iitb.ac.in"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDomain();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addDomain} disabled={disabled || !draft.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {domainError && <p className="text-[11px] text-destructive mt-1.5">{domainError}</p>}

        {state.domains.length === 0 ? (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-3">
            No restrictions — anyone with an invite link can register.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {state.domains.map((d) => (
              <li
                key={d}
                className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))]/40 pl-2.5 pr-1 py-1 text-xs"
              >
                <span>@{d}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeDomain(d)}
                    className="rounded-full p-0.5 hover:bg-[hsl(var(--muted))]"
                    aria-label={`Remove ${d}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team auth */}
      <div className="b2b-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold mb-0.5">Team authentication</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Controls how your admins, recruiters and reviewers sign in.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-[hsl(var(--border))] pt-4">
          <div>
            <Label htmlFor="require-mfa" className="text-xs">Require multi-factor auth</Label>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Team members must add an authenticator app before they can access the dashboard.
              Owner-only setting.
            </p>
          </div>
          <Switch
            id="require-mfa"
            checked={state.requireMfa}
            disabled={!isOwner}
            onCheckedChange={(v) => setState({ ...state, requireMfa: v })}
          />
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-4 space-y-1.5">
          <Label className="text-xs">Team session length</Label>
          <Select
            value={String(state.sessionMinutes)}
            disabled={disabled}
            onValueChange={(v) => setState({ ...state, sessionMinutes: Number(v) })}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            How long a team member stays signed in before needing to log in again.
          </p>
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-4 flex items-start justify-between gap-4">
          <div>
            <Label className="text-xs">Sign out all team sessions</Label>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Use this if a laptop is lost or a member's account may be compromised.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={signOutEverywhere}
            disabled={!isOwner || signingOut}
          >
            <LogOut className="h-4 w-4 mr-1" />
            {signingOut ? "Signing out…" : "Sign out everywhere"}
          </Button>
        </div>
      </div>
    </div>
  );
}
