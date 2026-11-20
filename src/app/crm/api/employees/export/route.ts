import { can, getViewer } from "@/crm/auth/dal";
import { audit } from "@/crm/lib/audit";
import { csvResponse } from "@/crm/lib/csv";
import { exportEmployees } from "@/crm/services/employees";

/** CSV export of the directory with the current filters. Work details only — no personal or salary data. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  if (!can(viewer, "employees.view_all")) return new Response("Forbidden.", { status: 403 });

  const sp = new URL(request.url).searchParams;
  const pick = (k: string) => sp.get(k)?.slice(0, 100) || undefined;
  const rows = await exportEmployees(viewer, { q: pick("q"), department: pick("department"), role: pick("role"), status: pick("status") });
  await audit({ actorUserId: viewer.userId, action: "employee.export", entityType: "employee", summary: `Exported ${rows.length} employee records to CSV` });

  return csvResponse(`midis-employees-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Employee code", "First name", "Last name", "Official email", "Department", "Designation", "Reports to", "Role", "Employment type", "Status", "Joining date"],
    ...rows.map((r) => [r.employeeCode, r.firstName, r.lastName, r.officialEmail, r.department, r.designation, r.managerName, r.role, r.employmentType, r.employmentStatus, r.joiningDate]),
  ]);
}
