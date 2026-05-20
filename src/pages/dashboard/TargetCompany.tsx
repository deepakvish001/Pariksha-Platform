import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  useTargetCompanies, useCreateTargetCompany, useDeleteTargetCompany,
  usePrepPlan, useGeneratePrepPlan,
} from "@/hooks/useTargetCompany";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Sparkles, Trash2, Loader2, Calendar, BookOpen, CheckCircle2 } from "lucide-react";

const POPULAR = ["Google", "Microsoft", "Amazon", "Meta", "Atlassian", "Stripe", "Zoho", "Razorpay", "Flipkart", "Uber"];
const ROLES = ["SDE-1", "SDE-2", "Frontend Engineer", "Backend Engineer", "Full-stack Engineer", "Data Engineer", "ML Engineer", "DevOps Engineer"];

const TargetCompanyPage = () => {
  const { data: targets = [], isLoading } = useTargetCompanies();
  const create = useCreateTargetCompany();
  const del = useDeleteTargetCompany();

  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("SDE-1");
  const [weeks, setWeeks] = useState(8);
  const [notes, setNotes] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const currentId = activeId ?? targets[0]?.id ?? null;
  const { data: plan } = usePrepPlan(currentId);
  const generate = useGeneratePrepPlan();

  const handleAdd = async () => {
    if (!companyName.trim()) return;
    const t = await create.mutateAsync({
      company_name: companyName.trim(), role, timeline_weeks: weeks, notes,
      is_primary: targets.length === 0,
    });
    setCompanyName(""); setNotes("");
    setActiveId(t.id);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Helmet>
        <title>Target Company & AI Prep Plan | Parikshaa</title>
        <meta name="description" content="Pick a target company and generate a personalized AI prep plan tailored to your readiness." />
      </Helmet>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Target Company & Prep Plan</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick the company you're prepping for. We'll build an AI plan based on your current readiness.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <Card className="p-5 space-y-4 h-fit">
          <h2 className="text-sm font-semibold">Add target</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Company</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Google" />
              <div className="flex flex-wrap gap-1 mt-2">
                {POPULAR.map((c) => (
                  <button key={c} type="button" onClick={() => setCompanyName(c)}
                    className="text-[10px] px-2 py-0.5 rounded-full border hover:border-primary/50 transition">{c}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Timeline (weeks)</Label>
              <Input type="number" min={2} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Optional: weak areas, interview rounds you've heard about, deadlines…" />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={create.isPending || !companyName.trim()}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Add target
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {isLoading && <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>}
          {!isLoading && targets.length === 0 && (
            <Card className="p-8 text-center space-y-2">
              <Target className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No targets yet</p>
              <p className="text-xs text-muted-foreground">Add your first target company on the left to generate an AI plan.</p>
            </Card>
          )}
          {targets.length > 0 && (
            <Tabs value={currentId ?? undefined} onValueChange={setActiveId}>
              <TabsList className="flex flex-wrap h-auto">
                {targets.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} className="gap-2">
                    {t.company_name}
                    <Badge variant="outline" className="text-[9px]">{t.role}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {targets.map((t) => (
                <TabsContent key={t.id} value={t.id} className="space-y-4 mt-4">
                  <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-sm">{t.company_name} · {t.role}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {t.timeline_weeks}-week plan
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => generate.mutate(t.id)} disabled={generate.isPending}>
                        {generate.isPending
                          ? <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          : <Sparkles className="mr-2 h-3 w-3" />}
                        {plan ? "Regenerate plan" : "Generate AI plan"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>

                  {plan?.plan?.summary && (
                    <Card className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Plan overview</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.plan.summary}</p>
                      {Array.isArray(plan.plan.focus_areas) && (
                        <div className="flex flex-wrap gap-1">
                          {plan.plan.focus_areas.map((f: string) => (
                            <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}

                  {Array.isArray(plan?.plan?.weeks) && plan!.plan.weeks.map((w: any) => (
                    <Card key={w.week} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Week {w.week}: {w.theme}</h4>
                      </div>
                      {Array.isArray(w.goals) && w.goals.length > 0 && (
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Goals</p>
                          <ul className="list-none space-y-0.5">
                            {w.goals.map((g: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" /> {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(w.topics) && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {w.topics.map((tp: string) => <Badge key={tp} variant="outline" className="text-[10px]">{tp}</Badge>)}
                        </div>
                      )}
                      {Array.isArray(w.problems) && w.problems.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {w.problems.length} problems
                          </summary>
                          <ul className="mt-1 list-disc pl-5 space-y-0.5">
                            {w.problems.map((p: string, i: number) => <li key={i}>{p}</li>)}
                          </ul>
                        </details>
                      )}
                      {Array.isArray(w.deliverables) && w.deliverables.length > 0 && (
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                          <span className="font-medium text-foreground">Deliverables:</span>{" "}
                          {w.deliverables.join(" · ")}
                        </div>
                      )}
                    </Card>
                  ))}

                  {!plan && (
                    <Card className="p-6 text-center text-sm text-muted-foreground">
                      No plan yet — click <strong>Generate AI plan</strong> to build one.
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
};

export default TargetCompanyPage;
