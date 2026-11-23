import { getViewer } from "@/crm/auth/dal";
import { audit } from "@/crm/lib/audit";
import { ACCENT, createDoc, MUTED, money, pdfResponse } from "@/crm/lib/pdf";
import { formatDate } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { getPayslipForViewer } from "@/crm/services/payroll";

/**
 * A payslip as PDF, generated on request (nothing is stored). Employees
 * get only their own, and only once the run is approved; payroll.view sees
 * any.
 */
export async function GET(request: Request, ctx: RouteContext<"/crm/api/payslips/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found.", { status: 404 });
  const row = await getPayslipForViewer(viewer, id);
  if (!row) return new Response("Not found.", { status: 404 });
  const { slip, run } = row;
  const company = await getCompany();
  const period = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(run.year, run.month - 1, 1)));
  const name = `${row.firstName} ${row.lastName}`.trim();

  const d = await createDoc(`Payslip ${period} - ${name}`);
  const L = d.margin;
  const R = d.width - d.margin;

  d.page.drawRectangle({ x: 0, y: d.page.getHeight() - 6, width: d.width, height: 6, color: ACCENT });
  d.text(company.name, L, { size: 16, bold: true });
  d.text(`Payslip`, R, { size: 16, bold: true, align: "right" });
  d.y -= 16;
  // Wrap the address over up to two lines rather than truncating it.
  const words = (company.address ?? "").split(/s+/);
  const lines: string[] = [""];
  for (const w of words) {
    const next = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w;
    if (d.font.widthOfTextAtSize(next, 8.5) > 340 && lines.length < 2) lines.push(w);
    else lines[lines.length - 1] = next;
  }
  d.text(lines[0] ?? "", L, { size: 8.5, color: MUTED, maxWidth: 340 });
  d.text(period, R, { size: 10, color: MUTED, align: "right" });
  d.y -= 11;
  if (lines[1]) d.text(lines[1], L, { size: 8.5, color: MUTED, maxWidth: 340 });
  d.y -= 1;
  if (run.status === "draft") {
    d.text("DRAFT - NOT APPROVED", R, { size: 9, bold: true, color: ACCENT, align: "right" });
  }
  d.y -= 18;
  d.rule();
  d.y -= 22;

  const info: [string, string][] = [
    ["Employee", name],
    ["Employee ID", row.code],
    ["Designation", row.designation ?? "-"],
    ["Department", row.department ?? "-"],
    ["Date of joining", formatDate(row.joiningDate)],
    ["Paid days", `${Number(slip.paidDays)} of ${slip.workingDays}`],
  ];
  for (let i = 0; i < info.length; i += 2) {
    for (const [j, x] of [[0, L], [1, L + (R - L) / 2]] as const) {
      const pair = info[i + j];
      if (!pair) continue;
      d.text(pair[0], x, { size: 8.5, color: MUTED });
      d.y -= 12;
      d.text(pair[1], x, { size: 10.5, bold: true, maxWidth: (R - L) / 2 - 12 });
      d.y += 12;
    }
    d.y -= 32;
  }
  d.rule();
  d.y -= 24;

  const colW = (R - L) / 2 - 12;
  const startY = d.y;
  const table = (title: string, lines: { label: string; amount: string }[], x: number) => {
    d.y = startY;
    d.text(title, x, { size: 10, bold: true });
    d.text("Amount", x + colW, { size: 10, bold: true, align: "right" });
    d.y -= 8;
    d.page.drawLine({ start: { x, y: d.y }, end: { x: x + colW, y: d.y }, thickness: 0.75, color: MUTED });
    d.y -= 16;
    for (const l of lines) {
      d.text(l.label, x, { size: 9.5, maxWidth: colW - 110 });
      d.text(money(l.amount, slip.currency), x + colW, { size: 9.5, align: "right" });
      d.y -= 16;
    }
    if (!lines.length) {
      d.text("None", x, { size: 9.5, color: MUTED });
      d.y -= 16;
    }
    return d.y;
  };
  const e = table("Earnings", slip.earnings, L);
  const ded = table("Deductions", slip.deductions, L + (R - L) / 2 + 12);
  d.y = Math.min(e, ded) - 6;
  d.rule();
  d.y -= 18;
  d.text("Gross earnings", L, { size: 10, bold: true });
  d.text(money(slip.grossEarnings, slip.currency), L + colW, { size: 10, bold: true, align: "right" });
  d.text("Total deductions", L + (R - L) / 2 + 12, { size: 10, bold: true });
  d.text(money(slip.totalDeductions, slip.currency), R, { size: 10, bold: true, align: "right" });
  d.y -= 34;

  d.page.drawRectangle({ x: L, y: d.y - 12, width: R - L, height: 36, color: ACCENT, opacity: 0.12 });
  d.y += 2;
  d.text("Net pay", L + 14, { size: 12, bold: true });
  d.text(money(slip.netPay, slip.currency), R - 14, { size: 14, bold: true, align: "right" });
  d.y -= 64;
  d.text("This is a computer-generated payslip and does not require a signature.", L, { size: 8, color: MUTED });
  d.y -= 11;
  d.text(`Generated ${formatDate(new Date().toISOString().slice(0, 10))} from the MIDIS Employee Portal.`, L, { size: 8, color: MUTED });

  if (viewer.employee?.id !== slip.employeeId) {
    await audit({ actorUserId: viewer.userId, action: "payroll.payslip_view", entityType: "payslip", entityId: id, summary: `Opened ${name}'s payslip for ${period}` });
  }
  const download = new URL(request.url).searchParams.has("download");
  return pdfResponse(d, `payslip-${run.year}-${String(run.month).padStart(2, "0")}-${row.code}.pdf`, !download);
}
