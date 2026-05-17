import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  AlertTriangle,
  Eye,
  Users,
  Wifi,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
}

function getTier(score: number): {
  label: string;
  tone: string;
  ring: string;
  icon: React.ReactNode;
  blurb: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent",
      tone: "text-emerald-600 dark:text-emerald-400",
      ring: "border-emerald-500/30 bg-emerald-500/5",
      icon: <ShieldCheck className="h-4 w-4" />,
      blurb: "Clean attempt with little to no flagged activity.",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      tone: "text-amber-600 dark:text-amber-400",
      ring: "border-amber-500/30 bg-amber-500/5",
      icon: <ShieldAlert className="h-4 w-4" />,
      blurb: "Some minor signals were captured but nothing critical.",
    };
  }
  return {
    label: "Needs review",
    tone: "text-rose-600 dark:text-rose-400",
    ring: "border-rose-500/30 bg-rose-500/5",
    icon: <ShieldX className="h-4 w-4" />,
    blurb: "Multiple integrity signals were flagged. Recruiter may review manually.",
  };
}

const FACTORS: { icon: React.ReactNode; title: string; detail: string }[] = [
  {
    icon: <Eye className="h-3.5 w-3.5" />,
    title: "Tab switching & focus loss",
    detail:
      "Leaving the test tab, opening a new window, or switching apps lowers your score.",
  },
  {
    icon: <Users className="h-3.5 w-3.5" />,
    title: "Webcam & face checks",
    detail:
      "Multiple faces detected, no face visible, or looking away for long periods are flagged.",
  },
  {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    title: "Copy, paste & shortcut usage",
    detail:
      "Pasting external content, right-click, or restricted shortcuts are recorded as events.",
  },
  {
    icon: <Wifi className="h-3.5 w-3.5" />,
    title: "Connection & device changes",
    detail:
      "Network drops, fullscreen exits, or switching audio/video devices mid-attempt count too.",
  },
];

const TIPS: string[] = [
  "Take the test in a quiet, well-lit room with a single visible face on camera.",
  "Stay in fullscreen and avoid switching tabs, windows, or applications.",
  "Don't copy answers from outside sources — type them in directly.",
  "Use a stable internet connection and keep your laptop plugged in.",
  "Close chat apps, notifications, and other camera/mic-using software beforehand.",
];

export function IntegrityExplanation({ score }: Props) {
  const tier = getTier(score);
  const [open, setOpen] = useState(false);
  const rounded = Math.round(score);

  return (
    <div className={cn("rounded-md border", tier.ring)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div
          className={cn(
            "h-8 w-8 rounded-md grid place-items-center shrink-0",
            "bg-card/80 border border-border",
            tier.tone,
          )}
        >
          {tier.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Integrity score</span>
            <span className={cn("text-sm font-bold tabular-nums", tier.tone)}>
              {rounded}%
            </span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded",
                "bg-card/80 border border-border",
                tier.tone,
              )}
            >
              {tier.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {tier.blurb}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/60">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              What can affect your integrity %
            </div>
            <ul className="grid sm:grid-cols-2 gap-1.5">
              {FACTORS.map((f) => (
                <li
                  key={f.title}
                  className="flex items-start gap-2 rounded-md border border-border bg-card/60 px-2.5 py-2"
                >
                  <span className="h-5 w-5 rounded bg-muted/60 grid place-items-center text-muted-foreground shrink-0 mt-0.5">
                    {f.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{f.title}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {f.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3" /> How to improve next time
            </div>
            <ul className="space-y-1">
              {TIPS.map((t) => (
                <li
                  key={t}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            Integrity is a signal, not a verdict — recruiters review flagged attempts manually
            before making decisions.
          </p>
        </div>
      )}
    </div>
  );
}
