import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PaletteLegend } from "./PaletteLegend";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["←", "→"], label: "Previous / Next question" },
  { keys: ["1", "–", "9"], label: "Pick option (MCQ / True-False)" },
  { keys: ["F"], label: "Flag current question for review" },
  { keys: ["⌘ / Ctrl", "S"], label: "Save now (flushes autosave)" },
  { keys: ["⌘ / Ctrl", "↵"], label: "Run code (coding & SQL)" },
  { keys: ["⌘ / Ctrl", "⇧", "↵"], label: "Submit code for grading" },
  { keys: ["Esc"], label: "Exit focus mode" },
];

const TIPS = [
  "Your answers autosave a fraction of a second after you stop typing.",
  "If your connection drops, your typing stays safe — it syncs the moment you’re back online.",
  "Use Focus mode to hide the navigation rail and bottom bar for distraction-free work.",
  "Flag a question and come back later — the palette shows everything you’ve marked.",
];

export function PlayerHelpSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[420px] p-5 overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Help & shortcuts</SheetTitle>
          <SheetDescription>
            Calm, keyboard-first navigation. Nothing else changes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Keyboard
            </h3>
            <ul className="space-y-1.5">
              {SHORTCUTS.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground/80">{s.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono font-medium min-w-[20px] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Good to know
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-4 marker:text-muted-foreground/60">
              {TIPS.map((t, i) => (
                <li key={i} className="leading-relaxed">{t}</li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
