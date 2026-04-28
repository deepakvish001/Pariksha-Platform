import { Card } from "@/components/ui/card";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { Clock, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

interface Props {
  submissions: CodeSubmissionRow[];
  limit?: number;
  onSelect?: (submission: CodeSubmissionRow) => void;
  highlightedId?: string | null;
}

const formatRelative = (iso: string) => {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const AttemptTimeline = ({ submissions, limit = 10, onSelect, highlightedId }: Props) => {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Attempt timeline
        </h3>
        {submissions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({submissions.length} total)
          </span>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-6 px-3 rounded-md border border-dashed">
          <Inbox className="h-6 w-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium">No submissions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Hit <strong>Submit</strong> to record your first attempt — it'll show up here.
          </p>
        </div>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-3">
          {submissions.slice(0, limit).map((s) => {
            const clickable = !!onSelect;
            const isHighlighted = highlightedId === s.id;
            return (
              <li key={s.id} className="ml-4">
                <span
                  className={cn(
                    "absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                    s.verdict === "Accepted" ? "bg-emerald-500" : "bg-rose-500",
                    isHighlighted && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                />
                <button
                  type="button"
                  onClick={clickable ? () => onSelect?.(s) : undefined}
                  disabled={!clickable}
                  aria-current={isHighlighted ? "true" : undefined}
                  className={cn(
                    "w-full text-left rounded-md -mx-2 px-2 py-1 transition-colors",
                    clickable && "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none cursor-pointer",
                    isHighlighted && "bg-primary/10 ring-1 ring-primary/40 hover:bg-primary/15",
                  )}
                  aria-label={clickable ? `Open submission details for ${s.verdict}` : undefined}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <VerdictBadge verdict={s.verdict} />
                      <span className="text-xs text-muted-foreground">{s.language}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.passed_tests}/{s.total_tests}
                      </span>
                      {isHighlighted && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Last opened
                        </span>
                      )}
                    </div>
                    <time
                      className="text-xs text-muted-foreground"
                      title={new Date(s.created_at).toLocaleString()}
                    >
                      {formatRelative(s.created_at)}
                    </time>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
};
