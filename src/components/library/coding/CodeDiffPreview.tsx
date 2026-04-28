import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CodeDiffPreviewProps {
  before: string;
  after: string;
  /** Cap rendered diff hunks to keep the dialog compact. */
  maxLines?: number;
  className?: string;
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

  // LCS length table
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

/**
 * Trim equal regions to a few lines of context around each change so the
 * diff stays compact even for long files.
 */
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

export const CodeDiffPreview = ({
  before,
  after,
  maxLines = 24,
  className,
}: CodeDiffPreviewProps) => {
  const { rows, added, removed, truncated } = useMemo(() => {
    const full = computeLineDiff(before, after);
    const added = full.filter((r) => r.op === "add").length;
    const removed = full.filter((r) => r.op === "del").length;
    const compact = compactWithContext(full, 2);
    const truncated = compact.length > maxLines;
    return { rows: compact.slice(0, maxLines), added, removed, truncated };
  }, [before, after, maxLines]);

  if (added === 0 && removed === 0) {
    return (
      <div className={cn("rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground", className)}>
        No differences — both versions are identical.
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span>Diff preview</span>
        <span className="flex items-center gap-2 font-mono">
          <span className="text-emerald-500">+{added}</span>
          <span className="text-rose-500">−{removed}</span>
        </span>
      </div>
      <div className="max-h-64 overflow-auto bg-background">
        <pre className="text-[11.5px] leading-relaxed font-mono">
          {rows.map((r, idx) => (
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
                {r.op === "add" ? "+" : r.op === "del" ? "−" : " "}
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
        {truncated && (
          <div className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 border-t">
            Diff truncated for preview. The full replacement will be applied on confirm.
          </div>
        )}
      </div>
    </div>
  );
};
