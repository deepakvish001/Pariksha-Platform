import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Pair = {
  id: string;
  problem_slug: string;
  user_a: string;
  user_b: string;
  similarity: number;
  verdict: "pending" | "clean" | "flag" | "dq" | "waived";
  rationale: string | null;
  created_at: string;
  name_a?: string | null;
  name_b?: string | null;
};

const verdictTone: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  clean: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  flag: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  dq: "bg-red-500/15 text-red-400 border-red-500/30",
  waived: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function SimilarityTab({ contestId }: { contestId: string }) {
  const [running, setRunning] = useState(false);
  const [autoflag, setAutoflag] = useState(0.85);
  const [autodq, setAutodq] = useState(0.95);

  const pairsQuery = useQuery({
    queryKey: ["admin-similarity-pairs", contestId],
    enabled: !!contestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_similarity_pairs")
        .select("id, problem_slug, user_a, user_b, similarity, verdict, rationale, created_at")
        .eq("contest_id", contestId)
        .order("similarity", { ascending: false })
        .limit(300);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).flatMap((p) => [p.user_a, p.user_b])));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nm = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      return (data ?? []).map((p) => ({
        ...p,
        name_a: nm.get(p.user_a) ?? null,
        name_b: nm.get(p.user_b) ?? null,
      })) as Pair[];
    },
  });

  // Realtime new-pair updates
  useEffect(() => {
    const ch = supabase
      .channel(`admin-sim-${contestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contest_similarity_pairs", filter: `contest_id=eq.${contestId}` },
        () => pairsQuery.refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contestId, pairsQuery]);

  const runScan = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("contest-similarity-scan", {
        body: { contest_id: contestId, autoflag_threshold: autoflag, autodq_threshold: autodq },
      });
      if (error) throw error;
      toast.success(
        `Scan complete: ${(data as { pairs?: number }).pairs ?? 0} suspicious pairs · ${(data as { dq_users?: number }).dq_users ?? 0} auto-DQ`,
      );
      pairsQuery.refetch();
    } catch (e) {
      toast.error("Scan failed", { description: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const updateVerdict = async (id: string, verdict: Pair["verdict"]) => {
    const { error } = await supabase
      .from("contest_similarity_pairs")
      .update({ verdict, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Verdict updated"); pairsQuery.refetch(); }
  };

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Auto-flag ≥</label>
          <Input
            type="number" step="0.01" min="0" max="1"
            value={autoflag}
            onChange={(e) => setAutoflag(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
            className="w-24"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Auto-DQ ≥</label>
          <Input
            type="number" step="0.01" min="0" max="1"
            value={autodq}
            onChange={(e) => setAutodq(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
            className="w-24"
          />
        </div>
        <Button onClick={runScan} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Run similarity scan
        </Button>
        <p className="ml-auto max-w-md text-xs text-muted-foreground">
          Hybrid scan: cheap n-gram Jaccard for all accepted submissions, Gemini re-score for pairs ≥ 60%.
          Auto-DQ at {(autodq * 100).toFixed(0)}%, viva-flag at {(autoflag * 100).toFixed(0)}%.
        </p>
      </Card>

      <Card>
        {pairsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (pairsQuery.data ?? []).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No similarity pairs yet. Run a scan after the contest ends.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Similarity</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead>Rationale</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pairsQuery.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-xs">{format(new Date(p.created_at), "PP p")}</TableCell>
                  <TableCell><Badge variant="outline">{p.problem_slug}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <div>{p.name_a ?? p.user_a.slice(0, 8)}</div>
                    <div className="text-muted-foreground">↔ {p.name_b ?? p.user_b.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{(Number(p.similarity) * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={verdictTone[p.verdict] ?? verdictTone.pending} variant="outline">
                      {p.verdict}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs text-muted-foreground" title={p.rationale ?? ""}>
                    {p.rationale ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateVerdict(p.id, "clean")}>Clean</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateVerdict(p.id, "flag")}>Flag</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateVerdict(p.id, "dq")}>DQ</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
