import { Card } from "@/components/ui/card";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { Clock } from "lucide-react";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

interface Props {
  submissions: CodeSubmissionRow[];
  limit?: number;
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

export const AttemptTimeline = ({ submissions, limit = 10 }: Props) => {
  if (submissions.length === 0) return null;
  const items = submissions.slice(0, limit);
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Attempt timeline
        </h3>
        <span className="text-xs text-muted-foreground">
          ({submissions.length} total)
        </span>
      </div>
      <ol className="relative border-l border-border ml-2 space-y-3">
        {items.map((s) => (
          <li key={s.id} className="ml-4">
            <span
              className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                s.verdict === "Accepted" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <VerdictBadge verdict={s.verdict} />
                <span className="text-xs text-muted-foreground">{s.language}</span>
                <span className="text-xs text-muted-foreground">
                  {s.passed_tests}/{s.total_tests}
                </span>
              </div>
              <time
                className="text-xs text-muted-foreground"
                title={new Date(s.created_at).toLocaleString()}
              >
                {formatRelative(s.created_at)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
};
