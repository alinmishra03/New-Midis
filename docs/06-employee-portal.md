# Employee Portal (CRM + HRMS)

The internal employee portal lives at **`/crm`** inside this same Next.js app. It is separate from the public site:
its own layout and theme, no marketing header/footer, and no analytics. The only link from the public site is
"Employee Portal" in the footer's bottom row. `/crm` is `noindex` and disallowed in `robots.txt`.

## Modules

| Module | What it does | Who |
|---|---|---|
| Dashboard | Role-aware: my day (check-in, month summary, leave balance), plus company / HR / team / payroll sections | Everyone |
| Employees | Directory, profiles (tabbed), add/edit/deactivate, CSV import & export, photos | Everyone (directory); HR manages |
| Attendance | Server-timestamped check-in/out, breaks, calendar, team day view, corrections with approval and audit | Everyone; managers/HR review |
| Leave | Apply (half days, documents), balances, approvals, cancellation, team calendar, HR balance adjustments | Everyone; managers/HR approve |
| Work From Home | Requests, approvals, calendar, remote attendance | Everyone; managers/HR approve |
| Tasks & Projects | Projects, members, tasks (board), comments, attachments, activity | Everyone; managers create projects |
| Payroll | Salary structures, monthly runs, adjustments, approvals, PDF payslips | Everyone sees own payslips; HR/Finance |
| Performance | Review cycles, self-assessment, manager review, goals | Everyone; managers/HR |
| Recruitment | Openings, candidates, interviews & feedback, hire → employee + onboarding checklist | HR |
| Documents | Employee documents, company policies, HR-only files | Everyone (own); HR manages |
| Calendar | Meetings, company events, holidays, leave, WFH, birthdays & anniversaries | Everyone |
| Announcements | Company/HR/department posts, pinning, importance, drafts | Everyone reads; HR publishes |
| Reports | Headcount, attendance, late arrivals, leave, joining & exits, tasks, performance, payroll — CSV & PDF | Managers (team), HR/Admin (all), Finance (payroll) |
| Settings | Company, departments, designations, work schedules & attendance rules, leave policy, payroll policy, notifications, users, roles & permissions, audit log | Admin/HR |

## Roles

Five system roles are seeded. A Super Admin can change any role's permissions (except Super Admin, which always
has everything) and create new roles in **Settings → Roles & permissions**.

| Role | Default access beyond their own records |
|---|---|
| Employee | Nothing extra |
| Manager | Their reporting tree (direct and indirect): profiles, attendance, leave/WFH approval, reviews, team reports; create projects |
| HR | All employee records and HR operations; view payroll; settings |
| Finance | Payroll: structures, runs, approvals; company reports |
| Super Admin | Everything |

Every signed-in person can always see and act on **their own** records. That is an ownership check, not a
permission.

## Security model

- **Authentication:** Passwords are hashed with scrypt (N=2¹⁵, r=8, p=1; parameters stored per hash). Logins
  take the same time whether or not the email exists. After 5 failures the account locks for 15 minutes.
- **Sessions:** Sessions live in the database, and the cookie holds only a random 256-bit token. The database
  stores just its SHA-256. The cookie is HttpOnly, SameSite=Lax, Secure in production, and limited to path
  `/crm`, so the public site never receives it.
  - "Remember me" lasts 30 days.
  - Otherwise the session ends after 8 hours idle, or 24 hours at most.
  - Changing a password, resetting it, or being deactivated signs the person out everywhere.
- **Accounts:** No self-registration.
  - The first Super Admin is created from the command line (see below). Everyone else is created by HR.
  - New accounts start as invited. People set their own password through a one-time, hashed link that expires
    after 7 days. Reset links expire after 1 hour.
  - HR can issue links only for Employee and Manager accounts. HR, Finance and Super Admin accounts need a
    Super Admin, so HR cannot take over an admin account.
  - The last active Super Admin can't be demoted or deactivated.
- **Authorisation:** Every page, Server Action and route handler resolves the viewer through
  `src/crm/auth/dal.ts` and checks permissions and reporting-line scope next to the data.
  - Navigation hiding is cosmetic.
  - Personal and salary fields are selected only for viewers allowed to see them, so they never reach the page
    otherwise.
  - Forbidden pages and records return 404, so the response doesn't confirm that they exist.
- **Separation of duties:** Nobody approves their own leave, WFH, attendance correction, or pay adjustment.
  Payroll runs are approved by someone other than whoever generated them. Super Admin is the only exception.
- **Payroll:**
  - Nothing is deducted unless HR/Finance configured it, as one of:
    - a deduction on the employee's salary structure;
    - a company standard deduction (none by default);
    - an approved one-off adjustment.
  - Loss-of-pay and proration are a company policy switch, off by default.
  - Employees see payslips only after approval.
- **Files:**
  - **Storage:** Files are stored privately (Vercel Blob with private access in production, `.data/uploads`
    locally). Storage keys are random, and nothing has a public URL.
  - **Uploads:** Every upload is checked for size (10 MB), type and file signature.
  - **Downloads:** Files are served only by `/crm/api/files/[id]` after checking access to the record that owns
    the file, with `nosniff`, `no-store` and a sandbox CSP.
- **Attendance:** All timestamps are taken on the server, and working days are computed in the company
  timezone.
  - One record per person per day, enforced by a unique index.
  - Employees can't edit their attendance. Corrections need approval and keep the previous times.
- **Headers:** Every `/crm` response sets `Cache-Control: no-store`, `Referrer-Policy: no-referrer`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `X-Robots-Tag: noindex`.
- **CSRF:** Server Actions are POST-only with Origin/Host checking (built into Next.js). The session cookie is
  SameSite=Lax.
- **Audit log:** Sign-ins, failed sign-ins and lockouts are logged, as are approvals, record changes, role and
  permission changes, payroll actions, exports, and HR views of other people's payslips. Entries are visible in
  **Settings → Audit log**. Salary figures, passwords and tokens are never written to it.

## Running locally

```bash
npm install
npm run db:migrate          # creates .data/pglite (embedded PostgreSQL) and applies migrations
npm run db:seed             # roles, permissions, leave types, departments, default schedule, fixed holidays
npm run crm:create-admin -- --email=you@midis.in --first=Your --last=Name
npm run dev                 # open the printed activation link, set a password, sign in at /crm
```

Stop `npm run dev` before running the `db:*` or `crm:*` scripts. The embedded database allows only one process
at a time.

## Deploying to Vercel (production)

1. **Database:** In the Vercel dashboard go to **Storage → Create → Neon (Postgres)** and connect it to this
   project. This sets `DATABASE_URL`; use the *pooled* connection string.
2. **File storage:** Go to **Storage → Create → Blob** and create the store with **private** access. This sets
   `BLOB_READ_WRITE_TOKEN`.
3. **Base URL:** Set `CRM_BASE_URL` to the production origin, for example `https://new-midis-ten.vercel.app`.
   It's used in printed activation links.
4. **Migrate and seed:** From your machine, using the production `DATABASE_URL`, run:
   ```bash
   DATABASE_URL="postgres://…" npm run db:migrate
   DATABASE_URL="postgres://…" npm run db:seed
   DATABASE_URL="postgres://…" CRM_BASE_URL="https://new-midis-ten.vercel.app" npm run crm:create-admin -- --email=… --first=…
   ```
5. **Deploy.** The portal refuses to start in production without `DATABASE_URL`, so it can never silently fall
   back to the embedded database.

Run `npm run db:generate` after changing `src/crm/db/schema.ts`, then commit the new migration in `/drizzle`.

## Before go-live: things MIDIS should confirm

These were seeded as sensible starting values, not as MIDIS policy:

- **Working hours:** the default schedule is 09:30–18:30, Monday–Friday, with 15 minutes' grace for lateness.
  Change it under **Settings → Policies & schedules**.
- **Leave quotas:** Casual 12, Sick 12 (document after 2 days), Earned 15 (carry forward up to 30), Optional
  Holiday 2, Unpaid unlimited. Annual Leave exists but is inactive.
- **Holidays:** only the fixed-date national holidays are seeded (26 Jan, 15 Aug, 2 Oct, 25 Dec). Add the
  festival holidays each year.
- **Payroll:** no standard deductions, and loss-of-pay is off. Configure PF, professional tax and similar either
  per employee or as a company policy.

## Known limitations

- **No outbound email yet.** Invites and password resets are one-time links that HR copies and sends. "Forgot
  password" queues a request for HR and notifies them. Adding an email provider later only needs a sender in
  `src/crm/auth/tokens.ts` and the forgot-password action.
- **Reminders arrive when someone opens the portal.** Meeting, due-task and birthday reminders are created when
  the person next opens the portal or the notification bell. They aren't pushed by a scheduler. A Vercel Cron
  job could call the same function.
- **Night shifts:** a check-out after midnight is attached to the previous day's record. Schedules themselves
  don't span midnight.
- **Leave year rollover:** carry-forward isn't applied automatically at year end. HR can adjust balances under
  Leave → Balances.
