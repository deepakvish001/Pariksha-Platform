import { CheckCircle2, FileText, History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuestionStatusHistory } from "../../hooks/useQuestionStatusHistory";

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function StatusHistoryPanel({ questionId }: { questionId?: string }) {
  const { data, isLoading, error } = useQuestionStatusHistory(questionId);

  if (!questionId) {
    return (
      <div className="rounded-md border border-dashed p-4 text-xs text-[hsl(var(--muted-foreground))]">
        <History className="inline h-3.5 w-3.5 mr-1" />
        History appears after the question is saved for the first time.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] p-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
        Could not load history: {(error as Error).message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-xs text-[hsl(var(--muted-foreground))]">
        No history entries yet.
      </div>
    );
  }

  return (
    <ol className="relative border-l pl-4 space-y-3">
      {data.map((row) => {
        const isPub = row.status === "published";
        const Icon = isPub ? CheckCircle2 : FileText;
        return (
          <li key={row.id} className="relative">
            <span
              className={`absolute -left-[22px] top-1 grid h-4 w-4 place-items-center rounded-full border ${
                isPub
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <Icon className="h-2.5 w-2.5" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isPub ? "default" : "outline"}
                className="text-[10px] uppercase tracking-wide"
              >
                {isPub ? "Published" : "Draft saved"}
              </Badge>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatWhen(row.changed_at)}
              </span>
              {row.note && (
                <span className="text-[10px] italic text-[hsl(var(--muted-foreground))]">
                  ({row.note})
                </span>
              )}
            </div>
            {row.changed_by && (
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                by {row.changed_by.slice(0, 8)}…
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
