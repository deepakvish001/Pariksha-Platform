import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface ExampleEntry {
  input: string;
  output: string;
  explanation?: string;
}

interface Props {
  trigger: React.ReactNode;
  /** Append imported examples to the end of the current list. */
  onAdd: (examples: ExampleEntry[]) => void;
  /** Replace all current examples with the imported ones. */
  onReplace: (examples: ExampleEntry[]) => void;
  existing: ExampleEntry[];
}

const sanitize = (raw: unknown): ExampleEntry[] => {
  if (!Array.isArray(raw)) throw new Error("Expected an array");
  const out: ExampleEntry[] = [];
  raw.forEach((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Row ${i + 1} is not an object`);
    const r = row as Record<string, unknown>;
    if (typeof r.input !== "string" || typeof r.output !== "string") {
      throw new Error(`Row ${i + 1} missing input/output`);
    }
    out.push({
      input: r.input,
      output: r.output,
      explanation: typeof r.explanation === "string" ? r.explanation : undefined,
    });
  });
  if (!out.length) throw new Error("File contained no examples");
  return out;
};

export const BulkExamplesDialog = ({ trigger, onAdd, onReplace, existing }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ExampleEntry[] | null>(null);

  const handleImport = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      const valid = sanitize(json);
      setPending(valid);
    } catch (err: any) {
      toast.error(`Import failed: ${err?.message ?? "Invalid JSON"}`);
    }
  };

  const handleExport = () => {
    if (!existing.length) {
      toast.error("Nothing to export — add an example first");
      return;
    }
    const blob = new Blob([JSON.stringify(existing, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "examples.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setPending(null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setPending(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / export examples</DialogTitle>
          <DialogDescription>
            Move examples between problems by exporting them as JSON and re-importing into another
            editor. Each item must have <code>input</code> and <code>output</code> strings, plus an
            optional <code>explanation</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/json"
              id="bulk-examples-file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => document.getElementById("bulk-examples-file")?.click()}
            >
              Choose JSON file…
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={handleExport}>
              Export current ({existing.length})
            </Button>
          </div>

          {pending && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-xs">
                Preview — {pending.length} example{pending.length === 1 ? "" : "s"} ready
              </Label>
              <ul className="max-h-48 space-y-1 overflow-auto pr-2 text-xs">
                {pending.slice(0, 10).map((p, i) => (
                  <li key={i} className="truncate font-mono text-[11px] text-muted-foreground">
                    #{i + 1} input: <span className="text-foreground">{p.input.slice(0, 60) || "—"}</span>
                  </li>
                ))}
                {pending.length > 10 && (
                  <li className="text-muted-foreground">…and {pending.length - 10} more</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={reset}>
            Cancel
          </Button>
          {pending && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onReplace(pending);
                  toast.success(`Replaced with ${pending.length} examples`);
                  reset();
                }}
              >
                Replace all
              </Button>
              <Button
                onClick={() => {
                  onAdd(pending);
                  toast.success(`Appended ${pending.length} examples`);
                  reset();
                }}
              >
                Append
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
