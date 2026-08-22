import { Bell, BellOff } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { useArenaNotificationPrefs } from "../dailyLoop";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Daily challenge reminder opt-in. Persists per-user preference and a
 * reminder hour (UTC). A scheduled job can later read `daily_reminder=true`
 * users and dispatch a notification each day after the new daily is seeded.
 */
export function DailyReminderCard() {
  const { user } = useAuth();
  const { prefs, loading, save } = useArenaNotificationPrefs(user?.id);

  if (!user) return null;

  const enabled = !!prefs?.daily_reminder;
  const hour = prefs?.reminder_hour_utc ?? 14;

  return (
    <GlassPanel className="p-4 space-y-3" data-testid="daily-reminder-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {enabled ? (
            <Bell className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">Daily Challenge Reminder</p>
            <p className="text-[11px] text-muted-foreground">
              Get notified when a fresh daily is published.
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await save({ daily_reminder: !enabled });
            toast.success(!enabled ? "Daily reminders on" : "Daily reminders off");
          }}
          disabled={loading}
          data-testid="daily-reminder-toggle"
          aria-pressed={enabled}
          aria-label="Daily challenge reminder"
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center justify-between text-xs">
          <label className="text-muted-foreground">Reminder hour (UTC)</label>
          <select
            value={hour}
            onChange={(e) => save({ reminder_hour_utc: Number(e.target.value) })}
            className="rounded border border-border bg-card/60 px-2 py-1 text-xs"
            data-testid="daily-reminder-hour"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </select>
        </div>
      )}
    </GlassPanel>
  );
}
