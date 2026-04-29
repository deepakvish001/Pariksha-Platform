import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { toast } from "sonner";

export interface RunReferenceResult {
  stdout: string;
  stderr: string;
  ok: boolean;
}

interface Props {
  source: string;
  language: LangId;
  stdin: string;
  onResult: (stdout: string) => void;
  size?: "sm" | "default";
  label?: string;
  /** When provided, also renders a "Save result" button that fires onSavedRun with full output. */
  onSavedRun?: (result: RunReferenceResult & { expected?: string }) => void;
  /** Optional expected value used to compute pass/fail in the saved result. */
  expected?: string;
}

const invokeReference = async (
  source: string,
  language: LangId,
  stdin: string,
): Promise<RunReferenceResult> => {
  const langInfo = LANGUAGES.find((l) => l.id === language);
  const { data, error } = await supabase.functions.invoke("run-code", {
    body: {
      source_code: source,
      language_id: langInfo?.judge0Id ?? 71,
      language,
      stdin,
    },
  });
  if (error) throw error;
  const payload = (data as any)?.data ?? data;
  const stdout = ((payload?.stdout ?? "") as string).toString();
  const stderr = ((payload?.stderr ?? "") as string).toString();
  return { stdout: stdout.trimEnd(), stderr, ok: !stderr || !!stdout };
};

export const RunReferenceButton = ({
  source,
  language,
  stdin,
  onResult,
  size = "sm",
  label = "Run reference",
  onSavedRun,
  expected,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  const guard = () => {
    if (!source?.trim()) {
      toast.error(`Add a ${language} reference solution first`);
      return false;
    }
    return true;
  };

  const run = async () => {
    if (!guard()) return;
    setLoading(true);
    try {
      const res = await invokeReference(source, language, stdin);
      if (res.stderr && !res.stdout) {
        toast.error("Runtime error", { description: res.stderr.slice(0, 200) });
        return;
      }
      onResult(res.stdout);
      toast.success("Filled from reference output");
    } catch (err: any) {
      toast.error("Run failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const runAndSave = async () => {
    if (!guard() || !onSavedRun) return;
    setSavingLoading(true);
    try {
      const res = await invokeReference(source, language, stdin);
      onSavedRun({ ...res, expected });
      if (res.stderr && !res.stdout) {
        toast.error("Saved with runtime error", { description: res.stderr.slice(0, 160) });
      } else {
        toast.success("Saved to run history");
      }
    } catch (err: any) {
      toast.error("Run failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size={size} onClick={run} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        <span className="ml-1.5 text-xs">{label}</span>
      </Button>
      {onSavedRun && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={runAndSave}
          disabled={savingLoading}
          title="Run reference and append the result to run history"
        >
          {savingLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5 text-xs">Save</span>
        </Button>
      )}
    </div>
  );
};
