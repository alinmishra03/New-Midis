import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/crm/db";
import { AppError } from "@/crm/lib/actions";

/**
 * The CSV import needs its own tables (migrations 0001 and 0002). When the code
 * is deployed before those migrations are applied, the Integrations page and
 * its actions must say so plainly instead of failing on a missing table.
 *
 * This is an explicit schema check, not error suppression: any other database
 * error still surfaces normally.
 */
const REQUIRED: { table: string; column?: string; migration: string }[] = [
  { table: "sheet_sync_runs", migration: "0001" },
  { table: "sheet_sync_records", migration: "0001" },
  { table: "sheet_sync_aliases", migration: "0001" },
  { table: "sheet_sync_uploads", migration: "0002" },
  { table: "sheet_sync_runs", column: "files", migration: "0002" },
];

export const IMPORT_NOT_READY =
  "The CSV import isn't available yet: its database update (migrations 0001 and 0002) hasn't been applied. Nothing else in the CRM is affected.";

export async function importSchemaStatus(): Promise<{ ready: boolean; missing: string[] }> {
  const result = await db.execute<{ table_name: string; column_name: string }>(
    sql`select table_name, column_name from information_schema.columns where table_schema = current_schema() and table_name in ('sheet_sync_runs', 'sheet_sync_records', 'sheet_sync_aliases', 'sheet_sync_uploads')`,
  );
  const rows = (result as unknown as { rows: { table_name: string; column_name: string }[] }).rows;
  const missing = REQUIRED.filter((r) => !rows.some((x) => x.table_name === r.table && (!r.column || x.column_name === r.column))).map((r) => `${r.column ? `${r.table}.${r.column}` : r.table} (migration ${r.migration})`);
  return { ready: missing.length === 0, missing };
}

/** For every import action: refuse clearly (and change nothing) until the migrations are applied. */
export async function assertImportReady() {
  if (!(await importSchemaStatus()).ready) throw new AppError(IMPORT_NOT_READY);
}
