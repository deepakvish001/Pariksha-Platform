import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, History, RotateCcw, AlertTriangle } from "lucide-react";
import { useGamificationRules } from "@/hooks/admin/useAdminEngagement";
import { useGamificationHistory, useSetGamificationRuleWithNote } from "@/hooks/admin/useGamificationHistory";
import { GAMIFICATION_RULES, RULE_BY_KEY, stripPrefix, validateRuleInput, type RuleSpec } from "@/lib/admin/gamificationRules";
import { toast } from "@/hooks/use-toast";

const GamificationRulesPage = () => {
  const { data, isLoading } = useGamificationRules();
  const setRule = useSetGamificationRuleWithNote();

  const [historyKey, setHistoryKey] = useState<string | undefined>(undefined);
  const { data: history = [], isLoading: histLoading } = useGamificationHistory(historyKey, 100);

  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Surface any server-side rule keys we don't recognize (read-only warning)
  const unknownServerKeys = useMemo(
    () => Object.keys(data ?? {}).filter((k) => !RULE_BY_KEY[k]),
    [data]
  );

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      GAMIFICATION_RULES.forEach((f) => {
        next[f.key] = String((data as any)[f.key] ?? f.default);
      });
      setForm(next);
    }
  }, [data]);

  const validate = (key: string): boolean => {
    const res = validateRuleInput(key, form[key] ?? "", notes[key]);
    setErrors((e) => ({ ...e, [key]: res.ok ? "" : (res.error ?? "Invalid input") }));
    return res.ok;
  };

  const save = (spec: RuleSpec) => {
    const res = validateRuleInput(spec.key, form[spec.key] ?? "", notes[spec.key]);
    if (!res.ok || res.value === undefined) {
      setErrors((e) => ({ ...e, [spec.key]: res.error ?? "Invalid input" }));
      toast({ title: "Cannot save", description: res.error, variant: "destructive" });
      return;
    }
    setErrors((e) => ({ ...e, [spec.key]: "" }));
    setRule.mutate(
      { key: spec.key, value: res.value, note: notes[spec.key]?.trim() || undefined },
      { onSuccess: () => setNotes((n) => ({ ...n, [spec.key]: "" })) }
    );
  };

  const renderRuleCard = (spec: RuleSpec) => {
    const err = errors[spec.key];
    const valueRaw = form[spec.key] ?? "";
    const isDirty = String((data as any)?.[spec.key] ?? spec.default) !== valueRaw;

    return (
      <Card key={spec.key} className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Label className="text-sm font-medium">{spec.label}</Label>
            <p className="text-xs text-muted-foreground">{spec.hint}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
              gamification.{spec.key} · {spec.integer ? "integer" : "number"} · range {spec.min}–{spec.max}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => setHistoryKey(`gamification.${spec.key}`)}
          >
            <History className="h-3 w-3 mr-1" /> History
          </Button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
          <Input
            type="number"
            inputMode={spec.integer ? "numeric" : "decimal"}
            step={spec.integer ? 1 : "any"}
            min={spec.min}
            max={spec.max}
            value={valueRaw}
            aria-invalid={!!err}
            onChange={(e) => setForm({ ...form, [spec.key]: e.target.value })}
            onBlur={() => validate(spec.key)}
            className={err ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          <Input
            placeholder="Optional note (max 500 chars) — why are you changing this?"
            value={notes[spec.key] ?? ""}
            maxLength={500}
            onChange={(e) => setNotes({ ...notes, [spec.key]: e.target.value })}
            onBlur={() => validate(spec.key)}
          />
          <Button size="sm" onClick={() => save(spec)} disabled={setRule.isPending || !!err || !isDirty}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
        {err && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3" /> {err}
          </p>
        )}
      </Card>
    );
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Gamification Rules</h1>
        <p className="text-sm text-muted-foreground">
          Edit XP weights, level scaling and caps. Inputs are validated against a strict allow-list before saving;
          unknown keys and out-of-range values are rejected. Every accepted change is recorded with an optional note.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: rules */}
        <div className="grid gap-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              {GAMIFICATION_RULES.map(renderRuleCard)}

              {unknownServerKeys.length > 0 && (
                <Card className="border-yellow-500/40 bg-yellow-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Unrecognized rule keys in database
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These keys exist under <code>gamification.*</code> but aren't in the allow-list. They cannot be
                    edited from this page until added to the schema:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs font-mono text-muted-foreground">
                    {unknownServerKeys.map((k) => <li key={k}>{k}</li>)}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Right column: history */}
        <div>
          <Card className="sticky top-4 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
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
              <p className="py-6 text-center text-xs text-muted-foreground">No changes recorded yet.</p>
            ) : (
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="rounded-md border border-border/50 bg-card/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setHistoryKey(h.rule_key)}
                        className="truncate font-mono text-[11px] hover:underline"
                        title={h.rule_key}
                      >
                        {stripPrefix(h.rule_key)}
                      </button>
                      <span className="shrink-0 text-muted-foreground">{new Date(h.changed_at).toLocaleString()}</span>
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
