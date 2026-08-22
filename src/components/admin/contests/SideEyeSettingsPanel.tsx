import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
const KINDS = [
  "secondary_device",
  "extra_person",
  "candidate_absent",
  "earpiece_visible",
  "looking_down_at_notes",
] as const;

interface Settings {
  id?: string;
  min_severity: (typeof SEVERITIES)[number];
  escalate_kinds: string[];
  recipient_user_ids: string[];
  notify_all_admins: boolean;
  retention_days_audit: number;
  retention_days_frames: number;
  retention_days_recordings: number;
}

const DEFAULTS: Settings = {
  min_severity: "medium",
  escalate_kinds: ["secondary_device", "candidate_absent"],
  recipient_user_ids: [],
  notify_all_admins: true,
  retention_days_audit: 30,
  retention_days_frames: 30,
  retention_days_recordings: 30,
};

export const SideEyeSettingsPanel = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [recipientsText, setRecipientsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sideeye_notification_settings")
        .select("id, min_severity, escalate_kinds, recipient_user_ids, notify_all_admins, retention_days_audit, retention_days_frames, retention_days_recordings")
        .eq("singleton", true)
        .maybeSingle();
      if (data) {
        const s = data as any as Settings;
        setSettings(s);
        setRecipientsText((s.recipient_user_ids ?? []).join("\n"));
      }
      setLoading(false);
    })();
  }, []);

  const toggleKind = (k: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      escalate_kinds: checked
        ? Array.from(new Set([...prev.escalate_kinds, k]))
        : prev.escalate_kinds.filter((x) => x !== k),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const ids = recipientsText
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter(Boolean);

      // Validate UUID-ish format (rough)
      const bad = ids.find((id) => !/^[0-9a-f-]{36}$/i.test(id));
      if (bad) {
        toast.error("Invalid recipient ID", { description: bad });
        setSaving(false);
        return;
      }

      const payload = {
        singleton: true,
        min_severity: settings.min_severity,
        escalate_kinds: settings.escalate_kinds,
        recipient_user_ids: ids,
        notify_all_admins: settings.notify_all_admins,
        retention_days_audit: settings.retention_days_audit,
        retention_days_frames: settings.retention_days_frames,
        retention_days_recordings: settings.retention_days_recordings,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("sideeye_notification_settings")
        .upsert(payload, { onConflict: "singleton" });

      if (error) throw error;
      toast.success("SideEye settings saved");
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const runPurge = async () => {
    if (!confirm("Run purge now? This permanently deletes SideEye data older than the configured retention windows.")) return;
    setPurging(true);
    try {
      const { data, error } = await supabase.rpc("admin_run_sideeye_purge");
      if (error) throw error;
      const r = (data ?? {}) as Record<string, number>;
      toast.success("Purge complete", {
        description: `Audit: ${r.deleted_audit ?? 0} • Frames: ${r.deleted_frames ?? 0} • Recordings: ${r.deleted_recordings ?? 0}`,
      });
    } catch (e: any) {
      toast.error("Purge failed", { description: e?.message });
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> 
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">SideEye notification settings</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Minimum severity to notify</Label>
        <Select
          value={settings.min_severity}
          onValueChange={(v) =>
            setSettings((p) => ({ ...p, min_severity: v as Settings["min_severity"] }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Frames below this severity are logged but do not trigger notifications.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Auto-escalate anomaly kinds</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {KINDS.map((k) => (
            <label key={k} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={settings.escalate_kinds.includes(k)}
                onCheckedChange={(v) => toggleKind(k, !!v)}
              />
              <span className="capitalize">{k.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          When detected, these kinds are bumped to “flag” severity even on a low-severity frame.
        </p>
      </div>

      <div className="flex items-center justify-between rounded border border-border/40 px-3 py-2">
        <div>
          <Label htmlFor="notify-all-admins" className="text-xs">Notify all admins</Label>
          <p className="text-[11px] text-muted-foreground">
            Off = only the recipient list below receives notifications.
          </p>
        </div>
        <Switch
          id="notify-all-admins"
          checked={settings.notify_all_admins}
          onCheckedChange={(v) => setSettings((p) => ({ ...p, notify_all_admins: v }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sideeye-recipients" className="text-xs">Recipient user IDs (one per line)</Label>
        <Textarea
          id="sideeye-recipients"
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          rows={4}
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          Used when “Notify all admins” is off, or as extra recipients in addition to the trigger.
        </p>
      </div>

      <div className="space-y-2 rounded border border-border/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Retention policy (days)</Label>
          <Button size="sm" variant="outline" onClick={runPurge} disabled={purging} className="h-7 text-xs">
            {purging ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
            Run purge now
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            ["retention_days_audit", "Audit logs"],
            ["retention_days_frames", "Frame events"],
            ["retention_days_recordings", "Recordings"],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`sideeye-retention-${key}`} className="text-[11px] text-muted-foreground">{label}</Label>
              <Input
                id={`sideeye-retention-${key}`}
                type="number"
                min={1}
                max={365}
                value={settings[key]}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    [key]: Math.max(1, Math.min(365, parseInt(e.target.value || "30", 10))),
                  }))
                }
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          A daily background job purges any SideEye data older than these windows. Storage objects are removed alongside DB rows.
        </p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
          Save settings
        </Button>
      </div>
    </Card>
  );
};

export default SideEyeSettingsPanel;
