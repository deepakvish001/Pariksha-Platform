import { useState } from "react";
import { Bell, X, Plus, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface NotificationsState {
  digestEmails: string[];
  proctoringEmails: string[];
  slackWebhook: string;
  dailySummary: boolean;
}

interface Props {
  canEdit: boolean;
  state: NotificationsState;
  setState: (next: NotificationsState) => void;
  slackError: string | null;
  emailError: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  return EMAIL_RE.test(v) ? v : null;
}

interface ChipListProps {
  label: string;
  help: string;
  placeholder: string;
  disabled: boolean;
  values: string[];
  onChange: (next: string[]) => void;
}

function EmailChipList({ label, help, placeholder, disabled, values, onChange }: ChipListProps) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const e = normalizeEmail(draft);
    if (!e) {
      toast.error("Enter a valid email address");
      return;
    }
    if (values.includes(e)) {
      toast.error("That email is already on the list");
      return;
    }
    onChange([...values, e]);
    setDraft("");
  };
  const remove = (e: string) => onChange(values.filter((x) => x !== e));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={disabled || !draft.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{help}</p>
      {values.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.map((e) => (
            <li
              key={e}
              className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))]/40 pl-2.5 pr-1 py-1 text-xs"
            >
              <span>{e}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(e)}
                  className="rounded-full p-0.5 hover:bg-[hsl(var(--muted))]"
                  aria-label={`Remove ${e}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NotificationsSection({ canEdit, state, setState, slackError, emailError }: Props) {
  const disabled = !canEdit;

  return (
    <div className="space-y-4">
      <div className="b2b-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Result digests</h2>
        </div>

        <EmailChipList
          label="Email recipients for completion digests"
          help="These people receive an email each time a candidate submits an assessment."
          placeholder="hiring@yourco.com"
          disabled={disabled}
          values={state.digestEmails}
          onChange={(v) => setState({ ...state, digestEmails: v })}
        />

        <div className="border-t border-[hsl(var(--border))] pt-4 flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="daily-summary" className="text-xs">Daily summary email</Label>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Sends one combined email per day at 9am with new submissions instead of one per candidate.
            </p>
          </div>
          <Switch
            id="daily-summary"
            checked={state.dailySummary}
            disabled={disabled}
            onCheckedChange={(v) => setState({ ...state, dailySummary: v })}
          />
        </div>
      </div>

      <div className="b2b-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Proctoring incidents</h2>
        </div>
        <EmailChipList
          label="Recipients for proctoring incidents"
          help="Alerted when a candidate triggers strict-proctoring violations (face missing, multiple people, tab-switch limit)."
          placeholder="security@yourco.com"
          disabled={disabled}
          values={state.proctoringEmails}
          onChange={(v) => setState({ ...state, proctoringEmails: v })}
        />
        {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
      </div>

      <div className="b2b-card p-6 space-y-2">
        <Label htmlFor="slack-url" className="text-xs">Slack / generic webhook URL</Label>
        <Input
          id="slack-url"
          value={state.slackWebhook}
          disabled={disabled}
          onChange={(e) => setState({ ...state, slackWebhook: e.target.value })}
          placeholder="https://hooks.slack.com/services/…"
        />
        {slackError ? (
          <p className="text-[11px] text-destructive">{slackError}</p>
        ) : (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            We'll POST a JSON payload to this URL for every new submission and proctoring incident.
            Works with Slack incoming webhooks, Discord, or your own endpoint.
          </p>
        )}
      </div>
    </div>
  );
}
