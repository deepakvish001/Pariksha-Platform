import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import {
  useGamificationRules, useSetGamificationRule, type GamificationRules,
} from "@/hooks/admin/useAdminEngagement";

const FIELDS: { key: keyof GamificationRules; label: string; hint: string; def: number }[] = [
  { key: "xp_per_quiz_correct", label: "XP per quiz correct answer", hint: "Awarded for each right answer in a quiz", def: 5 },
  { key: "xp_per_problem_easy", label: "XP per easy problem solved", hint: "First-time accept on an easy problem", def: 10 },
  { key: "xp_per_problem_medium", label: "XP per medium problem solved", hint: "First-time accept on a medium problem", def: 25 },
  { key: "xp_per_problem_hard", label: "XP per hard problem solved", hint: "First-time accept on a hard problem", def: 50 },
  { key: "xp_per_srs_review", label: "XP per SRS review", hint: "Awarded for each spaced-repetition review completed", def: 2 },
  { key: "level_xp_multiplier", label: "Level XP multiplier", hint: "XP needed for next level = level × multiplier × 100", def: 1 },
  { key: "daily_xp_cap", label: "Daily XP cap", hint: "Maximum XP a user can earn per day (0 = no cap)", def: 0 },
];

const GamificationRulesPage = () => {
  const { data, isLoading } = useGamificationRules();
  const setRule = useSetGamificationRule();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => {
        next[f.key] = String(data[f.key] ?? f.def);
      });
      setForm(next);
    }
  }, [data]);

  const save = (key: keyof GamificationRules) => {
    const v = parseFloat(form[key]);
    if (Number.isNaN(v)) return;
    setRule.mutate({ key, value: v });
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Gamification Rules</h1>
        <p className="text-sm text-muted-foreground">XP weights, level scaling and daily caps. Stored under <code className="text-xs">gamification.*</code> settings.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-3 max-w-2xl">
          {FIELDS.map((f) => (
            <Card key={f.key} className="p-4">
              <Label className="text-sm font-medium">{f.label}</Label>
              <p className="text-xs text-muted-foreground mb-2">{f.hint}</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="max-w-[180px]"
                />
                <Button size="sm" onClick={() => save(f.key)} disabled={setRule.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
};

export default GamificationRulesPage;
