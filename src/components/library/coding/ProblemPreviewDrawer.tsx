import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, CircleDot, Circle, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CodingProblem } from "@/data/codingProblemsData";

interface Props {
  open: boolean;
  onClose: () => void;
  problem: CodingProblem | null;
  status: "solved" | "attempted" | "todo";
  bookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  acceptance: number | null;
  attempts: number;
  starterLanguage?: string;
  starterSnippet?: string;
}

const difficultyClass = (d: string) => {
  switch (d) {
    case "Easy":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "Hard":
      return "bg-rose-500/15 text-rose-500 border-rose-500/30";
    default:
      return "";
  }
};

const StatusBadge = ({ status }: { status: Props["status"] }) => {
  if (status === "solved")
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="h-3 w-3" /> Solved
      </Badge>
    );
  if (status === "attempted")
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500">
        <CircleDot className="h-3 w-3" /> Attempted
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Circle className="h-3 w-3" /> Not started
    </Badge>
  );
};

export const ProblemPreviewDrawer = ({
  open,
  onClose,
  problem,
  status,
  bookmarked,
  onToggleBookmark,
  acceptance,
  attempts,
  starterLanguage,
  starterSnippet,
}: Props) => {
  if (!problem) return null;

  // Trim long markdown statements for preview only
  const previewText = (problem.description ?? "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 380);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-xl leading-tight">{problem.title}</SheetTitle>
            <button
              type="button"
              onClick={() => onToggleBookmark(problem.slug)}
              className="p-1 rounded hover:bg-muted/50 transition-colors"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  bookmarked
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/60 hover:text-amber-400",
                )}
              />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs", difficultyClass(problem.difficulty))}>
              {problem.difficulty}
            </Badge>
            <StatusBadge status={status} />
            {problem.topics.slice(0, 4).map((t) => (
              <Badge key={t} variant="secondary" className="bg-muted/50 text-xs">
                {t}
              </Badge>
            ))}
            {problem.topics.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{problem.topics.length - 4}
              </span>
            )}
          </div>
          <SheetDescription className="sr-only">
            Quick preview of {problem.title} including statement, acceptance rate, and starter code.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="rounded-md border border-border/60 bg-muted/30 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Acceptance</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {acceptance !== null ? `${acceptance}%` : "—"}
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/30 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your tries</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{attempts}</div>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/30 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Topics</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{problem.topics.length}</div>
          </div>
        </div>

        <section className="space-y-2 mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            Statement
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {previewText}
            {(problem.description?.length ?? 0) > previewText.length && "…"}
          </p>
        </section>

        {starterSnippet && (
          <section className="space-y-2 mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Starter ({starterLanguage ?? "default"})
            </h3>
            <pre className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed overflow-x-auto max-h-48">
              <code>{starterSnippet}</code>
            </pre>
          </section>
        )}

        <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur">
          <Button asChild className="w-full gap-1.5">
            <Link to={`/library/problems/${problem.slug}`} onClick={onClose}>
              Open full problem
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
