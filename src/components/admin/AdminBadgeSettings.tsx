import { useState } from "react";
import { Settings2, BellOff, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useAdminBadgePrefs, BadgeKey } from "@/hooks/admin/useAdminBadgePrefs";

interface Props {
  onMarkAllRead: () => void;
}

const ITEMS: { key: BadgeKey; label: string }[] = [
 { key: "/admin/reports", label: "Pending reports" },
 { key: "/admin/system-health", label: "System alerts" },
 { key: "/admin/support", label: "Support tickets" },
];

export const AdminBadgeSettings = ({ onMarkAllRead }: Props) => {
  const { prefs, update } = useAdminBadgePrefs();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Badge settings">
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sidebar badges
        </p>

        <div className="space-y-2">
          {ITEMS.map((it) => (
            <div key={it.key} className="flex items-center justify-between">
              <Label htmlFor={`b-${it.key}`} className="text-sm font-normal">
                {it.label}
              </Label>
              <Switch
                id={`b-${it.key}`}
                checked={prefs.enabled[it.key]}
                onCheckedChange={(v) =>
                  update({ enabled: { ...prefs.enabled, [it.key]: v } })
                }
              />
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label className="font-normal">Refresh interval</Label>
            <span className="text-xs text-muted-foreground">{prefs.refreshSeconds}s</span>
          </div>
          <Slider
            min={15}
            max={300}
            step={15}
            value={[prefs.refreshSeconds]}
            onValueChange={([v]) => update({ refreshSeconds: v })}
            aria-label="Refresh interval"
          />
        </div>

        <Separator className="my-3" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onMarkAllRead();
              setOpen(false);
            }}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() =>
              update({
                enabled: {
                  "/admin/reports": false,
                  "/admin/system-health": false,
                  "/admin/support": false,
                },
              })
            }
          >
            <BellOff className="mr-1.5 h-3.5 w-3.5" /> Mute all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
