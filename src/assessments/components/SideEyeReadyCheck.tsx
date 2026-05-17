import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, BellOff, Smartphone, ShieldCheck } from "lucide-react";

interface Props {
  onReady: () => void;
  buttonLabel?: string;
}

/**
 * Mobile-side pre-stream checklist shown before the phone becomes a
 * side / third-eye camera. Mirrors the SRM exam manual guidance:
 * Auto-rotate on, Do Not Disturb on, phone propped at desk height.
 * Pure UI — no backend writes.
 */
export function SideEyeReadyCheck({ onReady, buttonLabel = "I'm ready" }: Props) {
  const [rotate, setRotate] = useState(false);
  const [dnd, setDnd] = useState(false);
  const [placed, setPlaced] = useState(false);
  const allChecked = rotate && dnd && placed;

  const items: { id: "rotate" | "dnd" | "placed"; icon: typeof RotateCw; title: string; hint: string; checked: boolean; onCheck: (v: boolean) => void }[] = [
    {
      id: "rotate",
      icon: RotateCw,
      title: "Auto-rotate is ON",
      hint: "So the phone stays landscape when you lay it on its side.",
      checked: rotate,
      onCheck: setRotate,
    },
    {
      id: "dnd",
      icon: BellOff,
      title: "Do Not Disturb is ON",
      hint: "Notifications and calls won't pause or hide the stream.",
      checked: dnd,
      onCheck: setDnd,
    },
    {
      id: "placed",
      icon: Smartphone,
      title: "Phone is propped at desk height",
      hint: "1–2 m to your side, rear camera facing you and your desk.",
      checked: placed,
      onCheck: setPlaced,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <p className="text-muted-foreground">
          Before placing your phone as the side camera, confirm the three settings below.
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.id}>
              <label
                htmlFor={`sec-${it.id}`}
                className="flex items-start gap-3 rounded-md border bg-card/60 px-3 py-2.5 cursor-pointer hover:bg-card/80 transition-colors"
              >
                <Checkbox
                  id={`sec-${it.id}`}
                  checked={it.checked}
                  onCheckedChange={(v) => it.onCheck(v === true)}
                  className="mt-0.5"
                />
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{it.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{it.hint}</div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
      <Button className="w-full" disabled={!allChecked} onClick={onReady}>
        {buttonLabel}
      </Button>
    </div>
  );
}
