import { can, getViewer } from "@/crm/auth/dal";
import { audit } from "@/crm/lib/audit";
import { csvResponse } from "@/crm/lib/csv";
import { getRun } from "@/crm/services/payroll";

/** Payroll register for one run as CSV (payroll.view only). */
export async function GET(_request: Request, ctx: RouteContext<"/crm/api/payroll/runs/[id]/export">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  if (!can(viewer, "payroll.view")) return new Response("Forbidden.", { status: 403 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found.", { status: 404 });
  const data = await getRun(viewer, id);
  if (!data) return new Response("Not found.", { status: 404 });
  const { run, slips } = data;
  await audit({ actorUserId: viewer.userId, action: "payroll.export", entityType: "payroll_run", entityId: id, summary: `Exported payroll register for ${run.month}/${run.year}` });
  return csvResponse(`payroll-${run.year}-${String(run.month).padStart(2, "0")}.csv`, [
    ["Employee code", "Name", "Working days", "Paid days", "Gross", "Deductions", "Net pay", "Run status"],
    ...slips.map((s) => [s.code, `${s.firstName} ${s.lastName}`, s.workingDays, Number(s.paidDays), s.gross, s.deductions, s.net, run.status]),
  ]);
}
