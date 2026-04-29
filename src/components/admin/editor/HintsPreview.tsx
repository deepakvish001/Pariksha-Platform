import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Lightbulb, Pilcrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Props {
  hints: string[];
}

/** Replaces invisible whitespace with visible glyphs so admins can see exactly
 *  what the learner-facing renderer will preserve. */
const visualizeWhitespace = (s: string): string =>
  s
    // trailing spaces on a line
    .replace(/[ \t]+$/gm, (m) => "·".repeat(m.length))
    // tabs anywhere
    .replace(/\t/g, "→   ")
    // mark blank lines with a pilcrow so they're not invisible
    .replace(/^\s*$/gm, "¶");

/** Live preview of how each hint will render to learners.
 *  Mirrors the on-page hint reveal: hidden by default, click to reveal. */
export const HintsPreview = ({ hints }: Props) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showWhitespace, setShowWhitespace] = useState(false);

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const real = hints.filter((h) => h.trim().length > 0);

  return (
    <Card className="space-y-3 p-4" aria-label="Hint preview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Live hint preview
        </Label>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={showWhitespace ? "default" : "outline"}
            onClick={() => setShowWhitespace((v) => !v)}
            title="Replace invisible whitespace with ·, →, ¶ so you can audit formatting"
          >
            <Pilcrow className="mr-1.5 h-3.5 w-3.5" />
            Whitespace
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setRevealed(
                revealed.size === real.length
                  ? new Set()
                  : new Set(real.map((_, i) => i)),
              )
            }
            disabled={real.length === 0}
          >
            {revealed.size === real.length && real.length > 0 ? "Hide all" : "Reveal all"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Mirrors the learner experience: hints stay hidden until clicked. Markdown,
        line breaks and whitespace render exactly as below.
      </p>

      {real.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          No hints yet — add one on the left to see how it renders.
        </p>
      ) : (
        <ol className="space-y-2">
          {real.map((hint, i) => {
            const open = revealed.has(i);
            const display = showWhitespace ? visualizeWhitespace(hint) : hint;
            return (
              <li key={i} className="rounded-md border bg-muted/20">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-accent"
                  aria-expanded={open}
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Hint {i + 1}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {open ? "Hide" : "Reveal"}
                  </span>
                </button>
                {open && (
                  <div className="border-t px-3 py-2">
                    {showWhitespace ? (
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                        {display}
                      </pre>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none break-words text-sm">
                        <ReactMarkdown>{display}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
};
