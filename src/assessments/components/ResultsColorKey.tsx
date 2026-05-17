import { CheckCircle2, AlertTriangle, XCircle, Clock, MinusCircle } from "lucide-react";

interface KeyItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  dotClass: string;
}

const ITEMS: KeyItem[] = [
  {
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
    label: "Correct",
    description: "Full marks awarded for this question.",
    dotClass: "bg-emerald-500",
  },
  {
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
    label: "Partial",
    description: "Some credit awarded — answer was close but not fully correct.",
    dotClass: "bg-amber-500",
  },
  {
    icon: <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
    label: "Incorrect",
    description: "Answer didn't match the expected solution.",
    dotClass: "bg-rose-500",
  },
  {
    icon: <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />,
    label: "Pending",
    description: "Awaiting recruiter or manual grading.",
    dotClass: "bg-sky-500",
  },
  {
    icon: <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    label: "Unanswered",
    description: "No answer was submitted for this question.",
    dotClass: "bg-muted-foreground",
  },
];

export function ResultsColorKey() {
  return (
    <div className="rounded-md border border-border bg-card/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Color key
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {ITEMS.map((it) => (
          <li
            key={it.label}
            className="flex items-start gap-2 rounded border border-border bg-background/60 px-2.5 py-1.5"
          >
            <span className="shrink-0 mt-0.5">{it.icon}</span>
            <div className="min-w-0">
              <div className="text-xs font-medium leading-tight">{it.label}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {it.description}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
