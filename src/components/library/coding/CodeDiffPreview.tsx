import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeDiffPreviewProps {
  before: string;
  after: string;
  /** Cap rendered diff hunks to keep the dialog compact. */
  maxLines?: number;
  className?: string;
  /**
   * "rows"   — classic per-line +/- rows
   * "blocks" — group contiguous changed lines into hunks (more readable
   *            for multi-line edits)
   */
  defaultMode?: "rows" | "blocks";
  /** Show the "Show full diff" toggle. Default: true */
  allowExpand?: boolean;
  /** Show the rows/blocks mode switcher. Default: true */
  allowModeSwitch?: boolean;
}

type DiffOp = "equal" | "add" | "del";
interface DiffRow {
  op: DiffOp;
  beforeNo: number | null;
  afterNo: number | null;
  text: string;
}

/**
 * Compute a tiny line-level LCS diff. Good enough for short code snippets
 * shown in a confirmation dialog — not meant for huge files.
 */
const computeLineDiff = (a: string, b: string): DiffRow[] => {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const n = aLines.length;
  const m = bLines.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        aLines[i] === bLines[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let aNo = 1;
  let bNo = 1;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      rows.push({ op: "equal", beforeNo: aNo, afterNo: bNo, text: aLines[i] });
      i++; j++; aNo++; bNo++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ op: "del", beforeNo: aNo, afterNo: null, text: aLines[i] });
      i++; aNo++;
    } else {
      rows.push({ op: "add", beforeNo: null, afterNo: bNo, text: bLines[j] });
      j++; bNo++;
    }
  }
  while (i < n) {
    rows.push({ op: "del", beforeNo: aNo, afterNo: null, text: aLines[i] });
    i++; aNo++;
  }
  while (j < m) {
    rows.push({ op: "add", beforeNo: null, afterNo: bNo, text: bLines[j] });
    j++; bNo++;
  }
  return rows;
};

const compactWithContext = (rows: DiffRow[], context = 2): DiffRow[] => {
  const keep = new Array(rows.length).fill(false);
  rows.forEach((r, idx) => {
    if (r.op !== "equal") {
      for (let k = Math.max(0, idx - context); k <= Math.min(rows.length - 1, idx + context); k++) {
        keep[k] = true;
      }
    }
  });
  const out: DiffRow[] = [];
  let skipped = 0;
  rows.forEach((r, idx) => {
    if (keep[idx]) {
      if (skipped > 0) {
        out.push({ op: "equal", beforeNo: null, afterNo: null, text: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"} …` });
        skipped = 0;
      }
      out.push(r);
    } else {
      skipped++;
    }
  });
  if (skipped > 0) {
    out.push({ op: "equal", beforeNo: null, afterNo: null, text: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"} …` });
  }
  return out;
};

/** Group rows into hunks of consecutive same-op lines for blocks rendering. */
interface DiffBlock {
  op: DiffOp | "skip";
  beforeStart: number | null;
  afterStart: number | null;
  lines: string[];
}

const groupIntoBlocks = (rows: DiffRow[]): DiffBlock[] => {
  const blocks: DiffBlock[] = [];
  for (const r of rows) {
    const isSkip =
      r.op === "equal" && r.beforeNo === null && r.afterNo === null;
    const op: DiffBlock["op"] = isSkip ? "skip" : r.op;
    const last = blocks[blocks.length - 1];
    if (last && last.op === op) {
      last.lines.push(r.text);
    } else {
      blocks.push({
        op,
        beforeStart: r.beforeNo,
        afterStart: r.afterNo,
        lines: [r.text],
      });
    }
  }
  return blocks;
};

const opSymbol = (op: DiffOp | "skip") =>
  op === "add" ? "+" : op === "del" ? "−" : " ";

export const CodeDiffPreview = ({
  before,
  after,
  maxLines = 24,
  className,
  defaultMode = "blocks",
  allowExpand = true,
  allowModeSwitch = true,
}: CodeDiffPreviewProps) => {
  const [mode, setMode] = useState<"rows" | "blocks">(defaultMode);
  const [expanded, setExpanded] = useState(false);

  const { rows, added, removed, totalCompactLines } = useMemo(() => {
    const full = computeLineDiff(before, after);
    const added = full.filter((r) => r.op === "add").length;
    const removed = full.filter((r) => r.op === "del").length;
    const compact = compactWithContext(full, 2);
    return {
      rows: compact,
      added,
      removed,
      totalCompactLines: compact.length,
    };
  }, [before, after]);

  const visibleRows = expanded ? rows : rows.slice(0, maxLines);
  const truncated = !expanded && rows.length > maxLines;

  if (added === 0 && removed === 0) {
    return (
      <div className={cn("rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground", className)}>
        No differences — both versions are identical.
      </div>
    );
  }

  const blocks = mode === "blocks" ? groupIntoBlocks(visibleRows) : null;

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span>Diff preview</span>
        <div className="flex items-center gap-3">
          {allowModeSwitch && (
            <div className="flex items-center gap-0.5 rounded border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("blocks")}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide",
                  mode === "blocks"
                    ? "bg-primary/15 text-foreground"
                    : "hover:text-foreground",
                )}
              >
                Blocks
              </button>
              <button
                type="button"
                onClick={() => setMode("rows")}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide",
                  mode === "rows"
                    ? "bg-primary/15 text-foreground"
                    : "hover:text-foreground",
                )}
              >
                Rows
              </button>
            </div>
          )}
          <span className="flex items-center gap-2 font-mono">
            <span className="text-emerald-500">+{added}</span>
            <span className="text-rose-500">−{removed}</span>
          </span>
        </div>
      </div>
      <div className={cn("overflow-auto bg-background", expanded ? "max-h-[60vh]" : "max-h-64")}>
        {mode === "rows" ? (
          <pre className="text-[11.5px] leading-relaxed font-mono">
            {visibleRows.map((r, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-2 px-2",
                  r.op === "add" && "bg-emerald-500/10",
                  r.op === "del" && "bg-rose-500/10",
                  r.op === "equal" && r.beforeNo === null && r.afterNo === null && "italic text-muted-foreground",
                )}
              >
                <span className="select-none w-4 text-center shrink-0 text-muted-foreground">
                  {opSymbol(r.op)}
                </span>
                <span
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    r.op === "add" && "text-emerald-600 dark:text-emerald-400",
                    r.op === "del" && "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {r.text || " "}
                </span>
              </div>
            ))}
          </pre>
        ) : (
          <div className="text-[11.5px] leading-relaxed font-mono divide-y divide-border/40">
            {blocks!.map((b, idx) => {
              const isSkip = b.op === "skip";
              const headerLabel =
                b.op === "add"
                  ? `Added · ${b.lines.length} line${b.lines.length === 1 ? "" : "s"}`
                  : b.op === "del"
                    ? `Removed · ${b.lines.length} line${b.lines.length === 1 ? "" : "s"}`
                    : isSkip
                      ? null
                      : `Unchanged · ${b.lines.length} line${b.lines.length === 1 ? "" : "s"}`;
              return (
                <div
                  key={idx}
                  className={cn(
                    b.op === "add" && "bg-emerald-500/10",
                    b.op === "del" && "bg-rose-500/10",
                    isSkip && "bg-muted/30",
                  )}
                >
                  {headerLabel && b.op !== "equal" && (
                    <div
                      className={cn(
                        "px-2 py-0.5 text-[10px] uppercase tracking-wide font-sans font-semibold",
                        b.op === "add" && "text-emerald-600 dark:text-emerald-400",
                        b.op === "del" && "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {opSymbol(b.op)} {headerLabel}
                    </div>
                  )}
                  {isSkip ? (
                    <div className="px-2 py-1 italic text-muted-foreground text-[11px]">
                      {b.lines.join(" ")}
                    </div>
                  ) : (
                    <pre className="px-2 pb-1">
                      {b.lines.map((line, li) => (
                        <div
                          key={li}
                          className={cn(
                            "flex gap-2",
                            b.op === "add" && "text-emerald-700 dark:text-emerald-300",
                            b.op === "del" && "text-rose-700 dark:text-rose-300",
                          )}
                        >
                          <span className="select-none w-4 text-center shrink-0 opacity-60">
                            {opSymbol(b.op)}
                          </span>
                          <span className="whitespace-pre-wrap break-all">
                            {line || " "}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {(truncated || (allowExpand && expanded && totalCompactLines > maxLines)) && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 border-t">
          <span>
            {expanded
              ? `Showing all ${totalCompactLines} diff lines.`
              : `Showing ${maxLines} of ${totalCompactLines} diff lines.`}
          </span>
          {allowExpand && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-[11px]"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Collapse diff" : "Show full diff"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
