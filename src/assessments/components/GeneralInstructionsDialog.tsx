import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, AlertTriangle, Camera, Mic, Smartphone, Wifi } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentTitle: string;
  instructions?: string | null;
  durationMin?: number | null;
  proctoring?: boolean;
}

const RULES = [
  { icon: Camera, label: "Keep your webcam on and your face fully visible at all times." },
  { icon: Smartphone, label: "Do not lock your phone (Third Eye) or switch apps during the test." },
  { icon: Mic, label: "Stay in a quiet, well-lit room. No one else may be present." },
  { icon: Wifi, label: "Stay connected — answers auto-save, but losing internet may pause the test." },
  { icon: AlertTriangle, label: "Do not open any other tab, copy text, or use external resources." },
];

/**
 * General-instructions modal accessible from the assessment top bar.
 * Shows the per-assessment markdown instructions (rendered as plain text
 * preserving line breaks) plus a static proctoring-rules block.
 */
export function GeneralInstructionsDialog({
  open,
  onOpenChange,
  assessmentTitle,
  instructions,
  durationMin,
  proctoring,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            General instructions
          </DialogTitle>
          <DialogDescription className="text-xs">
            {assessmentTitle}
            {typeof durationMin === "number" && durationMin > 0 ? ` · ${durationMin} min` : ""}
            {proctoring ? " · Proctored" : ""}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-5 text-sm">
            {instructions && instructions.trim() ? (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  From your administrator
                </h3>
                <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap leading-relaxed">
                  {instructions}
                </div>
              </section>
            ) : null}

            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Proctoring rules
              </h3>
              <ul className="space-y-2">
                {RULES.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <Icon className="h-3.5 w-3.5 mt-1 text-primary shrink-0" />
                      <span className="leading-relaxed">{r.label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Navigating the test
              </h3>
              <ul className="space-y-1.5 list-disc pl-5 text-muted-foreground">
                <li>Use the palette on the left to jump to any question.</li>
                <li>Use the A− / A+ buttons in the top bar to resize question text.</li>
                <li>Flagged questions can be reviewed before final submission.</li>
                <li>The SOS button alerts the proctor if you need urgent help.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
