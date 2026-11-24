import { ForbiddenError, getViewer } from "@/crm/auth/dal";
import { audit } from "@/crm/lib/audit";
import { csvResponse } from "@/crm/lib/csv";
import { isoDateOr, uuidOrUndefined } from "@/crm/lib/params";
import { createDoc, MUTED, pdfResponse } from "@/crm/lib/pdf";
import { addDays, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { buildReport, REPORTS, type ReportKey } from "@/crm/services/reports";

/** Any report as CSV (default) or PDF (?format=pdf), with the same filters as the page. */
export async function GET(request: Request, ctx: RouteContext<"/crm/api/reports/[key]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  const { key } = await ctx.params;
  if (!REPORTS.some((r) => r.key === key)) return new Response("Not found.", { status: 404 });

  const sp = new URL(request.url).searchParams;
  const company = await getCompany();
  const today = todayIn(company.timezone);
  // Only real dates and real ids reach the database; a reversed range is swapped (same as the page).
  const from = isoDateOr(sp.get("from"), addDays(today, -30));
  const to = isoDateOr(sp.get("to"), today);
  const filters = { from: to < from ? to : from, to: to < from ? from : to, departmentId: uuidOrUndefined(sp.get("department")), employeeId: uuidOrUndefined(sp.get("employee")) };

  let report;
  try {
    report = await buildReport(viewer, key as ReportKey, filters);
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Forbidden.", { status: 403 });
    throw e;
  }
  await audit({ actorUserId: viewer.userId, action: "report.export", entityType: "report", entityId: key, summary: `Exported the ${report.title} report (${filters.from} to ${filters.to})` });
  const filename = `midis-${key}-${filters.from}-to-${filters.to}`;

  if (sp.get("format") !== "pdf") return csvResponse(`${filename}.csv`, [report.columns, ...report.rows]);

  // PDF: title, summary, then the table, paginated, in landscape-friendly columns.
  const d = await createDoc(`${report.title} report`);
  const L = d.margin;
  const R = d.width - d.margin;
  d.text(`${company.name} · ${report.title} report`, L, { size: 15, bold: true });
  d.y -= 16;
  d.text(report.subtitle, L, { size: 9, color: MUTED });
  d.y -= 20;
  d.text(report.summary.map((s) => `${s.label}: ${s.value}`).join("   ·   "), L, { size: 9, maxWidth: R - L });
  d.y -= 18;
  const cols = report.columns.length;
  const colW = (R - L) / cols;
  const header = () => {
    d.rule();
    d.y -= 13;
    report.columns.forEach((c, i) => d.text(c, L + i * colW, { size: 7.5, bold: true, maxWidth: colW - 4 }));
    d.y -= 6;
    d.rule();
    d.y -= 12;
  };
  header();
  for (const row of report.rows) {
    if (d.y < d.margin + 20) {
      d.newPageIfNeeded(9999);
      header();
    }
    row.forEach((v, i) => d.text(String(v), L + i * colW, { size: 7.5, maxWidth: colW - 4 }));
    d.y -= 13;
  }
  if (!report.rows.length) d.text("No data for this period.", L, { size: 9, color: MUTED });
  d.y -= 10;
  d.text(`Generated ${today} from the MIDIS Employee Portal. Confidential.`, L, { size: 7.5, color: MUTED });
  return pdfResponse(d, `${filename}.pdf`, false);
}
