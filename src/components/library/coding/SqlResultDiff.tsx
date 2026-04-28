// Side-by-side diff between the user's SQL output and the reference query
// result. Both are tab-separated strings with the first line as the header
// (the format produced by the run-sql / submit-sql edge functions).
//
// We render two synced tables and highlight cells / rows / columns that
// differ, plus a missing/extra row strip below. Falls back to a plain
// pre-block when either side does not look like a tabular result.
import { cn } from "@/lib/utils";

interface SqlResultDiffProps {
  expected: string;
  actual: string;
  className?: string;
}

interface ParsedTable {
  columns: string[];
  rows: string[][];
}

function parseTabular(value: string): ParsedTable | null {
  if (!value || typeof value !== "string") return null;
  const lines = value.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const columns = lines[0].split("\t");
  // Heuristic: if there's only one column and no tabs anywhere, it's not
  // really a table — fall back to plain text mode.
  if (columns.length <= 1 && !value.includes("\t")) return null;
  const rows = lines.slice(1).map((l) => l.split("\t"));
  return { columns, rows };
}

function rowKey(row: string[]) {
  return row.join("\u0001");
}

export const SqlResultDiff = ({ expected, actual, className }: SqlResultDiffProps) => {
  const e = parseTabular(expected);
  const a = parseTabular(actual);

  // Fallback: not parseable as table — show plain side-by-side text.
  if (!e || !a) {
    return (
      <div
        className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono", className)}
        role="region"
        aria-label="Output diff"
      >
        <div>
          <p className="text-muted-foreground mb-1">Expected</p>
          <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
            {expected || "(empty)"}
          </pre>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Got</p>
          <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
            {actual || "(empty)"}
          </pre>
        </div>
      </div>
    );
  }

  // Column comparison.
  const columnsMatch =
    e.columns.length === a.columns.length &&
    e.columns.every((c, i) => c === a.columns[i]);

  // Row-level set diff (order-insensitive presence check). We still render
  // rows in original order in each table, but flag rows that are missing
  // (in expected but not actual) or extra (in actual but not expected).
  const expectedSet = new Set(e.rows.map(rowKey));
  const actualSet = new Set(a.rows.map(rowKey));

  const missingRows = e.rows.filter((r) => !actualSet.has(rowKey(r)));
  const extraRows = a.rows.filter((r) => !expectedSet.has(rowKey(r)));

  // Order diff: rows present in both sides but at different indices.
  const sharedSet = new Set<string>();
  for (const k of expectedSet) if (actualSet.has(k)) sharedSet.add(k);
  const expectedSharedOrder = e.rows
    .map(rowKey)
    .filter((k) => sharedSet.has(k));
  const actualSharedOrder = a.rows
    .map(rowKey)
    .filter((k) => sharedSet.has(k));
  const orderDiffers =
    expectedSharedOrder.length === actualSharedOrder.length &&
    expectedSharedOrder.some((k, i) => k !== actualSharedOrder[i]);

  const renderTable = (
    table: ParsedTable,
    side: "expected" | "actual",
    flagged: Set<string>,
  ) => (
    <div
      className="rounded border bg-background overflow-x-auto"
      role="region"
      aria-label={side === "expected" ? "Expected results" : "Your results"}
    >
      <table className="w-full text-xs font-mono border-collapse">
        <thead className="bg-muted/50">
          <tr>
            {table.columns.map((c, ci) => {
              const otherCol = side === "expected" ? a.columns[ci] : e.columns[ci];
              const colMismatch = otherCol !== c;
              return (
                <th
                  key={ci}
                  scope="col"
                  className={cn(
                    "text-left px-2 py-1.5 border-b font-semibold",
                    colMismatch && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {c}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(1, table.columns.length)}
                className="px-2 py-2 text-muted-foreground italic"
              >
                (no rows)
              </td>
            </tr>
          ) : (
            table.rows.map((row, ri) => {
              const k = rowKey(row);
              const isFlagged = flagged.has(k);
              return (
                <tr
                  key={ri}
                  className={cn(
                    "border-b last:border-b-0",
                    isFlagged &&
                      (side === "expected"
                        ? "bg-emerald-500/10"
                        : "bg-destructive/10"),
                  )}
                  aria-label={
                    isFlagged
                      ? side === "expected"
                        ? "Row missing from your output"
                        : "Extra row not in expected output"
                      : undefined
                  }
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-2 py-1 align-top whitespace-pre-wrap break-all"
                    >
                      {cell === "" ? <span className="text-muted-foreground">∅</span> : cell}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn("space-y-3", className)} role="region" aria-label="Result diff">
      {/* Diff status strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Diff:</span>
        {!columnsMatch && (
          <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5">
            Columns differ
          </span>
        )}
        {missingRows.length > 0 && (
          <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5">
            {missingRows.length} missing row{missingRows.length === 1 ? "" : "s"}
          </span>
        )}
        {extraRows.length > 0 && (
          <span className="rounded bg-destructive/15 text-destructive px-1.5 py-0.5">
            {extraRows.length} extra row{extraRows.length === 1 ? "" : "s"}
          </span>
        )}
        {orderDiffers && (
          <span className="rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
            Row order differs
          </span>
        )}
        {columnsMatch &&
          missingRows.length === 0 &&
          extraRows.length === 0 &&
          !orderDiffers && (
            <span className="text-muted-foreground">No structural differences</span>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Expected ({e.rows.length})</p>
          {renderTable(e, "expected", new Set(missingRows.map(rowKey)))}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Your output ({a.rows.length})</p>
          {renderTable(a, "actual", new Set(extraRows.map(rowKey)))}
        </div>
      </div>
    </div>
  );
};
