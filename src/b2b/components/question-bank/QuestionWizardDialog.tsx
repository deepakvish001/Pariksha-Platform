import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Database,
  ListChecks,
  PenLine,
  CheckSquare,
  Shuffle,
  Type as TypeIcon,
  Hash,
  SquareDashedBottom,
  ArrowRight,
} from "lucide-react";
import type { Question, QuestionType } from "../../hooks/useQuestions";
import { CodingWizard } from "./CodingWizard";
import { SqlWizard } from "./SqlWizard";
import { TYPE_CARDS } from "./types";

const ICONS = {
  code: Code2,
  database: Database,
  list: ListChecks,
  pen: PenLine,
  check: CheckSquare,
  shuffle: Shuffle,
  type: TypeIcon,
  hash: Hash,
  blank: SquareDashedBottom,
};

export function QuestionWizardDialog({
  orgId,
  open,
  onOpenChange,
  initial,
  initialStep,
  forceType,
  onCreateLegacy,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Question;
  initialStep?: number;
  forceType?: QuestionType;
  /** Fallback for question types not yet wizard-ified — opens the old simple form. */
  onCreateLegacy?: (type: QuestionType) => void;
}) {
  const [picked, setPicked] = useState<QuestionType | undefined>(
    forceType ?? initial?.type,
  );

  const close = () => {
    onOpenChange(false);
    if (!initial) setPicked(undefined);
  };

  const renderWizard = () => {
    if (!picked) return null;
    if (picked === "coding") {
      return (
        <CodingWizard
          orgId={orgId}
          initial={initial}
          startStep={initialStep ?? 0}
          onDone={close}
          onCancel={close}
        />
      );
    }
    if (picked === "sql") {
      return (
        <SqlWizard
          orgId={orgId}
          initial={initial}
          startStep={initialStep ?? 0}
          onDone={close}
          onCancel={close}
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initial ? `Edit ${picked} question` : picked ? `New ${picked} question` : "New question"}
          </DialogTitle>
          {!picked && (
            <DialogDescription>
              Pick the question type. Coding and SQL include a guided multi-step flow.
            </DialogDescription>
          )}
        </DialogHeader>

        {!picked ? (
          <div className="grid sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
            {TYPE_CARDS.map((card) => {
              const Icon = ICONS[card.icon];
              const guided = card.value === "coding" || card.value === "sql";
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => {
                    if (guided) setPicked(card.value);
                    else {
                      onOpenChange(false);
                      onCreateLegacy?.(card.value);
                    }
                  }}
                  className="text-left group border rounded-lg p-4 hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))/0.5] transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-[hsl(var(--secondary))] grid place-items-center text-[hsl(var(--primary))] shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{card.label}</div>
                        {guided && (
                          <span className="text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] font-medium">
                            Guided
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {card.description}
                      </p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
                        <span className="font-medium">Best for:</span> {card.bestFor}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {!initial && !forceType && (
              <div className="mb-3">
                <Button variant="ghost" size="sm" onClick={() => setPicked(undefined)}>
                  ← Change type
                </Button>
              </div>
            )}
            <div className="flex-1 min-h-0">{renderWizard()}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
