/**
 * Provisions a Super Admin. This is the only way to create one from outside
 * the portal, and it requires shell access to the server environment —
 * nobody can register themselves as an administrator.
 *
 *   npm run crm:create-admin -- --email=name@midis.in --first=Name --last=Surname
 *
 * It prints a one-time activation link (valid 7 days) where the admin sets
 * their own password. No password is ever passed on the command line or
 * stored in shell history.
 *
 * Set CRM_BASE_URL to the deployed origin (e.g. https://new-midis-ten.vercel.app)
 * so the printed link points at production rather than localhost.
 */
import { closeDb } from "@/crm/db";
import { AccountError, createEmployeeWithAccount } from "@/crm/services/accounts";
import { tokenUrl } from "@/crm/auth/tokens";

function arg(name: string) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3).trim();
}

async function main() {
  const email = arg("email");
  const first = arg("first");
  const last = arg("last") ?? "";
  if (!email || !first || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Usage: npm run crm:create-admin -- --email=name@midis.in --first=Name [--last=Surname]");
    process.exitCode = 1;
    return;
  }

  const created = await createEmployeeWithAccount(
    { email, firstName: first, lastName: last, roleKey: "super_admin", employmentStatus: "active" },
    null,
  );
  const link = tokenUrl(created.invite.token, process.env.CRM_BASE_URL ?? "http://localhost:3000");
  console.log(`\nSuper Admin created: ${first} ${last} <${email.toLowerCase()}> (${created.employeeCode})`);
  console.log(`\nActivation link (single use, expires ${created.invite.expiresAt.toISOString()}):\n\n  ${link}\n`);
  console.log("Open it to set a password. Send it only to the person it is for.");
}

main()
  .catch((err) => {
    console.error(err instanceof AccountError ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closeDb);
