import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, History, Trash2, X } from "lucide-react";
import { formatRelative } from "@/lib/formatRelative";
import type { RunHistoryEntry } from "@/hooks/useRunHistory";

interface Props {
  entries: RunHistoryEntry[];
  onClear: () => void;
  onRemove: (id: string) => void;
}

const KIND_LABEL: Record<string, string> = {
  "validate-samples": "Validate against samples",
  "fill-expected": "Fill expected from reference",
  "run-example": "Run example",
  "run-test": "Run test",
};

export const RunHistoryPanel = ({ entries, onClear, onRemove }: Props) => {
  const [open, setOpen] = useState(true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  if (!entries.length) {
    return (
      <Card className="p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5" />
          No saved runs yet. Use “Run &amp; save result” buttons to keep a troubleshooting log.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <History className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Run history</span>
              <Badge variant="secondary" className="ml-1">{entries.length}</Badge>
            </Button>
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </Button>
        </div>

        <CollapsibleContent className="mt-2 space-y-2">
          {entries.map((e) => {
            const isOpen = !!openIds[e.id];
            const allPass = e.passed === e.total && e.total > 0;
            return (
              <div
                key={e.id}
                className={`rounded-md border p-2 text-xs ${
                  allPass ? "border-emerald-500/30" : "border-amber-500/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenIds((s) => ({ ...s, [e.id]: !isOpen }))}
                    className="mt-0.5"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {KIND_LABEL[e.kind] ?? e.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          allPass
                            ? "border-emerald-500/40 text-emerald-500"
                            : "border-amber-500/40 text-amber-500"
                        }
                      >
                        {e.passed}/{e.total} passed
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {e.language}
                      </Badge>
                      <span
                        className="text-[11px] text-muted-foreground"
                        title={new Date(e.createdAt).toLocaleString()}
                      >
                        {formatRelative(e.createdAt)}
                      </span>
                    </div>
                    {e.note && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{e.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove entry"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-2 space-y-1.5 pl-5">
                    {e.cases.map((c) => (
                      <div
                        key={c.index}
                        className={`rounded border p-1.5 ${
                          c.pass ? "border-emerald-500/20" : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            #{c.index + 1} — {c.pass ? "pass" : "fail"}
                          </span>
                        </div>
                        {!c.pass && (
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-snug">
                            {c.diff
                              ? c.diff
                                  .split("\n")
                                  .map((line, li) => (
                                    <span
                                      key={li}
                                      className={
                                        line.startsWith("- ")
                                          ? "text-destructive"
                                          : line.startsWith("+ ")
                                            ? "text-emerald-500"
                                            : "text-muted-foreground"
                                      }
                                    >
                                      {line}
                                      {"\n"}
                                    </span>
                                  ))
                              : `expected: ${c.expected}\ngot: ${c.got}`}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
