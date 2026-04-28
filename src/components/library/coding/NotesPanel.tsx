import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Pencil, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  savedAt: number | null;
}

/**
 * Personal markdown notes per problem, with edit/preview toggle and a
 * lightweight saved indicator. Storage is handled by useProblemNotes.
 */
export const NotesPanel = ({ value, onChange, savedAt }: Props) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const hasContent = value.trim().length > 0;

  const savedLabel = (() => {
    if (!savedAt) return "Not saved yet";
    const diff = Date.now() - savedAt;
    if (diff < 3000) return "Saved";
    if (diff < 60_000) return `Saved ${Math.floor(diff / 1000)}s ago`;
    return `Saved ${Math.floor(diff / 60_000)}m ago`;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
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
            disabled={!hasContent}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {savedAt ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : (
            <Loader2 className="h-3 w-3 opacity-50" />
          )}
          {savedLabel}
        </div>
      </div>

      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            "# My approach\n\n- Brute force: O(n²)\n- Optimised with hashmap → O(n)\n\n```py\n# Pseudocode here\n```"
          }
          className={cn(
            "font-mono text-xs min-h-[280px] resize-y",
            "leading-relaxed",
          )}
        />
      ) : (
        <Card className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[280px]">
          {hasContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground text-sm m-0">
              Nothing to preview yet. Switch to Edit to add notes.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
