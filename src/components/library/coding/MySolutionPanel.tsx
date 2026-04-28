import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Loader2,
  Eye,
  Pencil,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  notes: string;
  onNotesChange: (v: string) => void;
  code: string;
  onCodeChange: (v: string) => void;
  /** Monaco language identifier (e.g. "python", "cpp"). */
  monacoLanguage: string;
  /** Human-readable language name shown in the toolbar (e.g. "Python 3"). */
  languageLabel: string;
  /** Pulls in user's current editor draft so they can save it as their solution. */
  onUseCurrentDraft?: () => string;
  savedAt: number | null;
  fontSize?: number;
}

const formatSavedLabel = (savedAt: number | null) => {
  if (!savedAt) return "Not saved yet";
  const diff = Date.now() - savedAt;
  if (diff < 3000) return "Saved";
  if (diff < 60_000) return `Saved ${Math.floor(diff / 1000)}s ago`;
  return `Saved ${Math.floor(diff / 60_000)}m ago`;
};

/**
 * "My Solution" — combined markdown writeup + per-language final-solution code
 * editor. Autosaves through useProblemSolution.
 */
export const MySolutionPanel = ({
  notes,
  onNotesChange,
  code,
  onCodeChange,
  monacoLanguage,
  languageLabel,
  onUseCurrentDraft,
  savedAt,
  fontSize = 13,
}: Props) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const hasNotes = notes.trim().length > 0;
  const hasCode = code.trim().length > 0;

  const handleCopy = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleUseDraft = () => {
    if (!onUseCurrentDraft) return;
    const draft = onUseCurrentDraft();
    if (!draft.trim()) {
      toast({ title: "Editor is empty", description: "Nothing to save." });
      return;
    }
    onCodeChange(draft);
    toast({
      title: "Saved as your solution",
      description: `Stored your current ${languageLabel} draft.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">My Solution</h3>
          <p className="text-xs text-muted-foreground">
            Your personal writeup + final solution. Autosaved locally.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {savedAt ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : (
            <Loader2 className="h-3 w-3 opacity-50" />
          )}
          {formatSavedLabel(savedAt)}
        </div>
      </div>

      {/* Notes block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Approach & Notes
          </span>
          <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
            <Button
              variant={mode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode("edit")}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant={mode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode("preview")}
              disabled={!hasNotes}
            >
              <Eye className="h-3 w-3" />
              Preview
            </Button>
          </div>
        </div>

        {mode === "edit" ? (
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={
              "# Approach\n\n1. Brute force: O(n²) — iterate every pair.\n2. Optimised: hashmap lookup → O(n).\n\n## Edge cases\n- Empty input\n- Duplicates"
            }
            className={cn(
              "font-mono text-xs min-h-[200px] resize-y leading-relaxed",
            )}
          />
        ) : (
          <Card className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[200px]">
            {hasNotes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground text-sm m-0">
                Nothing to preview yet. Switch to Edit to add notes.
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Code block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Final Solution
            <span className="ml-2 normal-case tracking-normal text-[11px] text-muted-foreground/80">
              ({languageLabel})
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            {onUseCurrentDraft && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={handleUseDraft}
                    >
                      <Code2 className="h-3 w-3" />
                      Use current draft
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Save your current editor code as the solution.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
              disabled={!hasCode}
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden bg-muted/20">
          <div className="h-[260px]">
            <MonacoEditor
              value={code}
              onChange={onCodeChange}
              language={monacoLanguage}
              fontSize={fontSize}
              height="100%"
            />
          </div>
        </div>
        {!hasCode && (
          <p className="text-xs text-muted-foreground">
            Paste or type your accepted solution here, or use{" "}
            <span className="font-medium">Use current draft</span>.
          </p>
        )}
      </div>
    </div>
  );
};
