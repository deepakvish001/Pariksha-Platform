import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

interface Props {
  submission: CodeSubmissionRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const copy = async (label: string, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`);
  }
};

export const SubmissionDetailsDrawer = ({ submission, open, onOpenChange }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Submission details</SheetTitle>
        </SheetHeader>

        {!submission ? (
          <div className="py-12 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Submission not found.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <VerdictBadge verdict={submission.verdict} />
              <Badge variant="outline">{submission.language}</Badge>
              <Badge variant="secondary">
                {submission.passed_tests}/{submission.total_tests} tests
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Runtime</p>
                <p className="font-mono">
                  {submission.runtime_ms !== null ? `${submission.runtime_ms} ms` : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Memory</p>
                <p className="font-mono">
                  {submission.memory_kb !== null
                    ? `${(submission.memory_kb / 1024).toFixed(1)} MB`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2 col-span-2">
                <p className="text-muted-foreground">Submitted</p>
                <p>{new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source code
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => copy("Source", submission.source_code)}
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto max-h-72">
                <code>{submission.source_code}</code>
              </pre>
            </div>

            {submission.failing_case && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Failing case
                </p>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(submission.failing_case, null, 2)}
                </pre>
              </div>
            )}

            {submission.stderr && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    Stderr
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => copy("Stderr", submission.stderr ?? "")}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {submission.stderr}
                </pre>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
