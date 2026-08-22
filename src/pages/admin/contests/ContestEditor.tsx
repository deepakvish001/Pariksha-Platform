import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdminContest, useSaveContest, useAdminContestProblems, useSetContestProblems } from "@/hooks/admin/useAdminContests";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ArrowLeft, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

type Problem = { problem_slug: string; order_index: number; points: number };

const ContestEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { data: existing, isLoading } = useAdminContest(id);
  const { data: existingProblems } = useAdminContestProblems(id);
  const save = useSaveContest();
  const saveProblems = useSetContestProblems();

  const [form, setForm] = useState<any>({
    slug: "", title: "", description: "", rules_md: "",
    banner_url: "", starts_at: "", ends_at: "",
    registration_opens_at: "", registration_closes_at: "",
    status: "draft", visibility: "public", invite_code: "",
    max_participants: null, scoring_mode: "icpc", penalty_minutes: 10,
    enforcement_mode: "hard",
  });
  const [problems, setProblems] = useState<Problem[]>([]);
  const [allProblems, setAllProblems] = useState<{ slug: string; title: string; is_published: boolean }[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        ...existing,
        starts_at: toLocal(existing.starts_at),
        ends_at: toLocal(existing.ends_at),
        registration_opens_at: existing.registration_opens_at ? toLocal(existing.registration_opens_at) : "",
        registration_closes_at: existing.registration_closes_at ? toLocal(existing.registration_closes_at) : "",
      });
    }
  }, [existing]);

  useEffect(() => {
    if (!existingProblems) return;
    setProblems(existingProblems.map((p) => ({ problem_slug: p.problem_slug, order_index: p.order_index, points: p.points })));
  }, [existingProblems]);

  useEffect(() => {
    supabase.from("coding_problems").select("slug, title, is_published").order("title").limit(500)
      .then(({ data }) => setAllProblems((data ?? []) as any));
  }, []);

  const onSave = async () => {
    const payload: any = {
      ...form,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      registration_opens_at: form.registration_opens_at ? new Date(form.registration_opens_at).toISOString() : null,
      registration_closes_at: form.registration_closes_at ? new Date(form.registration_closes_at).toISOString() : null,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      penalty_minutes: Number(form.penalty_minutes),
    };
    if (id) payload.id = id;
    const saved = await save.mutateAsync(payload);
    if (saved) {
      await saveProblems.mutateAsync({
        contestId: saved.id,
        problems: problems.map((p, i) => ({ ...p, order_index: i })),
      });
      navigate(`/admin/contests/${saved.id}/edit`);
    }
  };

  const addProblem = (slug: string) => {
    if (problems.some((p) => p.problem_slug === slug)) return;
    setProblems([...problems, { problem_slug: slug, order_index: problems.length, points: 100 }]);
  };

  if (!isNew && isLoading) return <Skeleton className="m-6 h-96" />;

  const filteredProblems = allProblems.filter((p) =>
    !problems.some((q) => q.problem_slug === p.slug) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AdminShell>
      <Helmet><title>{isNew ? "New Contest" : "Edit Contest"} | Admin</title></Helmet>
      <div className="space-y-6 p-6">
        <button onClick={() => navigate("/admin/contests")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All contests
        </button>
        <h1 className="text-2xl font-bold">{isNew ? "New Contest" : `Edit: ${form.title}`}</h1>

        <Card className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Slug (URL)">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="weekly-challenge-1" />
            </Field>
          </div>
          <Field label="Short description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starts at">
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </Field>
            <Field label="Ends at">
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </Field>
            <Field label="Registration opens (optional)">
              <Input type="datetime-local" value={form.registration_opens_at} onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })} />
            </Field>
            <Field label="Registration closes (optional)">
              <Input type="datetime-local" value={form.registration_closes_at} onChange={(e) => setForm({ ...form, registration_closes_at: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "published", "live", "ended", "archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Visibility">
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["public", "unlisted", "private"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Scoring">
              <Select value={form.scoring_mode} onValueChange={(v) => setForm({ ...form, scoring_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["icpc", "ioi", "points"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Penalty minutes (per wrong)">
              <Input type="number" value={form.penalty_minutes} onChange={(e) => setForm({ ...form, penalty_minutes: e.target.value })} />
            </Field>
            <Field label="Max participants (optional)">
              <Input type="number" value={form.max_participants ?? ""} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
            </Field>
            {form.visibility === "private" && (
              <Field label="Invite code">
                <Input value={form.invite_code ?? ""} onChange={(e) => setForm({ ...form, invite_code: e.target.value })} />
              </Field>
            )}
          </div>
          <Field label="Anti-cheat profile">
            <Select
              value={form.enforcement_mode ?? "hard"}
              onValueChange={(v) => setForm({ ...form, enforcement_mode: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open — log only, no enforcement</SelectItem>
                <SelectItem value="standard">Standard — log + warn, manual review</SelectItem>
                <SelectItem value="hard">Hard — auto-terminate on any critical violation (recommended)</SelectItem>
                <SelectItem value="custom">Custom — managed via admin tools</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Banner URL (optional)">
            <Input value={form.banner_url ?? ""} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} />
          </Field>
          <Field label="Rules (Markdown)">
            <Textarea rows={6} value={form.rules_md} onChange={(e) => setForm({ ...form, rules_md: e.target.value })} />
          </Field>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold">Problems</h2>
          {problems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No problems added yet.</p>
          ) : (
            <div className="space-y-1">
              {problems.map((p, i) => {
                const move = (dir: -1 | 1) => {
                  const j = i + dir;
                  if (j < 0 || j >= problems.length) return;
                  const next = [...problems];
                  [next[i], next[j]] = [next[j], next[i]];
                  setProblems(next.map((q, k) => ({ ...q, order_index: k })));
                };
                return (
                  <div
                    key={p.problem_slug}
                    data-testid={`contest-problem-row-${p.problem_slug}`}
                    className="flex items-center gap-2 rounded border border-white/10 bg-card/40 p-2"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1 text-sm">{p.problem_slug}</span>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Move up"
                        aria-label={`Move ${p.problem_slug} up`}
                        data-testid={`move-up-${p.problem_slug}`}
                        disabled={i === 0}
                        onClick={() => move(-1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Move down"
                        aria-label={`Move ${p.problem_slug} down`}
                        data-testid={`move-down-${p.problem_slug}`}
                        disabled={i === problems.length - 1}
                        onClick={() => move(1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input type="number" value={p.points} onChange={(e) => {
                      const next = [...problems]; next[i] = { ...p, points: Number(e.target.value) }; setProblems(next);
                    }} className="w-20" />
                    <Button size="icon" variant="ghost" aria-label={`Remove ${p.problem_slug}`} onClick={() => setProblems(problems.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Input placeholder="Search problems to add..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Private problems remain hidden from the library but become visible to registered contestants while this contest is live.
            </p>
            {search && (
              <Card className="max-h-60 overflow-y-auto p-2">
                {filteredProblems.slice(0, 20).map((p) => (
                  <button key={p.slug} onClick={() => { addProblem(p.slug); setSearch(""); }}
                          className="flex w-full items-center gap-2 rounded p-2 text-left text-sm hover:bg-muted/50">
                    <Plus className="h-3 w-3" />
                    <span className="font-mono text-xs">{p.slug}</span>
                    <span className="flex-1 truncate">— {p.title}</span>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                      p.is_published
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    }`}>
                      {p.is_published ? "Public" : "Private"}
                    </span>
                  </button>
                ))}
                {filteredProblems.length === 0 && <p className="p-2 text-sm text-muted-foreground">No matches.</p>}
              </Card>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/contests")}>Cancel</Button>
          <Button onClick={onSave} disabled={save.isPending || saveProblems.isPending}>
            {save.isPending ? "Saving..." : "Save Contest"}
          </Button>
        </div>
      </div>
    </AdminShell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const toLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default ContestEditor;
