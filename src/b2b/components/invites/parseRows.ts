import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedRow } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pickEmail(parts: string[]) {
  const idx = parts.findIndex((p) => EMAIL_RE.test(p));
  if (idx < 0) return null;
  const email = parts[idx].toLowerCase();
  const others = parts.filter((_, i) => i !== idx);
  return { email, name: others[0], external_id: others[1] };
}

export function parseText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const out: ParsedRow[] = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line
      .split(/[,;\t]/)
      .map((p) => p.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    if (!parts.length) return;
    const picked = pickEmail(parts);
    if (!picked) {
      out.push({
        email: line,
        _status: "invalid",
        _reason: "no valid email found",
        _line: i + 1,
      });
      return;
    }
    out.push({ ...picked, _status: "valid", _line: i + 1 });
  });
  return dedupe(out);
}

export function parseCsv(text: string): ParsedRow[] {
  const res = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: true,
  });
  const out: ParsedRow[] = [];
  const rows = (res.data ?? []) as string[][];
  // Skip header if first row has no email
  const startIdx = rows.length && !rows[0].some((c) => EMAIL_RE.test((c || "").trim())) ? 1 : 0;
  for (let i = startIdx; i < rows.length; i++) {
    const parts = (rows[i] || []).map((p) => (p ?? "").toString().trim()).filter(Boolean);
    if (!parts.length) continue;
    const picked = pickEmail(parts);
    if (!picked) {
      out.push({
        email: parts.join(", "),
        _status: "invalid",
        _reason: "no valid email",
        _line: i + 1,
      });
      continue;
    }
    out.push({ ...picked, _status: "valid", _line: i + 1 });
  }
  return dedupe(out);
}

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    const csv = rows.map((r) => (r as unknown[]).join(",")).join("\n");
    return parseCsv(csv);
  }
  const text = await file.text();
  return parseCsv(text);
}

function dedupe(rows: ParsedRow[]): ParsedRow[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    if (r._status !== "valid") return r;
    const k = r.email.toLowerCase();
    if (seen.has(k))
      return { ...r, _status: "duplicate", _reason: "duplicate in upload" };
    seen.add(k);
    return r;
  });
}

export function markExistingDuplicates(
  rows: ParsedRow[],
  existingEmails: Set<string>,
): ParsedRow[] {
  return rows.map((r) => {
    if (r._status === "valid" && existingEmails.has(r.email.toLowerCase())) {
      return { ...r, _status: "duplicate", _reason: "already invited" };
    }
    return r;
  });
}
