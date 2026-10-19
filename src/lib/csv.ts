/**
 * Minimal RFC 4180 CSV parser. Handles quoted fields with commas, escaped
 * quotes and line breaks, plus CRLF line endings and a leading BOM (Excel
 * adds one when saving as "CSV UTF-8").
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (quoted) {
      if (c !== '"') field += c;
      else if (src[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Spreadsheets love to leave trailing empty rows around
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

type Cell = string | number | null | undefined;

function escapeCell(value: Cell) {
  if (value == null) return "";
  let text = String(value);
  // Stop spreadsheet apps from treating text like "=SUM(...)" as a formula
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Cell[][]) {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
