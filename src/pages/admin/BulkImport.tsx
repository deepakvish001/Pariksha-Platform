import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileJson, CheckCircle2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ProblemSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string()).default([]),
  description: z.string().default(""),
  examples: z
    .array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() }))
    .default([]),
  constraints: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
  cpu_time_limit_sec: z.number().optional(),
  memory_limit_kb: z.number().optional(),
  is_published: z.boolean().default(false),
  starter_code: z.record(z.string(), z.string()).default({}),
  reference_solution: z.record(z.string(), z.string()).default({}),
  sample_tests: z.array(z.object({ input: z.string(), expected: z.string() })).default([]),
  hidden_tests: z.array(z.object({ input: z.string(), expected: z.string() })).default([]),
  sql_spec: z
    .object({
      schema_sql: z.string(),
      seed_sql: z.string(),
      reference_query: z.string(),
      order_matters: z.boolean(),
      starter: z.string(),
    })
    .nullable()
    .optional(),
});

type Row = { ok: boolean; data?: any; error?: string; raw: any };

const TEMPLATE = JSON.stringify(
  [
    {
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy",
      topics: ["Array", "Hash Table"],
      description: "Given an array `nums`…",
      examples: [{ input: "nums=[2,7], target=9", output: "[0,1]" }],
      constraints: ["2 <= nums.length <= 10^4"],
      hints: ["Use a hash map"],
      starter_code: { python: "def two_sum(nums, target):\n    pass\n" },
      reference_solution: { python: "def two_sum(nums, target):\n    seen={}\n    ..." },
      sample_tests: [{ input: "2 9\n2 7", expected: "0 1" }],
      hidden_tests: [{ input: "3 6\n3 2 4", expected: "1 2" }],
      is_published: true,
    },
  ],
  null,
  2,
);

const BulkImport = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const next: Row[] = arr.map((raw) => {
        const r = ProblemSchema.safeParse(raw);
        return r.success
          ? { ok: true, data: r.data, raw }
          : { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), raw };
      });
      setRows(next);
    } catch (e: any) {
      toast({ title: "Invalid JSON", description: e.message, variant: "destructive" });
    }
  };

  const importValid = async () => {
    const valid = rows.filter((r) => r.ok);
    if (valid.length === 0) return;
    setBusy(true);
    let success = 0;
    let failed = 0;
    for (const r of valid) {
      const { error } = await supabase.rpc("admin_save_problem", { payload: r.data as any });
      if (error) failed++;
      else success++;
    }
    setBusy(false);
    toast({
      title: "Import complete",
      description: `${success} saved, ${failed} failed.`,
    });
    if (success > 0) nav("/admin/problems");
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "coding-problems-template.json";
    a.click();
  };

  const validCount = rows.filter((r) => r.ok).length;
  const invalidCount = rows.length - validCount;

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bulk Import</h1>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileJson className="mr-2 h-4 w-4" /> Download template
        </Button>
      </div>

      <Card className="p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted py-10 text-center transition-colors hover:border-primary">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Drop or click to upload JSON</span>
          <span className="text-xs text-muted-foreground">
            Array of problems matching the template schema.
          </span>
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </Card>

      {rows.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500">
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-rose-500/15 text-rose-500">
                  {invalidCount} invalid
                </Badge>
              )}
            </div>
            <Button onClick={importValid} disabled={busy || validCount === 0}>
              {busy ? "Importing…" : `Import ${validCount} problems`}
            </Button>
          </div>
          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {rows.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                  r.ok ? "border-emerald-500/30" : "border-rose-500/30 bg-rose-500/5"
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs">
                    {r.raw?.slug ?? `row ${i + 1}`} — {r.raw?.title ?? "?"}
                  </p>
                  {r.error && (
                    <p className="mt-1 text-xs text-rose-500">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminShell>
  );
};

export default BulkImport;
