/** GFM table sanitizer.
 *
 *  Takes a markdown string and walks every GFM-style pipe table, ensuring:
 *    - A header row exists (promote first body row if separator is missing).
 *    - Separator row uses a valid `---`/`:---:` syntax with one cell per column.
 *    - Every body row has the same column count (pads short, trims long).
 *    - Alignment is normalized (`left|right|center|none`).
 *
 *  Returns the (possibly fixed) markdown plus a report describing what was
 *  changed so the editor can surface a confirmation step. */

export interface TableIssue {
  index: number; // 0-based table index in source order
  kind:
    | "missing-separator"
    | "header-row-promoted"
    | "column-count-mismatch"
    | "alignment-inconsistent"
    | "empty-header";
  detail?: string;
}

export interface TableReport {
  tablesFound: number;
  tablesNormalized: number;
  issues: TableIssue[];
  /** Side-by-side previews of every modified table (original ↔ fixed). */
  diffs: { index: number; before: string; after: string }[];
}

const SEP_CELL = /^\s*:?-{3,}:?\s*$/;

const splitRow = (line: string): string[] => {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  // Respect escaped pipes \|
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && s[i + 1] === "|") {
      buf += "\\|";
      i++;
      continue;
    }
    if (c === "|") {
      out.push(buf.trim());
      buf = "";
    } else buf += c;
  }
  out.push(buf.trim());
  return out;
};

const isPipeLine = (line: string) => /\|/.test(line) && line.trim().startsWith("|");
const isSepRow = (cells: string[]) => cells.length > 0 && cells.every((c) => SEP_CELL.test(c));

const alignFromSep = (cell: string): "left" | "right" | "center" | "none" => {
  const t = cell.trim();
  const left = t.startsWith(":");
  const right = t.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return "none";
};

const sepFromAlign = (a: "left" | "right" | "center" | "none") => {
  if (a === "center") return ":---:";
  if (a === "right") return "---:";
  if (a === "left") return ":---";
  return "---";
};

function buildRow(cells: string[]): string {
  return "| " + cells.map((c) => c || " ").join(" | ") + " |";
}

interface RawTable {
  start: number; // line index
  end: number; // exclusive
  rows: string[][];
}

function findTables(lines: string[]): RawTable[] {
  const out: RawTable[] = [];
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (/^```/.test(ln)) {
      inFence = !inFence;
      i++;
      continue;
    }
    if (inFence || !isPipeLine(ln)) {
      i++;
      continue;
    }
    // Collect contiguous pipe lines.
    let j = i;
    const rows: string[][] = [];
    while (j < lines.length && isPipeLine(lines[j])) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    // Need at least 2 lines and at least one separator OR all-th-like first line.
    if (rows.length >= 2) {
      out.push({ start: i, end: j, rows });
    }
    i = j + 1;
  }
  return out;
}

interface NormalizedTable {
  text: string;
  changed: boolean;
  issues: TableIssue["kind"][];
  detail?: string;
}

function normalizeTable(rows: string[][], index: number): NormalizedTable {
  const issues: TableIssue["kind"][] = [];
  let header = rows[0];
  let sepIdx = rows.findIndex(isSepRow);
  let body: string[][];

  if (sepIdx === -1) {
    issues.push("missing-separator");
    issues.push("header-row-promoted");
    body = rows.slice(1);
  } else if (sepIdx !== 1) {
    // Separator not directly after the first row — promote first row as header.
    issues.push("header-row-promoted");
    body = rows.filter((_, k) => k !== 0 && k !== sepIdx);
  } else {
    body = rows.slice(2);
  }

  const colCount = Math.max(header.length, ...body.map((r) => r.length));
  const pad = (r: string[]) => {
    if (r.length === colCount) return r;
    if (r.length < colCount)
      return [...r, ...Array.from({ length: colCount - r.length }, () => "")];
    return r.slice(0, colCount);
  };

  const padHeader = pad(header);
  if (padHeader.every((c) => !c.trim())) issues.push("empty-header");

  // Build normalized separator.
  const aligns: Array<"left" | "right" | "center" | "none"> = [];
  if (sepIdx !== -1) {
    const sepRow = rows[sepIdx];
    for (let i = 0; i < colCount; i++) {
      aligns.push(sepRow[i] ? alignFromSep(sepRow[i]) : "none");
    }
  } else {
    for (let i = 0; i < colCount; i++) aligns.push("none");
  }

  const sepLine = "| " + aligns.map(sepFromAlign).join(" | ") + " |";

  const padBody = body.map(pad);
  const colMismatch = rows.some((r) => r.length !== colCount);
  if (colMismatch) issues.push("column-count-mismatch");

  const out = [buildRow(padHeader), sepLine, ...padBody.map(buildRow)].join("\n");

  // Was anything actually modified?
  const original = rows.map(buildRow).join("\n");
  const changed = out !== original || issues.length > 0;

  return {
    text: out,
    changed,
    issues,
    detail: changed
      ? `Table ${index + 1}: ${colCount} cols × ${padBody.length} rows`
      : undefined,
  };
}

export function sanitizeGfmTables(md: string): { markdown: string; report: TableReport } {
  const lines = md.split("\n");
  const tables = findTables(lines);
  const report: TableReport = {
    tablesFound: tables.length,
    tablesNormalized: 0,
    issues: [],
    diffs: [],
  };
  if (!tables.length) return { markdown: md, report };

  // Apply normalization back-to-front so line indices remain valid.
  let out = lines.slice();
  for (let t = tables.length - 1; t >= 0; t--) {
    const tbl = tables[t];
    const idx = t; // zero-based
    const norm = normalizeTable(tbl.rows, idx);
    const before = lines.slice(tbl.start, tbl.end).join("\n");
    if (norm.changed) {
      report.tablesNormalized += 1;
      for (const k of norm.issues) report.issues.push({ index: idx, kind: k, detail: norm.detail });
      report.diffs.push({ index: idx, before, after: norm.text });
      out = [...out.slice(0, tbl.start), ...norm.text.split("\n"), ...out.slice(tbl.end)];
    }
  }
  // diffs were pushed back-to-front; flip for natural ordering.
  report.diffs.reverse();
  return { markdown: out.join("\n"), report };
}
