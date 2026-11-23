import { can, getViewer } from "@/crm/auth/dal";
import { csvResponse } from "@/crm/lib/csv";

/** The bulk-import template, with one example row. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  if (!can(viewer, "employees.manage")) return new Response("Forbidden.", { status: 403 });
  return csvResponse("employee-import-template.csv", [
    ["first_name", "last_name", "email", "role", "department", "designation", "manager_email", "joining_date", "employment_type", "phone", "work_location"],
    ["Asha", "Verma", "asha.verma@midis.in", "employee", "Development", "Frontend Developer", "", "2026-12-01", "full_time", "", "Mohali office"],
  ]);
}
