import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { TableReport } from "@/lib/admin/paste/sanitizeTables";

interface Props {
  open: boolean;
  report: TableReport | null;
  onCancel: () => void;
  onApply: () => void;
}

const KIND_LABELS: Record<string, string> = {
  "missing-separator": "Missing separator row — added one",
  "header-row-promoted": "First row promoted to header",
  "column-count-mismatch": "Row column counts differed — padded",
  "alignment-inconsistent": "Inconsistent alignment — normalized",
  "empty-header": "Header row was empty",
};

export function TablePreviewDialog({ open, report, onCancel, onApply }: Props) {
  const summary = useMemo(() => {
    if (!report) return null;
    const grouped = new Map<number, string[]>();
    for (const i of report.issues) {
      const arr = grouped.get(i.index) ?? [];
      arr.push(KIND_LABELS[i.kind] ?? i.kind);
      grouped.set(i.index, arr);
    }
    return grouped;
  }, [report]);

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            Review pasted tables
          </DialogTitle>
          <DialogDescription>
            {report.tablesNormalized} of {report.tablesFound} pasted{" "}
            {report.tablesFound === 1 ? "table" : "tables"} needed cleanup.
            Review the cleaned versions before applying.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-4">
            {report.diffs.map((d) => {
              const issues = summary?.get(d.index) ?? [];
              return (
                <div key={d.index} className="rounded-md border border-border">
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2 text-xs">
                    <span className="font-semibold">Table {d.index + 1}</span>
                    {issues.map((label) => (
                      <Badge key={label} variant="outline" className="font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-0 sm:grid-cols-2">
                    <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Original
                      </div>
                      <pre className="overflow-x-auto whitespace-pre rounded bg-muted/40 p-2 text-[11px] font-mono leading-snug">
                        {d.before}
                      </pre>
                    </div>
                    <div className="p-3">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Cleaned (GFM)
                      </div>
                      <pre className="overflow-x-auto whitespace-pre rounded bg-emerald-500/10 p-2 text-[11px] font-mono leading-snug">
                        {d.after}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel paste
          </Button>
          <Button onClick={onApply}>Apply cleaned version</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
