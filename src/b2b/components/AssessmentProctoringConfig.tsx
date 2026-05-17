import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPreset,
  resolveProctoringConfig,
  type ProctoringConfig,
  type ProctoringEventKey,
  type ProctoringEventRule,
} from "@/assessments/lib/proctoringConfig";

interface Props {
  value: unknown;
  enabled: boolean;
  onChange: (next: ProctoringConfig) => void;
}

const EVENT_LABELS: Record<ProctoringEventKey, string> = {
  tab_switch: "Tab switch",
  window_blur: "Window blur",
  fullscreen_exit: "Fullscreen exit",
  copy: "Copy",
  paste: "Paste",
  paste_large: "Large paste (>50 chars)",
  typing_burst: "Typing burst (super-human cpm)",
  devtools_attempt: "DevTools attempt",
  print_blocked: "Print / save attempt",
  webcam_lost: "Webcam lost",
  no_face: "No face detected",
  multi_face: "Multiple faces",
  second_monitor: "Second monitor",
  screenshare_lost: "Screen share stopped",
  device_change: "Device fingerprint change",
  side_eye_lost: "Side-eye phone disconnected",
};

const ALL_KEYS = Object.keys(EVENT_LABELS) as ProctoringEventKey[];

const STRICTNESS_DESC: Record<ProctoringConfig["strictness"], string> = {
  lenient: "Few rules, generous strike budget. Suitable for practice rounds.",
  balanced: "Recommended. Catches common cheating without false positives.",
  strict: "Hair-trigger. Most events auto-submit on first occurrence.",
};

/**
 * Per-assessment proctoring rule editor. Persists as `proctoring_config` JSONB.
 */
export function AssessmentProctoringConfig({ value, enabled, onChange }: Props) {
  const cfg = useMemo(() => resolveProctoringConfig(value, enabled), [value, enabled]);
  const [advanced, setAdvanced] = useState(false);

  const update = (patch: Partial<ProctoringConfig>) => onChange({ ...cfg, ...patch });
  const updateRule = (k: ProctoringEventKey, rule: ProctoringEventRule | null) => {
    const events = { ...cfg.events };
    if (rule === null) delete events[k];
    else events[k] = rule;
    onChange({ ...cfg, events });
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Anti-cheat strictness
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["lenient", "balanced", "strict"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(getPreset(p))}
              disabled={!enabled}
              className={cn(
                "rounded-md border p-3 text-left transition",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                cfg.strictness === p
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="text-sm font-semibold capitalize">{p}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {STRICTNESS_DESC[p]}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <Toggle
            label="Require full-screen share"
            description="Detects 2nd monitors & app-switching."
            checked={cfg.require_screen_share}
            disabled={!enabled}
            onChange={(v) => update({ require_screen_share: v })}
          />
          <Toggle
            label="Require AI face check"
            description="Reviews webcam frames for face & person count."
            checked={cfg.require_face_detection}
            disabled={!enabled}
            onChange={(v) => update({ require_face_detection: v })}
          />
          <Toggle
            label="Require Third Eye (phone)"
            description="Side-camera pairing before the attempt starts."
            checked={cfg.require_side_eye}
            disabled={!enabled}
            onChange={(v) => update({ require_side_eye: v })}
          />
          <Toggle
            label="Allow copy/paste inside answer fields"
            description="Blocks copy/paste globally otherwise."
            checked={cfg.allow_clipboard_in_inputs}
            disabled={!enabled}
            onChange={(v) => update({ allow_clipboard_in_inputs: v })}
          />
          <Toggle
            label="Record full session (all 3 eyes)"
            description="Continuously captures webcam, screen and side-cam for later replay."
            checked={cfg.record_full_session}
            disabled={!enabled}
            onChange={(v) => update({ record_full_session: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Max violations before auto-submit</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={cfg.max_violations}
              disabled={!enabled}
              onChange={(e) =>
                update({ max_violations: Math.max(1, Number(e.target.value) || 1) })
              }
              className="mt-1 h-8"
            />
          </div>
          <div>
            <label className="text-xs font-medium">AI review every (seconds, 0 = off)</label>
            <Input
              type="number"
              min={0}
              max={600}
              value={cfg.ai_review_interval_s}
              disabled={!enabled}
              onChange={(e) =>
                update({ ai_review_interval_s: Math.max(0, Number(e.target.value) || 0) })
              }
              className="mt-1 h-8"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-xs font-medium text-primary inline-flex items-center gap-1"
        >
          {advanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Advanced — per-event rules
        </button>

        {advanced && (
          <div className="rounded-md border border-border divide-y">
            {ALL_KEYS.map((k) => {
              const r = cfg.events[k];
              return (
                <div key={k} className="px-3 py-2 grid grid-cols-12 items-center gap-2 text-xs">
                  <div className="col-span-4">
                    <div className="font-medium">{EVENT_LABELS[k]}</div>
                    <code className="text-[10px] text-muted-foreground">{k}</code>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase text-muted-foreground">Weight</label>
                    <Input
                      type="number"
                      value={r?.weight ?? 0}
                      disabled={!enabled || !r}
                      onChange={(e) =>
                        updateRule(k, { ...(r ?? {}), weight: Number(e.target.value) || 0 })
                      }
                      className="h-7 mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase text-muted-foreground">Auto @</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={r?.autosubmit_after ?? ""}
                      disabled={!enabled || !r}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        updateRule(k, {
                          ...(r ?? { weight: 0 }),
                          autosubmit_after: n > 0 ? n : undefined,
                        });
                      }}
                      className="h-7 mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-1 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!r?.strike}
                        disabled={!enabled || !r}
                        onChange={(e) =>
                          updateRule(k, { ...(r ?? { weight: 0 }), strike: e.target.checked })
                        }
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span className="text-[10px]">Strike</span>
                    </label>
                  </div>
                  <div className="col-span-2 text-right">
                    {r ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        disabled={!enabled}
                        onClick={() => updateRule(k, null)}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px]"
                        disabled={!enabled}
                        onClick={() => updateRule(k, { weight: 3 })}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!enabled && (
          <Badge variant="outline" className="text-[10px]">
            Enable proctoring above to edit these rules.
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex gap-2 items-start rounded-md border border-border p-2 cursor-pointer transition",
        !disabled && "hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground leading-snug">{description}</div>
      </div>
    </label>
  );
}
