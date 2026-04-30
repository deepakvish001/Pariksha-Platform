import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, History, Plus, RotateCcw } from "lucide-react";
import { useGamificationRules } from "@/hooks/admin/useAdminEngagement";
import { useGamificationHistory, useSetGamificationRuleWithNote } from "@/hooks/admin/useGamificationHistory";

const FIELDS: { key: string; label: string; hint: string; def: number }[] = [
  { key: "xp_per_quiz_correct", label: "XP per quiz correct answer", hint: "Awarded for each right answer in a quiz", def: 5 },
  { key: "xp_per_problem_easy", label: "XP per easy problem solved", hint: "First-time accept on an easy problem", def: 10 },
  { key: "xp_per_problem_medium", label: "XP per medium problem solved", hint: "First-time accept on a medium problem", def: 25 },
  { key: "xp_per_problem_hard", label: "XP per hard problem solved", hint: "First-time accept on a hard problem", def: 50 },
  { key: "xp_per_srs_review", label: "XP per SRS review", hint: "Awarded for each spaced-repetition review completed", def: 2 },
  { key: "level_xp_multiplier", label: "Level XP multiplier", hint: "XP needed for next level = level × multiplier × 100", def: 1 },
  { key: "daily_xp_cap", label: "Daily XP cap", hint: "Maximum XP a user can earn per day (0 = no cap)", def: 0 },
];

const stripPrefix = (k: string) => k.replace(/^gamification\./, "");

const GamificationRulesPage = () => {
  const { data, isLoading } = useGamificationRules();
  const setRule = useSetGamificationRuleWithNote();

  const [historyKey, setHistoryKey] = useState<string | undefined>(undefined);
  const { data: history = [], isLoading: histLoading } = useGamificationHistory(historyKey, 100);

  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customRows, setCustomRows] = useState<{ key: string; value: string; note: string }[]>([]);

  // Combine known FIELDS with any unknown keys returned by the server (so admins can edit them too).
  const knownKeys = useMemo(() => new Set(FIELDS.map((f) => f.key)), []);
  const extraKeys = useMemo(
    () => Object.keys(data ?? {}).filter((k) => !knownKeys.has(k)),
    [data, knownKeys]
  );

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => { next[f.key] = String((data as any)[f.key] ?? f.def); });
      extraKeys.forEach((k) => { next[k] = String((data as any)[k] ?? ""); });
      setForm(next);
    }
  }, [data, extraKeys]);

  const save = (key: string) => {
    const v = parseFloat(form[key]);
    if (Number.isNaN(v)) return;
    setRule.mutate({ key, value: v, note: notes[key]?.trim() || undefined }, {
      onSuccess: () => setNotes((n) => ({ ...n, [key]: "" })),
    });
  };

  const saveCustom = (idx: number) => {
    const row = customRows[idx];
    if (!row?.key.trim()) return;
    const v = parseFloat(row.value);
    if (Number.isNaN(v)) return;
    setRule.mutate(
      { key: row.key.trim(), value: v, note: row.note.trim() || undefined },
      { onSuccess: () => setCustomRows((rows) => rows.filter((_, i) => i !== idx)) }
    );
  };

  const renderRuleCard = (key: string, label: string, hint: string) => (
    <Card key={key} className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">gamification.{key}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => setHistoryKey(`gamification.${key}`)}
        >
          <History className="h-3 w-3 mr-1" /> History
        </Button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <Input
          type="number"
          value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        <Input
          placeholder="Optional note (why are you changing this?)"
          value={notes[key] ?? ""}
          onChange={(e) => setNotes({ ...notes, [key]: e.target.value })}
        />
        <Button size="sm" onClick={() => save(key)} disabled={setRule.isPending}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </Card>
  );

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gamification Rules</h1>
          <p className="text-sm text-muted-foreground">
            Edit XP weights, level scaling and daily caps. Every change is recorded with an optional note. Stored under{" "}
            <code className="text-xs">gamification.*</code> settings.
          </p>
        </div>
        <Button
          variant={historyKey ? "default" : "outline"}
          size="sm"
          onClick={() => setHistoryKey(historyKey ? undefined : undefined)}
        >
          <History className="h-3.5 w-3.5 mr-1" /> {historyKey ? `Filter: ${stripPrefix(historyKey)}` : "All history"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: rules */}
        <div className="grid gap-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              {FIELDS.map((f) => renderRuleCard(f.key, f.label, f.hint))}

              {extraKeys.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Other rules in database</p>
                  {extraKeys.map((k) => renderRuleCard(k, k, "Custom rule key (not in defaults)"))}
                </div>
              )}

              {/* Add new rule */}
              <Card className="p-4 border-dashed">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Add a new rule key</p>
                  <Button variant="ghost" size="sm" onClick={() =>
                    setCustomRows((r) => [...r, { key: "", value: "", note: "" }])
                  }>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add row
                  </Button>
                </div>
                {customRows.length === 0 && (
                  <p className="text-xs text-muted-foreground">Use this to introduce new gamification settings without a code change.</p>
                )}
                {customRows.map((row, idx) => (
                  <div key={idx} className="mt-2 grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                    <Input
                      placeholder="key (e.g. xp_per_share)"
                      value={row.key}
                      onChange={(e) => setCustomRows((rows) => rows.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))}
                    />
                    <Input
                      type="number"
                      placeholder="value"
                      value={row.value}
                      onChange={(e) => setCustomRows((rows) => rows.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                    />
                    <Input
                      placeholder="note"
                      value={row.note}
                      onChange={(e) => setCustomRows((rows) => rows.map((r, i) => i === idx ? { ...r, note: e.target.value } : r))}
                    />
                    <Button size="sm" onClick={() => saveCustom(idx)} disabled={setRule.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>

        {/* Right column: history */}
        <div>
          <Card className="p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <History className="h-4 w-4" /> Save history
                </h2>
                <p className="text-xs text-muted-foreground">
                  {historyKey ? <>Filtered to <code className="text-[10px]">{historyKey}</code></> : "All gamification rule changes"}
                </p>
              </div>
              {historyKey && (
                <Button variant="ghost" size="sm" onClick={() => setHistoryKey(undefined)} className="text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>

            {histLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No changes recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="rounded-md border border-border/50 bg-card/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setHistoryKey(h.rule_key)}
                        className="font-mono text-[11px] truncate hover:underline"
                        title={h.rule_key}
                      >
                        {stripPrefix(h.rule_key)}
                      </button>
                      <span className="text-muted-foreground shrink-0">{new Date(h.changed_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-muted-foreground">{JSON.stringify(h.old_value ?? null)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{JSON.stringify(h.new_value)}</span>
                    </div>
                    {h.note && <div className="mt-1 italic text-muted-foreground">“{h.note}”</div>}
                    {h.actor_name && <div className="mt-0.5 text-muted-foreground/70">by {h.actor_name}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
};

export default GamificationRulesPage;
