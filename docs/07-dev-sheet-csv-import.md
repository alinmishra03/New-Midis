# Development team sheet → CRM (CSV import)

The Development team's Google Sheet is brought into **Tasks & Projects** by
uploading its three tabs as CSV files in **CRM → Settings → Integrations**
(Super Admin only). It's free: no Google Cloud project, API, service account,
credentials, Apps Script or scheduled job. The sheet is never changed, and
nothing in the CRM is ever deleted.

## 1. Export the three tabs

In Google Sheets, for **each** tab — *All Website*, *Client Reviewed website*
and *Daily Work Update*:

1. Click the tab so it's the one showing.
2. **File → Download → Comma-separated values (.csv)**. Only the visible tab is
   exported, so repeat this for each of the three tabs.

From Excel: **File → Save As → CSV UTF-8 (Comma delimited)** per sheet.
"CSV (Comma delimited)", semicolon-separated CSV (some locales) and UTF-16 are
also accepted. `.xlsx` workbooks are not: export to CSV first.

Limits: `.csv` files up to 900 KB each, 20,000 rows, 100 columns.

## 2. Upload, preview, import

1. **Settings → Integrations → CSV Import**: upload each file into its own box
   (*All Website*, *Client Reviewed website*, *Daily Work Update*). Each file is
   read and checked on the server, then shown below its upload box as a
   spreadsheet: the file's own headings and cells exactly as uploaded (blank
   cells stay blank, dates and long descriptions unchanged), numbered by sheet
   row, with search, status filters, paging and expandable long text. A file
   with missing columns is rejected with their names. Extra columns are shown
   but not imported; columns with no heading and no values are left out.
2. **Preview import**: fills the separate **Import status** column of every
   row (Ready, Imported, Needs review, Duplicate, Ignored) with the reason, and
   shows a summary of what would be created or matched. Nothing is imported.
3. Resolve flagged rows from the row itself (**Resolve**, see 5), then
   **Preview** again.
4. **Import previewed changes**: applies exactly what was previewed, in one
   transaction (all or nothing). It's refused if the files, review decisions or
   mappings changed after the preview, or another run happened since.

Repeat whenever the sheet changes. Uploading the same files again, or the same
rows in a different order, never duplicates anything.

Required columns (headings are matched by name, any order, any case; the
heading row may be below blank rows):

| Tab | Columns |
|---|---|
| All Website, Client Reviewed website | Project Name, Project URL, Frontend Developer, Backend Developer, Environment Status, Development Status |
| Daily Work Update | Date, Project Name, Start Date, End Date, Project URL, Frontend Developer, Backend Developer, Daily Task / Deliverable, Priority, Status |

## 3. What goes where

| Sheet | CRM |
|---|---|
| **All Website** (main project list) | One Development project per name; URL, environment and development status in the description; Development Status → status (Completed → completed, Ongoing → active, Close Site / Store Closed → archived, blank + On Hold → on hold, blank → planning + "status not set"); Frontend/Backend Developers → members. No owner, lead or dates are invented. |
| **Client Reviewed website** | Same project when the name is in All Website (its developers are added as members); otherwise a new project. |
| **Daily Work Update** | Rows with the same **project + developer + Start Date** form one task (title from the first row; status, priority and due date from the latest rows). Every row becomes a **dated update (comment) by that developer**, with its status, priority, end date and URL. Two rows of a group on the same day, or with different End Dates, go to review as possibly different deliverables. |

Project names match across case, spaces, underscores and punctuation
("Silver-One" = "SilverOne"). Suffixes like *Website*, *Frontend*, *Backend*
("MTC_BACKEND" → "MTC") are dropped only when that leaves exactly one project;
otherwise the name goes to review (e.g. "HE Capitals Website", because there
are two different "HE Capitals" rows).

People are matched only to **Development** employees with exactly that full
name. "Jai" (first name only), people not in the CRM and people in other
departments go to review. Employees and accounts are never created.

## 4. Ownership, edits and deletions

- The CSV owns only the fields it supplies (project name/description/status;
  task title/description/status/priority/due date/assignee). CRM edits of those
  fields are kept unless the sheet changes the same field too — then it's a
  **conflict** for review (keep the sheet's or the CRM's value).
- Comments, attachments and anything else added in the CRM are never touched.
  Each daily row becomes a comment once and is never edited afterwards.
- Rows are identified by their content, not their position. A project row
  whose URL or developers change updates the same project. An edited daily row
  is flagged as a "possible edit" instead of being added twice. A row already
  imported stays with its task even if its start date is changed later.
- A row that disappears from a file is flagged ("no longer in the sheet");
  nothing is deleted. A project or task deleted in the CRM isn't recreated.

## 5. Flagged rows

Unknown or ambiguous people; unmatched, ambiguous or edited project names;
names that clash with an existing CRM project; several projects or developers
in one row; missing start dates, statuses or required fields; unreadable dates
(`23-11-12`, `05-11-2026`); non-project work ("learning back-end"); uncertain
task matches; possible edits; conflicts; removed rows.

Each flagged row shows its reason in the Import status column; **Resolve**
opens a compact editor under the row. The uploaded cells are never edited:
when a name is matched to an employee or project, the CRM value is shown
under the original value (“→ …”) and the mapping is stored separately. Items
that aren't on any uploaded row (e.g. a row imported earlier and since removed
from the sheet) are listed under **Other items to review**.

A Super Admin can map a sheet name to a Development employee or project
(saved and reused by every later import), link or create projects, import a
row as its own task or as an update to an existing task (with a chosen
project, person or date), keep the sheet's or the CRM's value, or skip a row.

## 6. Permissions and security

- Super Admin only: the page, uploads, preview, import and every decision
  (checked on the server in each action). Other roles get "not found".
- Files are validated on the server (extension, type, size, encoding,
  structure, required columns). The cells are parsed by the server and stored
  in `sheet_sync_uploads`; nothing the browser sends is trusted as data.
- Imported projects and tasks follow the existing rules: developers see the
  projects they're members of and their own tasks; HR keeps its existing
  read-only "view all tasks"; other departments get no access.

## 7. Database

- `0001_google_sheets_sync`: `sheet_sync_runs` (history), `sheet_sync_records`
  (row ↔ CRM record links, last-seen values, review state),
  `sheet_sync_aliases` (saved mappings), `sheet_sync_settings` (left from the
  earlier Google API version; unused, kept so no data is dropped).
- `0002_csv_import`: `sheet_sync_uploads` (the current file per tab) and
  `sheet_sync_runs.files` (files used by each run). Additive only.

## 8. Rollback

Every imported project and task is linked in `sheet_sync_records` and has a
`project.import` / `task.import` audit entry at the import's time, so an import
can be identified exactly. Neon's point-in-time restore covers the database
as a whole.
