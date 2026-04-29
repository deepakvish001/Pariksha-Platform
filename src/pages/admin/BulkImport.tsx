import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileJson, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CODING_PROBLEMS } from "@/data/codingProblemsData";

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

interface RowIssue {
  path: string;
  message: string;
}
type Row = {
  ok: boolean;
  data?: any;
  error?: string;
  issues?: RowIssue[];
  raw: any;
  index: number;
};

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

  const parseRow = (raw: any, index: number): Row => {
    const r = ProblemSchema.safeParse(raw);
    if (r.success) return { ok: true, data: r.data, raw, index };
    const issues: RowIssue[] = r.error.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    }));
    return {
      ok: false,
      error: issues.map((i) => `${i.path}: ${i.message}`).join("; "),
      issues,
      raw,
      index,
    };
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      setRows(arr.map((raw, i) => parseRow(raw, i)));
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

  const seedFromStatic = () => {
    const mapped = CODING_PROBLEMS.map((p) => ({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      topics: p.topics ?? [],
      description: p.description ?? "",
      examples: (p.examples ?? []).map((e) => ({
        input: e.input,
        output: e.output,
        explanation: e.explanation,
      })),
      constraints: p.constraints ?? [],
      hints: p.hints ?? [],
      cpu_time_limit_sec: p.cpuTimeLimitSec ?? 2,
      memory_limit_kb: p.memoryLimitKb ?? 256000,
      is_published: true,
      starter_code: (p.starterCode ?? {}) as Record<string, string>,
      reference_solution: (p.referenceSolution ?? {}) as Record<string, string>,
      sample_tests: (p.sampleTests ?? []).map((t) => ({ input: t.input, expected: t.expected })),
      hidden_tests: (p.hiddenTests ?? []).map((t) => ({ input: t.input, expected: t.expected })),
      sql_spec: p.sql
        ? {
            schema_sql: p.sql.schema ?? "",
            seed_sql: p.sql.seed ?? "",
            reference_query: p.sql.referenceQuery ?? "",
            order_matters: !!p.sql.orderMatters,
            starter: p.sql.starter ?? "",
          }
        : null,
    }));
    const next: Row[] = mapped.map((raw, i) => parseRow(raw, i));
    setRows(next);
    toast({
      title: "Loaded static seed",
      description: `${next.filter((r) => r.ok).length}/${next.length} problems ready to import.`,
    });
  };

  const validCount = rows.filter((r) => r.ok).length;
  const invalidCount = rows.length - validCount;

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const downloadReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
      valid: rows
        .filter((r) => r.ok)
        .map((r) => ({ row: r.index + 1, slug: r.raw?.slug, title: r.raw?.title })),
      errors: rows
        .filter((r) => !r.ok)
        .map((r) => ({
          row: r.index + 1,
          slug: r.raw?.slug ?? null,
          title: r.raw?.title ?? null,
          issues: r.issues ?? [],
        })),
    };
    downloadJson(report, "bulk-import-report.json");
  };

  const downloadCorrected = () => {
    // A re-uploadable JSON: keeps every row, fills missing required fields with
    // safe defaults so the admin can finish editing externally instead of
    // starting over. Valid rows pass through unchanged.
    let fixedCount = 0;
    let stillBroken = 0;
    const corrected = rows.map((r) => {
      if (r.ok) return r.data;
      const raw = r.raw && typeof r.raw === "object" ? r.raw : {};
      const candidate = {
        slug: raw.slug || `__fix_me_row_${r.index + 1}`,
        title: raw.title || "(missing — please fill in)",
        difficulty: ["easy", "medium", "hard"].includes(raw.difficulty)
          ? raw.difficulty
          : "medium",
        topics: Array.isArray(raw.topics) ? raw.topics : [],
        description: typeof raw.description === "string" ? raw.description : "",
        examples: Array.isArray(raw.examples) ? raw.examples : [],
        constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
        hints: Array.isArray(raw.hints) ? raw.hints : [],
        cpu_time_limit_sec:
          typeof raw.cpu_time_limit_sec === "number" ? raw.cpu_time_limit_sec : 2,
        memory_limit_kb:
          typeof raw.memory_limit_kb === "number" ? raw.memory_limit_kb : 256000,
        is_published: false,
        starter_code:
          raw.starter_code && typeof raw.starter_code === "object"
            ? raw.starter_code
            : {},
        reference_solution:
          raw.reference_solution && typeof raw.reference_solution === "object"
            ? raw.reference_solution
            : {},
        sample_tests: Array.isArray(raw.sample_tests) ? raw.sample_tests : [],
        hidden_tests: Array.isArray(raw.hidden_tests) ? raw.hidden_tests : [],
        sql_spec: raw.sql_spec ?? null,
      };
      // Re-validate the corrected row against the schema.
      const verify = ProblemSchema.safeParse(candidate);
      if (verify.success) {
        fixedCount++;
        return verify.data;
      }
      stillBroken++;
      return {
        ...candidate,
        __issues: verify.error.issues.map((i) => ({
          path: i.path.join(".") || "(root)",
          message: i.message,
        })),
      };
    });
    downloadJson(corrected, "bulk-import-corrected.json");
    toast({
      title: "Corrected JSON downloaded",
      description:
        stillBroken === 0
          ? `${fixedCount} row${fixedCount === 1 ? "" : "s"} auto-fixed and now match the schema.`
          : `${fixedCount} fixed · ${stillBroken} still need manual edits (see __issues).`,
    });
  };

  const downloadErrorsCsv = () => {
    const escape = (val: unknown) => {
      const s = val == null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["row", "slug", "title", "issue_path", "issue_message"];
    const lines: string[] = [header.join(",")];
    rows
      .filter((r) => !r.ok)
      .forEach((r) => {
        const issues = r.issues && r.issues.length > 0
          ? r.issues
          : [{ path: "(root)", message: r.error ?? "Invalid row" }];
        issues.forEach((iss) => {
          lines.push(
            [
              r.index + 1,
              escape(r.raw?.slug ?? ""),
              escape(r.raw?.title ?? ""),
              escape(iss.path),
              escape(iss.message),
            ].join(","),
          );
        });
      });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk-import-errors.csv";
    a.click();
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bulk Import</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={seedFromStatic}>
            <Database className="mr-2 h-4 w-4" /> Load static seed ({CODING_PROBLEMS.length})
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <FileJson className="mr-2 h-4 w-4" /> Download template
          </Button>
        </div>
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500">
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-rose-500/15 text-rose-500">
                  {invalidCount} invalid
                </Badge>
              )}
              <Badge variant="outline">{rows.length} total</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {invalidCount > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={downloadReport}>
                    <FileJson className="mr-2 h-4 w-4" /> Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadErrorsCsv}>
                    <FileJson className="mr-2 h-4 w-4" /> Errors CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCorrected}>
                    <FileJson className="mr-2 h-4 w-4" /> Corrected JSON
                  </Button>
                </>
              )}
              <Button onClick={importValid} disabled={busy || validCount === 0}>
                {busy ? "Importing…" : `Import ${validCount} problems`}
              </Button>
            </div>
          </div>

          {invalidCount > 0 && (
            <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
              <p className="font-medium text-rose-500">
                {invalidCount} row{invalidCount === 1 ? "" : "s"} failed validation.
              </p>
              <p className="mt-1 text-muted-foreground">
                Click <strong>Corrected JSON</strong> to download a re-uploadable file
                with safe defaults filled in for missing fields, or <strong>Report</strong>{" "}
                for a structured error log you can share.
              </p>
            </div>
          )}

          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {rows.map((r) => (
              <div
                key={r.index}
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
                    <span className="text-muted-foreground">Row {r.index + 1}</span> —{" "}
                    {r.raw?.slug ?? "(no slug)"} — {r.raw?.title ?? "?"}
                  </p>
                  {r.issues && r.issues.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-rose-500">
                      {r.issues.map((iss, idx) => (
                        <li key={idx}>
                          <code className="rounded bg-rose-500/10 px-1 py-0.5 font-mono">
                            {iss.path}
                          </code>{" "}
                          {iss.message}
                        </li>
                      ))}
                    </ul>
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
