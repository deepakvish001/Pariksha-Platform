import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { TAB_LABELS, type TabId, type ValidationReport } from "@/lib/admin/problemValidation";

interface Props {
  trigger: ReactNode;
  report: ValidationReport;
  onConfirm: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onJumpTo?: (tab: TabId) => void;
}

const ROW_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  empty: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
};

export const PublishChecklistDialog = ({
  trigger,
  report,
  onConfirm,
  open,
  onOpenChange,
  onJumpTo,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pre-publish checklist</DialogTitle>
          <DialogDescription>
            {report.canPublish
              ? "All required checks pass. Review warnings, then publish."
              : "Fix the items marked in red before publishing."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-3">
          <ul className="space-y-2 text-sm">
            {(Object.keys(report.sections) as TabId[]).map((tab) => {
              const sec = report.sections[tab];
              return (
                <li key={tab} className="rounded-md border p-2.5">
                  <button
                    type="button"
                    onClick={() => onJumpTo?.(tab)}
                    className="flex w-full items-center gap-2 text-left font-medium hover:underline"
                  >
                    {ROW_ICON[sec.status]}
                    <span>{TAB_LABELS[tab]}</span>
                  </button>
                  {(sec.errors.length > 0 || sec.warnings.length > 0) && (
                    <ul className="mt-1.5 space-y-1 pl-6 text-xs">
                      {sec.errors.map((e, i) => (
                        <li key={`e${i}`} className="text-destructive">• {e}</li>
                      ))}
                      {sec.warnings.map((w, i) => (
                        <li key={`w${i}`} className="text-amber-600 dark:text-amber-400">• {w}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!report.canPublish}>
            {report.canPublish ? "Publish now" : "Fix errors to publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
