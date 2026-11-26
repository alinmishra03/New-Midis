/*
 * CSV reading for the Development team sheet exports. Pure: no I/O.
 *
 * Accepts what Google Sheets ("File → Download → Comma-separated values") and
 * Excel ("CSV UTF-8" or "CSV (Comma delimited)") produce:
 * - UTF-8 with or without a byte-order mark, UTF-16 (LE/BE with BOM), and
 *   Windows-1252 (Excel's legacy "CSV (Comma delimited)");
 * - comma, semicolon (Excel in some locales) or tab separators;
 * - quoted fields with embedded separators, quotes ("") and line breaks;
 * - CRLF, LF or CR line endings.
 * Everything else is rejected with a message a Super Admin can act on.
 */

export const CSV_MAX_BYTES = 900 * 1024; // below Next.js' 1 MB server action body limit
const MAX_ROWS = 20_000;
const MAX_COLUMNS = 100;
const MAX_CELL = 20_000;

export class CsvError extends Error {}

export type ParsedCsv = { rows: string[][]; encoding: "utf-8" | "utf-16le" | "utf-16be" | "windows-1252"; delimiter: "," | ";" | "\t" };

const ALLOWED_TYPES = new Set(["", "text/csv", "application/csv", "text/x-csv", "application/x-csv", "text/comma-separated-values", "text/plain", "application/vnd.ms-excel", "application/octet-stream"]);

/** File-level checks (name, type, size) before reading the bytes. */
export function checkCsvFile(name: string, type: string, size: number) {
  if (!/\.csv$/i.test(name)) throw new CsvError(`“${name}” isn't a .csv file. In Google Sheets use File → Download → Comma-separated values (.csv).`);
  if (!ALLOWED_TYPES.has(type.toLowerCase())) throw new CsvError(`“${name}” has an unexpected file type (${type}). Upload the .csv export.`);
  if (size === 0) throw new CsvError(`“${name}” is empty.`);
  if (size > CSV_MAX_BYTES) throw new CsvError(`“${name}” is ${(size / 1024).toFixed(0)} KB; the limit is ${CSV_MAX_BYTES / 1024} KB.`);
}

function decode(bytes: Uint8Array): { text: string; encoding: ParsedCsv["encoding"] } {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) throw new CsvError("This is an Excel workbook (.xlsx), not a CSV. Save or download it as CSV.");
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder("utf-16le").decode(bytes.subarray(2)), encoding: "utf-16le" };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return { text: new TextDecoder("utf-16be").decode(bytes.subarray(2)), encoding: "utf-16be" };
  const body = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  if (body.includes(0)) throw new CsvError("The file contains binary data; it isn't a CSV export.");
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(body), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(body), encoding: "windows-1252" };
  }
}

/** The separator that appears most often outside quotes in the first non-empty line (comma on ties). */
function detectDelimiter(text: string): ParsedCsv["delimiter"] {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  let seenContent = false;
  for (const c of text) {
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === "\n" || c === "\r")) {
      if (seenContent && (counts[","] || counts[";"] || counts["\t"])) break;
    } else if (!quoted && c in counts) counts[c as keyof typeof counts]++;
    else if (c.trim()) seenContent = true;
  }
  if (counts[";"] > counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  return ",";
}

/**
 * Writes parsed cells back out as CSV text: same rows in the same order, same
 * cells (blank ones included, rows not padded), the original separator, CRLF
 * between rows and none after the last (as Google Sheets exports). A cell is
 * quoted only when it has to be. parseCsv(writeCsv(r)) gives back r exactly.
 * The bytes can still differ from the original file's (encoding, byte-order
 * mark, quoting, line ends, trailing blank lines).
 */
export function writeCsv(rows: string[][], delimiter: ParsedCsv["delimiter"]): string {
  const cell = (c: string) => (c.includes('"') || c.includes(delimiter) || c.includes("\n") || c.includes("\r") ? `"${c.replace(/"/g, '""')}"` : c);
  return rows.map((r) => r.map(cell).join(delimiter)).join("\r\n");
}

export function parseCsv(bytes: Uint8Array): ParsedCsv {
  const { text, encoding } = decode(bytes);
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;
  const endCell = () => {
    if (cell.length > MAX_CELL) throw new CsvError(`Row ${rows.length + 1} has a cell longer than ${MAX_CELL} characters.`);
    row.push(cell);
    cell = "";
    if (row.length > MAX_COLUMNS) throw new CsvError(`Row ${rows.length + 1} has more than ${MAX_COLUMNS} columns.`);
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
    if (rows.length > MAX_ROWS) throw new CsvError(`The file has more than ${MAX_ROWS} rows.`);
  };
  while (i < text.length) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) endCell();
    else if (c === "\r" || c === "\n") {
      endRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else cell += c;
    i++;
  }
  if (quoted) throw new CsvError("The file ends inside a quoted cell; it may be cut off or not a CSV export.");
  if (cell !== "" || row.length) endRow();
  // Drop trailing empty lines.
  while (rows.length && rows[rows.length - 1]!.every((c) => c.trim() === "")) rows.pop();
  if (!rows.length) throw new CsvError("The file has no rows.");
  return { rows, encoding, delimiter };
}
