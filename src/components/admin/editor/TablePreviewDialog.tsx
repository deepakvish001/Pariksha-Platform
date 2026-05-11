import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableReport } from "@/lib/admin/paste/sanitizeTables";

interface Props {
  open: boolean;
  report: TableReport | null;
  onCancel: () => void;
  /** Apply with a map of table-index → edited cleaned markdown (overrides). */
  onApply: (edits: Record<number, string>) => void;
}

const KIND_LABELS: Record<string, string> = {
  "missing-separator": "Missing separator row — added one",
  "header-row-promoted": "First row promoted to header",
  "column-count-mismatch": "Row column counts differed — padded",
  "alignment-inconsistent": "Inconsistent alignment — normalized",
  "empty-header": "Header row was empty",
};

/** Parse a markdown pipe-table block into header/body rows of cell strings. */
function parseTableBlock(src: string): { header: string[]; rows: string[][]; hasSep: boolean } {
  const lines = src.split("\n").filter((l) => l.trim().startsWith("|"));
  const split = (line: string) => {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map((c) => c.trim());
  };
  if (!lines.length) return { header: [], rows: [], hasSep: false };
  const SEP = /^\s*:?-{3,}:?\s*$/;
  const isSep = (cells: string[]) => cells.length > 0 && cells.every((c) => SEP.test(c));
  const sepIdx = lines.findIndex((l) => isSep(split(l)));
  if (sepIdx === -1) {
    return { header: split(lines[0]), rows: lines.slice(1).map(split), hasSep: false };
  }
  return {
    header: split(lines[0]),
    rows: lines.filter((_, k) => k !== 0 && k !== sepIdx).map(split),
    hasSep: true,
  };
}

interface DiffTableModel {
  header: string[];
  rows: Array<{ cells: string[]; cellChanged: boolean[]; rowAdded: boolean }>;
  headerChanged: boolean[];
}

function buildDiffModel(before: string, after: string): { src: DiffTableModel; out: DiffTableModel } {
  const a = parseTableBlock(before);
  const b = parseTableBlock(after);
  const cols = Math.max(a.header.length, b.header.length, ...a.rows.map((r) => r.length), ...b.rows.map((r) => r.length), 0);
  const pad = (r: string[]) => (r.length >= cols ? r.slice(0, cols) : [...r, ...Array(cols - r.length).fill("")]);

  const headerA = pad(a.header);
  const headerB = pad(b.header);
  const headerChanged = headerA.map((c, i) => c !== headerB[i]);

  const rowsA = a.rows.map(pad);
  const rowsB = b.rows.map(pad);
  const maxRows = Math.max(rowsA.length, rowsB.length);

  const srcRows: DiffTableModel["rows"] = [];
  const outRows: DiffTableModel["rows"] = [];
  for (let i = 0; i < maxRows; i++) {
    const ra = rowsA[i];
    const rb = rowsB[i];
    if (ra && rb) {
      const changed = ra.map((c, k) => c !== rb[k]);
      srcRows.push({ cells: ra, cellChanged: changed, rowAdded: false });
      outRows.push({ cells: rb, cellChanged: changed, rowAdded: false });
    } else if (rb) {
      outRows.push({ cells: rb, cellChanged: rb.map(() => true), rowAdded: true });
    } else if (ra) {
      srcRows.push({ cells: ra, cellChanged: ra.map(() => true), rowAdded: true });
    }
  }

  return {
    src: { header: headerA, rows: srcRows, headerChanged },
    out: { header: headerB, rows: outRows, headerChanged },
  };
}

function DiffTable({ model, side }: { model: DiffTableModel; side: "before" | "after" }) {
  const changeCls =
    side === "after"
      ? "bg-emerald-500/15 ring-1 ring-emerald-500/40 ring-inset"
      : "bg-amber-500/10 ring-1 ring-amber-500/40 ring-inset";
  const addedRowCls =
    side === "after" ? "bg-emerald-500/10" : "bg-amber-500/10 line-through opacity-70";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px] font-mono">
        <thead>
          <tr>
            {model.header.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "border border-border px-2 py-1 text-left align-top font-semibold",
                  model.headerChanged[i] && changeCls,
                )}
              >
                {c || <span className="text-muted-foreground">·</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((r, ri) => (
            <tr key={ri} className={cn(r.rowAdded && addedRowCls)}>
              {r.cells.map((c, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "border border-border px-2 py-1 align-top",
                    !r.rowAdded && r.cellChanged[ci] && changeCls,
                  )}
                >
                  {c || <span className="text-muted-foreground">·</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TablePreviewDialog({ open, report, onCancel, onApply }: Props) {
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<Record<number, boolean>>({});

  // Reset edits whenever the dialog re-opens with a new report.
  useEffect(() => {
    if (open) {
      setEdits({});
      setEditing({});
    }
  }, [open, report]);

  const summary = useMemo(() => {
    if (!report) return null;
    const grouped = new Map<number, string[]>();
    for (const i of report.issues) {
      const arr = grouped.get(i.index) ?? [];
      const label = KIND_LABELS[i.kind] ?? i.kind;
      if (!arr.includes(label)) arr.push(label);
      grouped.set(i.index, arr);
    }
    return grouped;
  }, [report]);

  if (!report) return null;

  const totalRowDiffs = report.diffs.reduce((acc, d) => {
    const m = buildDiffModel(d.before, d.after);
    const headerChanges = m.out.headerChanged.filter(Boolean).length;
    const cellChanges = m.out.rows.reduce((s, r) => s + (r.rowAdded ? r.cells.length : r.cellChanged.filter(Boolean).length), 0);
    return acc + headerChanges + cellChanges;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            Review pasted tables
          </DialogTitle>
          <DialogDescription>
            {report.tablesNormalized} of {report.tablesFound} pasted{" "}
            {report.tablesFound === 1 ? "table" : "tables"} needed cleanup
            {totalRowDiffs > 0 ? ` · ${totalRowDiffs} cell change${totalRowDiffs === 1 ? "" : "s"}` : ""}
            . Edit individual tables before applying if needed.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            {report.diffs.map((d) => {
              const issues = summary?.get(d.index) ?? [];
              const model = buildDiffModel(d.before, d.after);
              const isEditing = !!editing[d.index];
              const editedValue = edits[d.index] ?? d.after;

              return (
                <div key={d.index} className="rounded-md border border-border">
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2 text-xs">
                    <span className="font-semibold">Table {d.index + 1}</span>
                    {issues.map((label) => (
                      <Badge key={label} variant="outline" className="font-normal">
                        {label}
                      </Badge>
                    ))}
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={isEditing ? "secondary" : "ghost"}
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setEditing((prev) => ({ ...prev, [d.index]: !prev[d.index] }))
                        }
                      >
                        {isEditing ? (
                          <>
                            <Eye className="mr-1 h-3 w-3" aria-hidden /> Preview
                          </>
                        ) : (
                          <>
                            <Pencil className="mr-1 h-3 w-3" aria-hidden /> Edit
                          </>
                        )}
                      </Button>
                      {edits[d.index] !== undefined && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() =>
                            setEdits((prev) => {
                              const { [d.index]: _, ...rest } = prev;
                              return rest;
                            })
                          }
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="p-3">
                      <Textarea
                        value={editedValue}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [d.index]: e.target.value }))
                        }
                        rows={Math.min(14, Math.max(5, editedValue.split("\n").length + 1))}
                        spellCheck={false}
                        className="font-mono text-[11px] leading-snug"
                        aria-label={`Edit cleaned markdown for table ${d.index + 1}`}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Edits apply only to this table when you click Apply.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-0 sm:grid-cols-2">
                      <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Original
                        </div>
                        <DiffTable model={model.src} side="before" />
                      </div>
                      <div className="p-3">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          Cleaned (GFM){edits[d.index] !== undefined ? " · edited" : ""}
                        </div>
                        <DiffTable model={model.out} side="after" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel paste
          </Button>
          <Button onClick={() => onApply(edits)}>
            Apply cleaned version
            {Object.keys(edits).length > 0 ? ` (${Object.keys(edits).length} edited)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
