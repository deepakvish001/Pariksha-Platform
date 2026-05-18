import { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type WizardStep = { key: string; label: string; description?: string };

export function WizardShell({
  steps,
  current,
  onStep,
  canAdvance,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
  saving,
  isLast,
  children,
  rightPane,
}: {
  steps: WizardStep[];
  current: number;
  onStep: (i: number) => void;
  canAdvance: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  saving?: boolean;
  isLast?: boolean;
  children: ReactNode;
  rightPane?: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="grid md:grid-cols-[200px_1fr] gap-6 flex-1 min-h-0">
        {/* Step rail */}
        <ol className="space-y-1 md:border-r md:pr-4">
          {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  className={`w-full text-left flex items-start gap-2 rounded-md px-2 py-2 text-sm transition ${
                    active
                      ? "bg-[hsl(var(--secondary))]"
                      : "hover:bg-[hsl(var(--secondary))/0.5]"
                  }`}
                >
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center text-[10px] font-semibold border ${
                      done
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                        : active
                        ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <div className="font-medium leading-tight">{s.label}</div>
                    {s.description && (
                      <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        {s.description}
                      </div>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step body */}
        <div className="min-w-0 overflow-y-auto pr-1">
          {rightPane ? (
            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
              <div className="min-w-0 space-y-4">{children}</div>
              <aside className="lg:border-l lg:pl-4">
                <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">
                  Candidate sees
                </div>
                {rightPane}
              </aside>
            </div>
          ) : (
            <div className="space-y-4">{children}</div>
          )}
        </div>
      </div>

      <div className="border-t mt-4 pt-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={!onBack || current === 0 || saving}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button variant="outline" onClick={onSaveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
          )}
          {!isLast ? (
            <Button
              onClick={onNext}
              disabled={!canAdvance || saving}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={onPublish}
              disabled={!canAdvance || saving}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              {saving ? "Publishing…" : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
