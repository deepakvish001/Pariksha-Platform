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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  onAdd: (tests: { input: string; expected: string }[]) => void;
  existing: { input: string; expected: string }[];
}

export const BulkTestsDialog = ({ trigger, onAdd, existing }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handleAdd = () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const tests = lines
      .map((l) => {
        const parts = l.split("|||");
        if (parts.length < 2) return null;
        return { input: parts[0].trim(), expected: parts.slice(1).join("|||").trim() };
      })
      .filter(Boolean) as { input: string; expected: string }[];
    if (!tests.length) {
      toast.error("No valid lines. Use: input ||| expected");
      return;
    }
    onAdd(tests);
    toast.success(`Added ${tests.length} test${tests.length === 1 ? "" : "s"}`);
    setText("");
    setOpen(false);
  };

  const handleImport = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      if (!Array.isArray(json)) throw new Error("Expected an array");
      const valid = json.filter(
        (t: any) => typeof t?.input === "string" && typeof t?.expected === "string",
      );
      if (!valid.length) throw new Error("No valid tests in file");
      onAdd(valid);
      toast.success(`Imported ${valid.length} test${valid.length === 1 ? "" : "s"}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(existing, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tests.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk add / import tests</DialogTitle>
          <DialogDescription>
            Paste one test per line in <code>input ||| expected</code> format, or import a JSON
            file with an array of <code>{`{ input, expected }`}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="bulk-tests-paste">Paste lines</Label>
            <Textarea
              id="bulk-tests-paste"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`[1,2,3]\\n5 ||| 6\nhello ||| HELLO`}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/json"
              id="bulk-tests-file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => document.getElementById("bulk-tests-file")?.click()}
            >
              Import JSON
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={handleExport}>
              Export current ({existing.length})
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add to tests</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
