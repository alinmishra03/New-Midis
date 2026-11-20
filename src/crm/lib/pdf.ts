import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Small PDF helpers on pdf-lib (pure JS, no native dependencies). Standard
 * fonts are WinAnsi-only, so text is sanitised to that range and currency
 * is written as "INR" rather than the rupee sign.
 */

export const INK = rgb(0.09, 0.098, 0.11);
export const MUTED = rgb(0.38, 0.39, 0.41);
export const LINE = rgb(0.88, 0.88, 0.87);
export const ACCENT = rgb(0.937, 0.529, 0.086);

export function safe(text: string | null | undefined) {
  return (text ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

export function money(amount: string | number, currency = "INR") {
  const n = Number(amount);
  return `${currency} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type Doc = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  width: number;
  y: number;
  margin: number;
  text: (t: string, x: number, opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; align?: "left" | "right"; maxWidth?: number }) => void;
  rule: (y?: number) => void;
  newPageIfNeeded: (space: number) => void;
};

export async function createDoc(title: string): Promise<Doc> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(title));
  pdf.setProducer("MIDIS Employee Portal");
  pdf.setCreator("MIDIS Employee Portal");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const d: Doc = {
    pdf,
    page: pdf.addPage([595.28, 841.89]),
    font,
    bold,
    width: 595.28,
    y: 841.89 - margin,
    margin,
    text(t, x, o = {}) {
      const f = o.bold ? bold : font;
      const size = o.size ?? 10;
      let s = safe(t);
      if (o.maxWidth) while (s.length > 1 && f.widthOfTextAtSize(s, size) > o.maxWidth) s = s.slice(0, -2) + ".";
      const w = f.widthOfTextAtSize(s, size);
      d.page.drawText(s, { x: o.align === "right" ? x - w : x, y: d.y, size, font: f, color: o.color ?? INK });
    },
    rule(y) {
      d.page.drawLine({ start: { x: margin, y: y ?? d.y }, end: { x: d.width - margin, y: y ?? d.y }, thickness: 0.75, color: LINE });
    },
    newPageIfNeeded(space) {
      if (d.y - space < margin) {
        d.page = pdf.addPage([595.28, 841.89]);
        d.y = 841.89 - margin;
      }
    },
  };
  return d;
}

export async function pdfResponse(doc: Doc, filename: string, inline = true) {
  const bytes = await doc.pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
