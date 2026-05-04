import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface VariantBannerProps {
  variantKey: string;
  title?: string | null;
  statementMd?: string | null;
  weight?: number | null;
}

/**
 * Shown above the standard problem statement when a participant has been
 * assigned a randomized variant. If `statement_md` is set, it overrides
 * the original problem statement; otherwise it's just a label so the user
 * sees which variant they're on.
 */
export function ContestVariantBanner({ variantKey, title, statementMd, weight }: VariantBannerProps) {
  return (
    <Card className="mx-3 my-3 border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span className="font-semibold">Your assigned variant:</span>
        <Badge variant="outline" className="border-amber-500/40 text-amber-400">
          {variantKey}
        </Badge>
        {title && <span className="text-muted-foreground">— {title}</span>}
        {typeof weight === "number" && weight !== 1 && (
          <Badge variant="secondary" className="ml-auto">×{weight} score</Badge>
        )}
      </div>
      {statementMd && (
        <div className="mt-3 prose prose-invert max-w-none text-sm prose-p:my-2 prose-pre:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{statementMd}</ReactMarkdown>
        </div>
      )}
      {!statementMd && (
        <p className="mt-2 text-xs text-muted-foreground">
          Use the original problem statement below — only the hidden test seed differs for your variant.
        </p>
      )}
    </Card>
  );
}
