import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { toast } from "sonner";

interface Props {
  source: string;
  language: LangId;
  stdin: string;
  onResult: (stdout: string) => void;
  size?: "sm" | "default";
  label?: string;
}

export const RunReferenceButton = ({
  source,
  language,
  stdin,
  onResult,
  size = "sm",
  label = "Run reference",
}: Props) => {
  const [loading, setLoading] = useState(false);
  const langInfo = LANGUAGES.find((l) => l.id === language);

  const run = async () => {
    if (!source?.trim()) {
      toast.error(`Add a ${language} reference solution first`);
      return;
    }
    setLoading(true);
    try {
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
      const out = (payload?.stdout ?? "").toString();
      const stderr = (payload?.stderr ?? "").toString();
      if (stderr && !out) {
        toast.error("Runtime error", { description: stderr.slice(0, 200) });
        return;
      }
      onResult(out.trimEnd());
      toast.success("Filled from reference output");
    } catch (err: any) {
      toast.error("Run failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size={size} onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
      <span className="ml-1.5 text-xs">{label}</span>
    </Button>
  );
};
