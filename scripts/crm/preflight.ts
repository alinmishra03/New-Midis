/**
 * Read-only production preflight for the employee portal. Writes nothing.
 *
 *   npx tsx --env-file=<pulled env file> scripts/crm/preflight.ts
 *
 * Reports which variables are set (never their values), whether
 * DATABASE_URL reaches PostgreSQL and what is already in it, whether the
 * Blob read-write token can list its store, and whether CRM_BASE_URL is a
 * clean https origin. Exits non-zero if anything required is missing or
 * unreachable.
 */
import { Pool } from "pg";
import { list } from "@vercel/blob";

const REQUIRED = ["DATABASE_URL", "BLOB_READ_WRITE_TOKEN", "CRM_BASE_URL"] as const;
let problems = 0;
const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string) => {
  problems++;
  console.log(`  ✗ ${m}`);
};

async function main() {
  console.log("\nEnvironment variables");
  for (const k of REQUIRED) (process.env[k] ? ok : bad)(`${k} ${process.env[k] ? "is set" : "is MISSING"}`);
  for (const k of ["BLOB_STORE_ID", "DATABASE_URL_UNPOOLED"]) if (process.env[k]) ok(`${k} is set (optional)`);

  console.log("\nDatabase");
  const url = process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    (u.hostname.endsWith(".neon.tech") ? ok : bad)(`host is ${u.hostname.endsWith(".neon.tech") ? "Neon" : `not Neon (${u.hostname.split(".").slice(-2).join(".")})`}${u.hostname.includes("-pooler") ? ", pooled endpoint" : ", direct endpoint"}`);
    (u.searchParams.get("sslmode") === "require" || u.searchParams.get("sslmode") === "verify-full" ? ok : bad)(`sslmode=${u.searchParams.get("sslmode") ?? "(none)"}`);
    const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000 });
    try {
      const v = await pool.query("select current_database() as db, current_user as usr, split_part(version(), ' ', 2) as ver, current_setting('TimeZone') as tz");
      ok(`connected: database "${v.rows[0].db}", PostgreSQL ${v.rows[0].ver}, server TimeZone ${v.rows[0].tz}`);
      const t = await pool.query("select table_schema, count(*)::int as n from information_schema.tables where table_schema in ('public','drizzle') group by table_schema");
      const n = (s: string) => t.rows.find((r) => r.table_schema === s)?.n ?? 0;
      console.log(`  · tables: public=${n("public")}, drizzle=${n("drizzle")}`);
      if (n("drizzle")) {
        const m = await pool.query("select count(*)::int as n, max(created_at) as last from drizzle.__drizzle_migrations");
        console.log(`  · migrations applied: ${m.rows[0].n}`);
      } else console.log("  · migrations applied: none (fresh database)");
      if (n("public") && !n("drizzle")) {
        const names = await pool.query("select table_name from information_schema.tables where table_schema='public' order by 1 limit 20");
        bad(`public schema already has ${n("public")} table(s) not created by these migrations: ${names.rows.map((r) => r.table_name).join(", ")} — migrate would stop on any name clash (nothing would be changed)`);
      }
    } catch (e) {
      const err = e as Error & { code?: string; errors?: { code?: string }[] };
      bad(`could not connect: ${err.message || err.code || err.errors?.map((x) => x.code).join(", ") || "unknown error"}`);
    } finally {
      await pool.end();
    }
  }

  console.log("\nBlob storage");
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const storeId = token.split("_")[3];
    const envStore = process.env.BLOB_STORE_ID?.replace(/^store_/, "");
    if (storeId && envStore) (storeId.toLowerCase() === envStore.toLowerCase() ? ok : bad)(`token store ${storeId.toLowerCase() === envStore.toLowerCase() ? "matches" : "DIFFERS from"} BLOB_STORE_ID`);
    try {
      const r = await list({ limit: 5, token });
      ok(`token can list the store (${r.blobs.length}${r.hasMore ? "+" : ""} object(s))`);
    } catch (e) {
      bad(`token could not list the store: ${(e as Error).message}`);
    }
    console.log("  · access mode: confirm “Private” on the store in the Vercel dashboard; uploads use access: 'private' and fail loudly on a public store");
  }

  console.log("\nCRM_BASE_URL");
  const base = process.env.CRM_BASE_URL;
  if (base) {
    try {
      const u = new URL(base);
      (u.protocol === "https:" && (u.pathname === "/" || u.pathname === "") && !u.search ? ok : bad)(`${u.origin}${u.protocol !== "https:" ? " is not https" : u.pathname !== "/" ? " has a path — use the bare origin" : ""}`);
    } catch {
      bad("is not a valid URL");
    }
  }

  console.log(problems ? `\n${problems} problem(s) found.\n` : "\nAll checks passed. Nothing was written.\n");
  process.exitCode = problems ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
