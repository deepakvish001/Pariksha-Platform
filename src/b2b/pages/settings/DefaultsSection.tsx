import { ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProctoringProfile } from "../../hooks/useOrg";

export interface DefaultsState {
  duration: string; // kept as string so the input can be empty mid-edit
  proctoring: ProctoringProfile;
  passMark: string;
  allowRetake: boolean;
  autoRelease: boolean;
}

interface Props {
  canEdit: boolean;
  state: DefaultsState;
  setState: (next: DefaultsState) => void;
  durationError: string | null;
  passMarkError: string | null;
}

const PROCTORING_OPTIONS: { value: ProctoringProfile; label: string; desc: string }[] = [
  { value: "off", label: "Off", desc: "No camera or tab tracking. Practice-style." },
  { value: "basic", label: "Basic", desc: "Tab-switch warnings and webcam snapshots." },
  { value: "strict", label: "Strict", desc: "Continuous webcam + screen recording + lockdown." },
];

export function DefaultsSection({ canEdit, state, setState, durationError, passMarkError }: Props) {
  const patch = (p: Partial<DefaultsState>) => setState({ ...state, ...p });
  const disabled = !canEdit;

  return (
    <div className="space-y-4">
      <div className="b2b-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Assessment defaults</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5">
          Every new assessment starts with these values. You can still override them per assessment.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="default-duration" className="text-xs">Default duration</Label>
            <div className="relative">
              <Input
                id="default-duration"
                type="number"
                min={5}
                max={600}
                inputMode="numeric"
                value={state.duration}
                disabled={disabled}
                onChange={(e) => patch({ duration: e.target.value })}
                placeholder="60"
                className="pr-16"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-[11px] text-[hsl(var(--muted-foreground))]">
                minutes
              </span>
            </div>
            {durationError ? (
              <p className="text-[11px] text-destructive">{durationError}</p>
            ) : (
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Between 5 and 600 minutes.</p>
            )}
          </div>

          {/* Pass mark */}
          <div className="space-y-1.5">
            <Label htmlFor="default-passmark" className="text-xs">Default pass mark</Label>
            <div className="relative">
              <Input
                id="default-passmark"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={state.passMark}
                disabled={disabled}
                onChange={(e) => patch({ passMark: e.target.value })}
                placeholder="40"
                className="pr-10"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-[11px] text-[hsl(var(--muted-foreground))]">
                %
              </span>
            </div>
            {passMarkError ? (
              <p className="text-[11px] text-destructive">{passMarkError}</p>
            ) : (
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Score required to pass, 0–100.</p>
            )}
          </div>

          {/* Proctoring */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Default proctoring profile</Label>
            <Select
              value={state.proctoring}
              disabled={disabled}
              onValueChange={(v) => patch({ proctoring: v as ProctoringProfile })}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCTORING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="font-medium">{o.label}</span>
                    <span className="ml-2 text-[11px] text-[hsl(var(--muted-foreground))]">{o.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 border-t border-[hsl(var(--border))] pt-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="allow-retake" className="text-xs">Allow retakes by default</Label>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Candidates may attempt the assessment more than once.
              </p>
            </div>
            <Switch
              id="allow-retake"
              checked={state.allowRetake}
              disabled={disabled}
              onCheckedChange={(v) => patch({ allowRetake: v })}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="auto-release" className="text-xs">Auto-release results</Label>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                When off, results stay hidden until you publish them manually.
              </p>
            </div>
            <Switch
              id="auto-release"
              checked={state.autoRelease}
              disabled={disabled}
              onCheckedChange={(v) => patch({ autoRelease: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
