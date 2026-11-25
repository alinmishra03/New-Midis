# Google Sheets → CRM sync (Development team)

One-way sync from the Development team's Google Sheet into **Tasks & Projects**.
The sheet is never modified (read-only API scope), and nothing is ever deleted
from the CRM. Managed by Super Admins in **CRM → Settings → Integrations**.

## 1. Setup (once per environment)

1. In Google Cloud Console, create (or pick) a project and **enable the Google Sheets API**.
2. **IAM & Admin → Service Accounts → Create service account** (no roles needed).
3. On the service account, **Keys → Add key → JSON**. Keep the file private; never
   commit it or paste it in chat.
4. In the spreadsheet, **Share** it with the service account's email
   (`…@….iam.gserviceaccount.com`) as **Viewer**. Link sharing can then be
   turned off: the sync doesn't need public access.
5. In Vercel → Project → Settings → Environment Variables, add these as
   **Sensitive** variables (Preview first; Production only when approved):

| Variable | Value |
|---|---|
| `GOOGLE_SHEETS_CLIENT_EMAIL` | `client_email` from the JSON key |
| `GOOGLE_SHEETS_PRIVATE_KEY` | `private_key` from the JSON key (the full `-----BEGIN PRIVATE KEY-----…` text; `\n` escapes are fine) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | the ID in the sheet URL: `docs.google.com/spreadsheets/d/<ID>/edit` |
| `CRON_SECRET` | a random string of 16+ characters (Vercel sends it to the daily job) |

6. Redeploy. The Integrations page shows "Connected settings present" and, if
   anything is wrong, which variable (values are never shown).

Database: migration `drizzle/0001_google_sheets_sync.sql` adds four tables
(`sheet_sync_settings`, `sheet_sync_runs`, `sheet_sync_records`,
`sheet_sync_aliases`). It changes no existing table.

## 2. Schedule

- **Daily** at about 09:00 IST (`vercel.json`, `30 3 * * *` UTC). On the Vercel
  Hobby plan cron jobs run at most once a day and may fire any time within
  that hour. Vercel runs cron jobs on **Production deployments only**.
- **Automatic import is off by default**: the daily run only *checks* the sheet
  until a Super Admin turns it on.
- **Check sheet (no import)** and **Sync now** on the Integrations page run on demand.
- Each run retries temporary Google errors (3 attempts); a failed run is
  recorded with its reason and the next run tries again. One run at a time.

## 3. What goes where

| Sheet | CRM |
|---|---|
| **All Website** (main project list) | One Development project per name; URL, Environment and Development Status in the description; Development Status → status (Completed → completed, Ongoing → active, Close Site / Store Closed → archived, blank + On Hold → on hold, blank → planning + "status not set"); Frontend/Backend Developers → project members. No owner, lead or dates are invented. |
| **Client Reviewed website** | Same project if the name is in All Website; otherwise a new project. |
| **Daily Work Update** | Rows with the same **project + developer + Start Date** form one task (title from the first row; status, priority and due date from the latest rows). Every row becomes a **dated update (comment) by that developer**. Two rows of a group on the same day, or with different End Dates, go to review as possibly different deliverables. |

Names match across case, spaces and punctuation only ("Silver-One" = "SilverOne").
"HE Capitals Website" is *not* assumed to be "HE Capitals": it goes to review,
where a Super Admin maps the name once for every row that uses it.

People are matched only to **Development** employees with exactly that full
name. "Jai" (first name only), people not in the CRM, and people in other
departments go to review. The sync never creates employees or accounts.

## 4. Ownership and conflicts

- The sheet owns only the fields it supplies (project name/description/status;
  task title/description/status/priority/due date/assignee).
- If a field is edited in the CRM and the sheet doesn't change it, the CRM
  value stays. If both change, it's a **conflict** in the review queue
  (Super Admin chooses the sheet's or the CRM's value).
- Comments, attachments and anything else added in the CRM are never touched.
  Sheet updates become comments once and are never edited afterwards.
- A row that disappears from the sheet is flagged; nothing is deleted. A task
  or project deleted in the CRM is not recreated.
- Rows are identified by content, not position: sorting or moving rows never
  creates duplicates. An edited row is flagged as a "possible edit" rather than
  imported as a second copy.

## 5. Review queue

Unknown/ambiguous people, unmatched or ambiguous project names, names that
clash with an existing CRM project, multiple projects or developers in one
row, missing start dates or statuses, unreadable dates (e.g. `23-11-12`),
non-project work ("learning back-end"), uncertain task matches, possible edits,
conflicts and removed rows. Decisions are applied on the next Check / Sync.

## 6. Permissions

Super Admin only: the Integrations page, Sync now, decisions and the
automatic-import switch (checked on the server). The daily endpoint
(`/crm/api/integrations/google-sheets/sync`) requires `CRON_SECRET`.
Imported projects and tasks follow the existing rules: developers see the
projects they're members of and their own tasks; HR keeps its existing
read-only "view all tasks"; other departments get no access.

## 7. Rollback

Every imported project and task is linked in `sheet_sync_records` and has an
`project.import` / `task.import` audit entry with the run's time, so an import
can be identified exactly. Neon's point-in-time restore covers the database
as a whole.
