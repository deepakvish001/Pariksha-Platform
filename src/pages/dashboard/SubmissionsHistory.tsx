import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Code2, ExternalLink } from "lucide-react";

const verdictClass = (v: string) => {
  if (v === "Accepted") return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (v === "Wrong Answer") return "bg-red-500/15 text-red-500 border-red-500/30";
  if (v === "Time Limit Exceeded") return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  if (v === "Compile Error") return "bg-orange-500/15 text-orange-500 border-orange-500/30";
  return "bg-muted text-muted-foreground border-border";
};

export default function SubmissionsHistory() {
  const { user } = useAuth();
  const { submissions, loading: subsLoading } = useCodingSubmissions();
  const { runs, loading: runsLoading } = useCodeRuns();

  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");

  const verdicts = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.verdict))).sort(),
    [submissions],
  );
  const languages = useMemo(
    () => Array.from(new Set([...submissions.map((s) => s.language), ...runs.map((r) => r.language)])).sort(),
    [submissions, runs],
  );

  const filteredSubs = submissions.filter(
    (s) =>
      (verdict === "all" || s.verdict === verdict) &&
      (language === "all" || s.language === language) &&
      (search === "" || s.problem_slug.toLowerCase().includes(search.toLowerCase())),
  );
  const filteredRuns = runs.filter(
    (r) =>
      (language === "all" || r.language === language) &&
      (search === "" || r.problem_slug.toLowerCase().includes(search.toLowerCase())),
  );

  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="p-8 text-center">
          <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-semibold mb-2">Sign in to view your history</h1>
          <p className="text-muted-foreground mb-4">
            Your submissions and runs are private to your account.
          </p>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Submissions & Runs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your full coding history across all problems.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter by problem slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={verdict} onValueChange={setVerdict}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verdicts</SelectItem>
            {verdicts.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({filteredSubs.length})
          </TabsTrigger>
          <TabsTrigger value="runs">
            Runs ({filteredRuns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4 space-y-2">
          {subsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredSubs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No submissions match your filters.</Card>
          ) : (
            filteredSubs.map((s) => (
              <Card key={s.id} className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className={verdictClass(s.verdict)}>
                      {s.verdict}
                    </Badge>
                    <Link
                      to={`/library/problems/${s.problem_slug}`}
                      className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                    >
                      {s.problem_slug} <ExternalLink className="h-3 w-3" />
                    </Link>
                    <span className="text-xs text-muted-foreground">{s.language}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.passed_tests}/{s.total_tests} tests
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {s.runtime_ms !== null && <span>{s.runtime_ms} ms</span>}
                    {s.memory_kb !== null && <span>{(s.memory_kb / 1024).toFixed(1)} MB</span>}
                    <span>{new Date(s.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4 space-y-2">
          {runsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredRuns.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No runs match your filters.</Card>
          ) : (
            filteredRuns.map((r) => (
              <Collapsible key={r.id}>
                <Card className="p-3">
                  <CollapsibleTrigger className="w-full text-left">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-xs">{r.status ?? "Unknown"}</Badge>
                        <Link
                          to={`/library/problems/${r.problem_slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                        >
                          {r.problem_slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <span className="text-xs text-muted-foreground">{r.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {r.time_ms !== null && <span>{r.time_ms} ms</span>}
                        {r.memory_kb !== null && <span>{(r.memory_kb / 1024).toFixed(1)} MB</span>}
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2 text-xs">
                    {r.stdin && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Stdin</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.stdin}</pre>
                      </div>
                    )}
                    {r.stdout && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Stdout</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.stdout}</pre>
                      </div>
                    )}
                    {r.stderr && (
                      <div>
                        <p className="font-semibold text-destructive mb-1">Stderr</p>
                        <pre className="bg-destructive/10 p-2 rounded border border-destructive/30 overflow-x-auto">{r.stderr}</pre>
                      </div>
                    )}
                    {r.compile_output && (
                      <div>
                        <p className="font-semibold text-amber-500 mb-1">Compile output</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.compile_output}</pre>
                      </div>
                    )}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
