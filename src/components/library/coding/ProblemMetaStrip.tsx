import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  acceptance: number | null;
  attempts: number;
  estimatedMinutes: number;
  companies?: string[];
  loading?: boolean;
}

/**
 * Compact meta strip displayed at the top of a coding problem detail page.
 * Surfaces personal acceptance %, attempts, an estimated solve time, and
 * tagged companies so the user has signal at a glance.
 */
export const ProblemMetaStrip = ({
  acceptance,
  attempts,
  estimatedMinutes,
  companies = [],
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
