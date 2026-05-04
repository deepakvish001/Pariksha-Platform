import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sparkles, RefreshCw, ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface VariantBannerProps {
  variantKey: string;
  title?: string | null;
  statementMd?: string | null;
  weight?: number | null;
  /** Called when the user clicks "Refresh variant". */
  onRefresh?: () => void | Promise<void>;
  /** Show a spinner on the refresh button. */
  refreshing?: boolean;
  /** Timestamp the variant was last (re)assigned, for transparency. */
  assignedAt?: string | null;
}

/**
 * Shown above the standard problem statement when a participant has been
 * assigned a randomized variant. The variant statement (when present)
 * overrides the original problem statement; the inline "Refresh variant"
 * button re-calls assign_contest_variant on demand.
 *
 * Note: assign_contest_variant is deterministic & idempotent — refresh
 * will return the same variant unless an admin has reset the assignment.
 */
export function ContestVariantBanner({
  variantKey,
  title,
  statementMd,
  weight,
  onRefresh,
  refreshing,
  assignedAt,
}: VariantBannerProps) {
  const [open, setOpen] = useState(true);

  return (
    <Card
      data-testid="contest-variant-banner"
      className="mx-3 my-3 border-amber-500/30 bg-amber-500/5"
    >
      <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold">Your assigned variant</span>
        <Badge
          variant="outline"
          className="border-amber-500/40 font-mono text-amber-400"
          data-testid="contest-variant-key"
        >
          {variantKey}
        </Badge>
        {title && (
          <span className="text-sm text-muted-foreground">— {title}</span>
        )}
        {typeof weight === "number" && weight !== 1 && (
          <Badge variant="secondary">×{weight} score</Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {assignedAt && (
            <span className="text-[11px] text-muted-foreground">
              assigned {new Date(assignedAt).toLocaleTimeString()}
            </span>
          )}
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRefresh()}
              disabled={refreshing}
              data-testid="contest-variant-refresh"
            >
              <RefreshCw
                className={`mr-1 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh variant
            </Button>
          )}
        </div>
      </div>

      {statementMd ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2 px-4">
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <FileText className="mr-1 h-3.5 w-3.5" />
                Variant statement
                <ChevronDown
                  className={`ml-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <Badge
              variant="outline"
              className="border-amber-500/30 text-[10px] uppercase tracking-wide text-amber-400"
            >
              Overrides original statement
            </Badge>
          </div>
          <CollapsibleContent>
            <div
              data-testid="contest-variant-statement"
              className="prose prose-invert m-3 mt-2 max-w-none rounded-md border border-amber-500/20 bg-background/40 p-4 text-sm prose-p:my-2 prose-pre:my-2"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {statementMd}
              </ReactMarkdown>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          Use the original problem statement below — only the hidden test seed
          differs for your variant.
        </p>
      )}
    </Card>
  );
}
