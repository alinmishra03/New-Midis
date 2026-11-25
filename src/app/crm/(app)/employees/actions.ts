"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/crm/db";
import { departments, designations, employees, passwordResetRequests, roles, users } from "@/crm/db/schema";
import { assertCan, can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { issueToken, revokeToken, tokenTtlLabel, tokenUrl } from "@/crm/auth/tokens";
import { AppError, fail, ok, parseForm, runAction, setFlash, zId, type ActionState } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { parseCsv, toCsv } from "@/crm/lib/csv";
import { fileFrom, uploadFrom } from "@/crm/lib/storage";
import { emailAccessLink } from "@/crm/services/account-emails";
import { AccountError, createEmployeeWithAccount } from "@/crm/services/accounts";
import {
  accountEmailSchema,
  assertCanAssignRole,
  changeAccountEmail,
  deactivateEmployee,
  employeeSchema,
  personalSchema,
  reactivateEmployee,
  setPhoto,
  updateEmployee,
  updatePersonal,
} from "@/crm/services/employees";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const createSchema = employeeSchema.extend({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid company email.")),
  roleKey: z.string().min(1, "Choose a role."),
});

export async function createEmployeeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const result = await runAction(async (viewer) => {
    assertCan(viewer, "employees.manage");
    assertCan(viewer, "users.invite");
    const input = parseForm(createSchema, fd);
    assertCanAssignRole(viewer, input.roleKey);
    try {
      const created = await createEmployeeWithAccount(
        { ...input, email: input.email, roleKey: input.roleKey },
        viewer.userId,
      );
      newId = created.employeeId;
      // Fields createEmployeeWithAccount doesn't take directly.
      await db.update(employees).set({ skills: input.skills, bio: input.bio }).where(eq(employees.id, created.employeeId));
      // The account is committed; the invitation email is best-effort and can't undo it.
      const mail = await emailAccessLink(created.userId, "invite", created.invite.token, viewer.userId);
      await setFlash(
        mail.ok
          ? "Employee created and their invitation email has been sent (link valid 7 days)."
          : `Employee created. The invitation email wasn't sent (${mail.message}) — get their activation link below and send it to them.`,
      );
      return ok("Employee created.");
    } catch (e) {
      if (e instanceof AccountError) throw new AppError(e.message);
      throw e;
    }
  });
  if (result?.ok && newId) redirect(`/crm/employees/${newId}?invite=1`);
  return result;
}

export async function updateEmployeeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const input = parseForm(employeeSchema, fd);
    const roleKey = (fd.get("roleKey") as string) || undefined;
    // Only sent by the Super Admin form; the service enforces who may change it.
    const code = fd.get("employeeCode");
    await updateEmployee(viewer, id, input, roleKey, typeof code === "string" ? code : undefined);
    return ok("Saved.");
  });
}

export async function updatePersonalAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const input = parseForm(personalSchema, fd);
    await updatePersonal(viewer, id, input);
    return ok("Personal details saved.");
  });
}

export async function uploadPhotoAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const file = uploadFrom(fd, "photo");
    if (!file) return fail("Choose an image.");
    await setPhoto(viewer, id, file);
    return ok("Photo updated.");
  });
}

export async function deactivateAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const exitDate = z.iso.date().optional().catch(undefined).parse(fd.get("exitDate") || undefined) ?? null;
    const reason = z.string().max(500).optional().catch(undefined).parse(fd.get("comment") || undefined) ?? null;
    await deactivateEmployee(viewer, id, exitDate, reason);
    return ok("Employee deactivated and signed out of all devices.");
  });
}

export async function reactivateAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await reactivateEmployee(viewer, zId.parse(fd.get("id")));
    return ok("Employee reactivated.");
  });
}

/** Guard: issuing a link grants access to the account, so elevated accounts need a Super Admin. */
async function assertCanIssueFor(viewer: Viewer, userId: string) {
  assertCan(viewer, "users.invite");
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) throw new AppError("Account not found.");
  const r = await db.query.roles.findFirst({ where: eq(roles.id, u.roleId) });
  if (r && !["employee", "manager"].includes(r.key) && !can(viewer, "roles.manage")) {
    throw new ForbiddenError("Only a Super Admin can issue links for HR, Finance or Super Admin accounts.");
  }
  if (u.status === "disabled") throw new AppError("This account is deactivated. Reactivate the employee first.");
  if (u.id === viewer.userId) throw new AppError("Use 'Change password' on your own profile instead.");
  return u;
}

/** Issues an activation (invited) or reset (active) link for HR to pass on. */
export async function issueAccessLinkAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const userId = zId.parse(fd.get("userId"));
    const u = await assertCanIssueFor(viewer, userId);
    const type = u.status === "invited" ? "invite" : "password_reset";
    const { token } = await issueToken(userId, type, viewer.userId);
    await db
      .update(passwordResetRequests)
      .set({ status: "approved", handledById: viewer.userId, handledAt: new Date() })
      .where(eq(passwordResetRequests.userId, userId));
    const emp = await db.query.employees.findFirst({ where: eq(employees.userId, userId), columns: { firstName: true, lastName: true } });
    await audit({
      actorUserId: viewer.userId,
      action: type === "invite" ? "user.invite_link" : "user.reset_link",
      entityType: "user",
      entityId: userId,
      summary: `Issued ${type === "invite" ? "an activation" : "a password reset"} link for ${emp ? `${emp.firstName} ${emp.lastName}` : u.email}`,
    });
    // Email it to the employee too (best-effort, after the token is saved); HR still sees the link as a fallback.
    const mail = await emailAccessLink(userId, type, token, viewer.userId);
    return ok(
      mail.ok ? `Link created and emailed to the employee — valid ${tokenTtlLabel(type)}, single use.` : `Link created — valid ${tokenTtlLabel(type)}, single use. Email not sent: ${mail.message}`,
      { link: tokenUrl(token, await origin()), type, emailed: mail.ok ? "1" : "0", emailNote: mail.ok ? "" : mail.message },
    );
  });
}

/**
 * Changes the email an employee signs in with and receives portal email at
 * (account + directory address together). If they haven't activated yet, a
 * fresh activation link goes to the NEW address; earlier links stop working.
 */
export async function changeAccountEmailAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const { email } = parseForm(accountEmailSchema, fd);
    const changed = await changeAccountEmail(viewer, id, email);
    if (changed.status !== "invited" || fd.get("sendInvite") !== "on") {
      return ok(changed.status === "invited" ? "Email address changed. Use “Activation link” to send them a new link." : "Email address changed. They now sign in with the new address.");
    }
    // The change is committed; the new invitation is best-effort and can't undo it.
    const { token } = await issueToken(changed.userId, "invite", viewer.userId);
    const mail = await emailAccessLink(changed.userId, "invite", token, viewer.userId);
    if (mail.ok) return ok("Email address changed and a new activation link was emailed to it (valid 7 days).");
    // Nobody received this link, so don't leave it usable.
    await revokeToken(token);
    return ok(`Email address changed, but the activation email wasn't sent (${mail.message}). Use “Activation link” to get a link for them.`);
  });
}

/* ------------------------------------------------------------ bulk import */

type ImportColumn = "first_name" | "last_name" | "email" | "role" | "department" | "designation" | "manager_email" | "joining_date" | "employment_type" | "phone" | "work_location";

/**
 * Bulk import from CSV. Each valid row creates an employee + invited
 * account; rows with problems are skipped and reported. Returns a CSV of
 * activation links for HR to distribute.
 */
export async function importEmployeesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    assertCan(viewer, "employees.manage");
    assertCan(viewer, "users.invite");
    const file = fileFrom(fd, "file");
    if (!file) return fail("Choose a CSV file.");
    if (file.size > 1024 * 1024) return fail("The CSV must be under 1 MB.");
    const rows = parseCsv(await file.text());
    if (rows.length < 2) return fail("The CSV has no data rows.");
    const header = rows[0]!.map((h) => h.trim().toLowerCase());
    const missing = ["first_name", "email", "joining_date"].filter((c) => !header.includes(c));
    if (missing.length) return fail(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Download the template for the expected format.`);
    if (rows.length > 501) return fail("Import at most 500 employees at a time.");

    const [depts, desigs] = await Promise.all([db.select().from(departments), db.select().from(designations)]);
    const base = await origin();
    const results: string[][] = [["row", "email", "result", "activation_link"]];
    let created = 0;
    const pendingManagers: { employeeId: string; managerEmail: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const get = (col: ImportColumn) => (rows[i]![header.indexOf(col)] ?? "").trim();
      const email = get("email").toLowerCase();
      try {
        const roleKey = get("role").toLowerCase().replace(/\s+/g, "_") || "employee";
        assertCanAssignRole(viewer, roleKey);
        const dept = get("department") ? depts.find((d) => d.name.toLowerCase() === get("department").toLowerCase() || d.code.toLowerCase() === get("department").toLowerCase()) : undefined;
        if (get("department") && !dept) throw new AppError(`Unknown department "${get("department")}"`);
        const desig = get("designation") ? desigs.find((d) => d.title.toLowerCase() === get("designation").toLowerCase()) : undefined;
        if (get("designation") && !desig) throw new AppError(`Unknown designation "${get("designation")}"`);
        const input = parseForm(
          createSchema,
          (() => {
            const f = new FormData();
            f.set("firstName", get("first_name"));
            f.set("lastName", get("last_name"));
            f.set("email", email);
            f.set("roleKey", roleKey);
            f.set("joiningDate", get("joining_date"));
            f.set("employmentType", get("employment_type") || "full_time");
            f.set("employmentStatus", "probation");
            if (get("phone")) f.set("phone", get("phone"));
            if (get("work_location")) f.set("workLocation", get("work_location"));
            return f;
          })(),
        );
        const res = await createEmployeeWithAccount(
          { ...input, departmentId: dept?.id ?? null, designationId: desig?.id ?? null, managerId: null },
          viewer.userId,
        );
        if (get("manager_email")) pendingManagers.push({ employeeId: res.employeeId, managerEmail: get("manager_email").toLowerCase() });
        results.push([String(i + 1), email, "created", tokenUrl(res.invite.token, base)]);
        created++;
      } catch (e) {
        const msg =
          e instanceof AppError || e instanceof AccountError || e instanceof ForbiddenError
            ? e.message
            : e && typeof e === "object" && "fieldErrors" in e
              ? Object.entries((e as { fieldErrors: Record<string, string[]> }).fieldErrors).map(([k, v]) => `${k}: ${v.join(" ")}`).join("; ")
              : "Could not create";
        results.push([String(i + 1), email, `skipped: ${msg}`, ""]);
      }
    }

    // Managers are resolved after all rows exist, so a CSV can reference people later in the file.
    for (const pm of pendingManagers) {
      const mgr = await db.query.employees.findFirst({ where: eq(employees.officialEmail, pm.managerEmail), columns: { id: true } });
      if (mgr && mgr.id !== pm.employeeId) await db.update(employees).set({ managerId: mgr.id }).where(eq(employees.id, pm.employeeId));
    }

    await audit({ actorUserId: viewer.userId, action: "employee.import", entityType: "employee", summary: `Imported ${created} employee${created === 1 ? "" : "s"} from CSV`, metadata: { rows: rows.length - 1, created } });
    return ok(`${created} of ${rows.length - 1} rows imported. Download the results for activation links.`, { csv: toCsv(results), created: String(created) });
  });
}
