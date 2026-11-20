/**
 * Seeds the employee portal's reference data. Safe to run repeatedly: it
 * inserts what is missing and never overwrites anything HR or a Super Admin
 * has since changed (except the permission catalogue, which always mirrors
 * the code).
 *
 *   npm run db:seed
 *   npm run db:seed -- --reset-role-permissions   # restore default role permissions
 *
 * It creates no user accounts. Use `npm run crm:create-admin` for the first
 * Super Admin; everyone else is invited from inside the portal.
 */
import { eq, inArray, notInArray } from "drizzle-orm";
import { closeDb, db } from "@/crm/db";
import {
  companySettings,
  departments,
  designations,
  holidays,
  leaveTypes,
  permissions,
  rolePermissions,
  roles,
  workSchedules,
} from "@/crm/db/schema";
import { PERMISSIONS, ROLE_KEYS, SYSTEM_ROLES, type Permission } from "@/crm/auth/permissions";
import { site } from "@/content/site";

const resetRolePermissions = process.argv.includes("--reset-role-permissions");

async function main() {
  // Company profile — taken from the public site's published details.
  await db
    .insert(companySettings)
    .values({
      id: 1,
      name: "MIDIS Resources",
      legalName: site.legalName,
      timezone: "Asia/Kolkata",
      currency: "INR",
      email: site.email,
      phone: site.phone,
      website: site.url,
      address: [site.address.street, site.address.locality, site.address.region, site.address.postalCode]
        .filter(Boolean)
        .join(", "),
    })
    .onConflictDoNothing();

  // Permission catalogue mirrors the code exactly.
  const keys = Object.keys(PERMISSIONS) as Permission[];
  for (const key of keys) {
    const p = PERMISSIONS[key];
    await db
      .insert(permissions)
      .values({ key, module: p.module, description: p.description })
      .onConflictDoUpdate({ target: permissions.key, set: { module: p.module, description: p.description } });
  }
  await db.delete(permissions).where(notInArray(permissions.key, keys));

  // System roles. Default permissions are applied when a role is first
  // created (or on --reset-role-permissions), never on top of later edits.
  for (const key of ROLE_KEYS) {
    const def = SYSTEM_ROLES[key];
    const [created] = await db
      .insert(roles)
      .values({ key, name: def.name, description: def.description, isSystem: true })
      .onConflictDoNothing()
      .returning({ id: roles.id });
    const role = created ?? (await db.query.roles.findFirst({ where: eq(roles.key, key) }))!;
    if (created || resetRolePermissions) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      if (def.permissions.length) {
        await db.insert(rolePermissions).values(def.permissions.map((permissionKey) => ({ roleId: role.id, permissionKey })));
      }
    }
  }

  // A default working schedule. MIDIS should confirm the real hours and
  // working days in Settings → Work schedules.
  await db
    .insert(workSchedules)
    .values({
      name: "General shift",
      isDefault: true,
      startTime: "09:30",
      endTime: "18:30",
      workingDays: [1, 2, 3, 4, 5],
      lateGraceMinutes: 15,
      earlyLeaveGraceMinutes: 15,
      fullDayMinutes: 480,
      halfDayMinutes: 240,
      breakAllowanceMinutes: 60,
    })
    .onConflictDoNothing();

  // Leave types. Quotas are starting values for HR to replace with MIDIS's
  // actual leave policy in Settings → Leave policy.
  const leave = [
    { code: "CL", name: "Casual Leave", annualQuota: "12", color: "#ef8716", sortOrder: 1 },
    { code: "SL", name: "Sick Leave", annualQuota: "12", color: "#d6455d", documentRequiredAfterDays: 2, sortOrder: 2 },
    { code: "EL", name: "Earned Leave", annualQuota: "15", maxCarryForward: "30", allowHalfDay: false, color: "#2f7d5b", sortOrder: 3 },
    { code: "AL", name: "Annual Leave", annualQuota: "0", allowHalfDay: false, color: "#3b6fd4", sortOrder: 4, isActive: false },
    { code: "OH", name: "Optional Holiday", annualQuota: "2", allowHalfDay: false, color: "#8a5cd1", sortOrder: 5 },
    { code: "UL", name: "Unpaid Leave", annualQuota: null, isPaid: false, color: "#6b7280", sortOrder: 6 },
  ];
  for (const t of leave) await db.insert(leaveTypes).values(t).onConflictDoNothing();

  // Departments and designations taken from the roles on the public team page.
  const depts = [
    { name: "Leadership", code: "LEAD" },
    { name: "Design", code: "DES" },
    { name: "Development", code: "DEV" },
    { name: "Digital Marketing", code: "MKT" },
    { name: "Human Resources", code: "HR" },
    { name: "Finance & Administration", code: "FIN" },
  ];
  for (const d of depts) await db.insert(departments).values(d).onConflictDoNothing();
  const deptRows = await db
    .select()
    .from(departments)
    .where(inArray(departments.code, depts.map((d) => d.code)));
  const dept = (code: string) => deptRows.find((d) => d.code === code)?.id ?? null;

  const titles: [string, string, number][] = [
    ["Managing Director", "LEAD", 6],
    ["CEO & Director", "LEAD", 6],
    ["Web Developer", "DEV", 2],
    ["Frontend Developer", "DEV", 2],
    ["Backend Developer", "DEV", 2],
    ["Full Stack Developer", "DEV", 3],
    ["Graphic Designer", "DES", 2],
    ["UX/UI Designer", "DES", 2],
    ["Digital Marketer", "MKT", 2],
    ["HR Executive", "HR", 2],
    ["Accounts Executive", "FIN", 2],
  ];
  for (const [title, code, level] of titles) {
    await db.insert(designations).values({ title, departmentId: dept(code), level }).onConflictDoNothing();
  }

  // Only the fixed-date national holidays; HR adds the rest (they move each year).
  const year = new Date().getFullYear();
  for (const y of [year, year + 1]) {
    for (const [md, name] of [
      ["01-26", "Republic Day"],
      ["08-15", "Independence Day"],
      ["10-02", "Gandhi Jayanti"],
      ["12-25", "Christmas"],
    ] as const) {
      await db.insert(holidays).values({ date: `${y}-${md}`, name, type: "public" }).onConflictDoNothing();
    }
  }

  console.log("Seeded reference data: company profile, roles and permissions, work schedule, leave types, departments, designations, fixed holidays.");
  if (resetRolePermissions) console.log("Role permissions were reset to their defaults.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
