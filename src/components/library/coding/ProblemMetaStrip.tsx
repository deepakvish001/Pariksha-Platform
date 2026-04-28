import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  Clock,
  Target,
  Users,
  FileText,
  Code2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MySolutionSummary {
  hasNotes: boolean;
  hasAnyCode: boolean;
  isComplete: boolean;
  /** Number of languages with a saved code solution. */
  languageCount: number;
}

interface Props {
  acceptance: number | null;
  attempts: number;
  estimatedMinutes: number;
  companies?: string[];
  /** Optional summary of the user's "My Solution" entry for this problem. */
  mySolution?: MySolutionSummary;
  loading?: boolean;
}

/**
 * Compact meta strip displayed at the top of a coding problem detail page.
 * Surfaces personal acceptance %, attempts, an estimated solve time, tagged
 * companies, and an optional "My Solution" progress summary (notes / code /
 * complete with 0–2 progress).
 */
export const ProblemMetaStrip = ({
  acceptance,
  attempts,
  estimatedMinutes,
  companies = [],
  mySolution,
  loading = false,
}: Props) => {
  if (loading) {
    return (
      <Card className="p-3 flex flex-wrap items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-28 rounded-md" />
        ))}
      </Card>
    );
  }

  const Item = ({
    icon: Icon,
    label,
    value,
    tone,
  }: {
    icon: typeof Activity;
    label: string;
    value: string;
    tone?: string;
  }) => (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={cn("h-3.5 w-3.5", tone ?? "text-muted-foreground")} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );

  const renderMySolution = () => {
    if (!mySolution) return null;
    const { hasNotes, hasAnyCode, isComplete, languageCount } = mySolution;
    const step = (hasNotes ? 1 : 0) + (hasAnyCode ? 1 : 0);
    const tone = isComplete
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
      : step === 1
        ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
        : "border-border text-muted-foreground";
    const StatusIcon = isComplete ? Sparkles : CheckCircle2;
    const summary = isComplete
      ? "Complete"
      : step === 1
        ? hasNotes
          ? "Notes only"
          : "Code only"
        : "Empty";

    const tooltip = [
      `${step}/2 progress`,
      hasNotes ? "Notes saved ✓" : "Notes not saved",
      hasAnyCode
        ? `Code saved ✓ (${languageCount} ${languageCount === 1 ? "language" : "languages"})`
        : "No code saved",
    ].join(" · ");

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs rounded-md border px-2 py-0.5 cursor-help",
                tone,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="font-semibold tabular-nums">{step}/2</span>
              <span className="opacity-80">·</span>
              <span className="font-medium">My Solution</span>
              <span className="hidden sm:inline opacity-80">— {summary}</span>
              <span className="flex items-center gap-1 ml-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5",
                    hasNotes ? "" : "opacity-40 line-through",
                  )}
                  aria-label={hasNotes ? "Notes saved" : "Notes not saved"}
                >
                  <FileText className="h-3 w-3" />
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5",
                    hasAnyCode ? "" : "opacity-40 line-through",
                  )}
                  aria-label={hasAnyCode ? "Code saved" : "Code not saved"}
                >
                  <Code2 className="h-3 w-3" />
                  {hasAnyCode && (
                    <span className="tabular-nums text-[10px]">
                      ×{languageCount}
                    </span>
                  )}
                </span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="p-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <Item
        icon={Target}
        label="Your acceptance"
        value={acceptance !== null ? `${acceptance}%` : "—"}
        tone={
          acceptance === null
            ? undefined
            : acceptance >= 70
              ? "text-emerald-500"
              : acceptance >= 40
                ? "text-amber-500"
                : "text-rose-500"
        }
      />
      <Item icon={Activity} label="Attempts" value={String(attempts)} />
      <Item
        icon={Clock}
        label="Est. time"
        value={`${estimatedMinutes} min`}
      />
      {renderMySolution()}
      {companies.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Asked at:</span>
          <div className="flex flex-wrap gap-1">
            {companies.slice(0, 5).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px] font-normal">
                {c}
              </Badge>
            ))}
            {companies.length > 5 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{companies.length - 5}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
