import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings, useSetSetting } from "@/hooks/admin/useAdminControl";
import { useFlagRegistry, useUpsertFlagRegistry } from "@/hooks/admin/useAdminCoverage";
import { Settings as SettingsIcon, Plus, FlaskConical } from "lucide-react";

const KNOWN_FLAGS: { key: string; label: string; description: string }[] = [
  { key: "maintenance_mode", label: "Maintenance mode", description: "Show a maintenance banner site-wide." },
  { key: "signup_open", label: "Signups open", description: "Allow new users to register." },
  { key: "daily_challenge_enabled", label: "Daily challenge enabled", description: "Show the daily challenge UI." },
  { key: "ai_generate_enabled", label: "AI generation enabled", description: "Allow users to generate AI content." },
];

const SettingsAndFlags = () => {
  const { data: settings = [] } = usePlatformSettings();
  const setSetting = useSetSetting();

  const get = (k: string) => (settings as any[]).find((s) => s.key === k)?.value;

  // Custom KV
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("{}");

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><SettingsIcon className="h-5 w-5" /> Settings & Feature Flags</h1>
      <p className="mb-4 text-sm text-muted-foreground">Toggle platform-wide behavior without redeploying.</p>

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Feature flags</h2>
        {KNOWN_FLAGS.map((f) => {
          const enabled = !!get(f.key)?.enabled;
          return (
            <div key={f.key} className="flex items-center justify-between gap-3 border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div>
                <Label>{f.label}</Label>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => setSetting.mutate({ key: f.key, value: { enabled: v } })}
              />
            </div>
          );
        })}
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">Landing banner</h2>
        <BannerEditor
          initial={get("landing_banner")?.text ?? ""}
          onSave={(text) => setSetting.mutate({ key: "landing_banner", value: { text } })}
        />
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">Custom key/value</h2>
        <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
          <Input placeholder="key" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
          <Input placeholder='{"foo":"bar"}' value={customValue} onChange={(e) => setCustomValue(e.target.value)} />
          <Button onClick={() => {
            try {
              const v = JSON.parse(customValue);
              if (customKey) setSetting.mutate({ key: customKey, value: v });
            } catch { alert("Invalid JSON"); }
          }}><Plus className="mr-1 h-4 w-4" /> Save</Button>
        </div>
        <div className="mt-3 max-h-64 overflow-auto rounded-md border border-border/40 p-2 text-xs">
          <pre>{JSON.stringify(settings, null, 2)}</pre>
        </div>
      </Card>
    </AdminShell>
  );
};

const BannerEditor = ({ initial, onSave }: { initial: string; onSave: (text: string) => void }) => {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <div className="flex flex-col gap-2">
      <Textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} placeholder="Optional announcement text…" />
      <div><Button size="sm" onClick={() => onSave(v)}>Save banner</Button></div>
    </div>
  );
};

export default SettingsAndFlags;
