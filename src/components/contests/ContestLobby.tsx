import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Hourglass, Wifi, BatteryCharging, Monitor, Volume2, AppWindow } from "lucide-react";

interface Props {
  startsAt: string;
  registeredCount: number;
  onChecklistComplete: (ready: boolean) => void;
}

const items = [
  { icon: AppWindow, label: "I have closed all other applications and browser tabs." },
  { icon: Monitor, label: "I am using a single monitor in a quiet, private space." },
  { icon: BatteryCharging, label: "My device is plugged in or fully charged." },
  { icon: Wifi, label: "I have a stable internet connection." },
  { icon: Volume2, label: "Notifications and Do Not Disturb are configured to avoid interruption." },
];

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "Starting now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

export default function ContestLobby({ startsAt, registeredCount, onChecklistComplete }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    onChecklistComplete(checked.every(Boolean));
  }, [checked, onChecklistComplete]);

  const remaining = new Date(startsAt).getTime() - now;

  return (
    <Card className="space-y-5 border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hourglass className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Contest lobby</h2>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-semibold tabular-nums text-primary">
            {formatRemaining(remaining)}
          </div>
          <div className="text-xs text-muted-foreground">until the contest starts</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {registeredCount} participant{registeredCount === 1 ? "" : "s"} registered. Use this time to complete the
        pre-flight checklist below — Secure Mode will not let you start until every box is ticked.
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex items-start gap-3 rounded-md border border-border/50 bg-background/40 p-3">
              <Checkbox
                checked={checked[idx]}
                onCheckedChange={(c) =>
                  setChecked((prev) => prev.map((v, i) => (i === idx ? !!c : v)))
                }
                aria-label={item.label}
              />
              <Icon className="mt-0.5 h-4 w-4 text-primary" />
              <span className="text-sm">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
