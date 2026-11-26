# Automatic check-out at 7:00 PM

Anyone who checked in and hasn't checked out is checked out automatically at
**19:00 Asia/Kolkata**, every day, by a server-side scheduled job. No browser,
HR or admin action is needed.

## What it does

For **today's** records only (never earlier days):

| Situation | Result |
|---|---|
| Checked in at or before 19:00, no check-out | Check-out set to **19:00**, marked automatic |
| Already checked out (by the employee, HR or a correction) | Unchanged |
| No check-in | Nothing (no record is created) |
| Gaurav Sharma, Sagar Bakshi (attendance-exempt, matched by code **and** name) | Excluded |
| Checked in after 19:00, or a break started/ended after 19:00 | Left alone (still working) |

- The check-in time is never changed. A break still open at 19:00 ends at 19:00
  (as with a manual check-out). Worked time, half/full day and early leave are
  recalculated with the normal rules, using 19:00 as the check-out.
- Each automatic check-out is audit-logged (`attendance.auto_check_out`, by the
  system) and the employee gets an in-app notification.
- Attendance correction requests are never read or changed. If one is approved
  later, its times apply and the record is no longer marked automatic.
- After an automatic check-out the employee can't check out again; a different
  time goes through a correction request.

## Where it shows

**Auto Checked Out** appears next to the check-out time in My attendance,
the team/everyone day view, the employee profile's attendance tab and the
dashboard check-in card. The attendance report has an **Auto check-outs**
column and total.

## Schedule and reliability

- `vercel.json` runs `GET /api/cron/auto-checkout` at 14:00 UTC (19:30 IST)
  and again at 16:30 UTC (22:00 IST) as a retry. On plans where Vercel runs a
  daily cron at any minute within the hour, the first run is still always after
  19:00; the time recorded is exactly 19:00 regardless of when the job runs.
- The endpoint requires `Authorization: Bearer <CRON_SECRET>` (Vercel sends it
  automatically when `CRON_SECRET` is set). Without the variable every call is
  refused. Vercel runs crons on Production deployments only.
- Idempotent: a record is only updated while its check-out is empty, so repeated
  or overlapping runs change nothing. Each record is its own transaction.
- A failed record is logged (`[auto-checkout] … FAILED`), left unchanged and
  retried by the next run; the endpoint then answers 500 so the failure shows in
  Vercel's cron logs. Success is only logged after the change is committed.

## Database

Migration `0003_auto_checkout` adds `attendance_records.check_out_source`
(null, or `auto` when set by this job). Additive only; existing rows are not
changed.
