import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * The CRM database.
 *
 * - With DATABASE_URL set (production on Vercel → Neon), a pooled
 *   node-postgres connection.
 * - Without it, in development only, an embedded PostgreSQL (PGlite) stored
 *   in .data/pglite — real Postgres semantics with nothing to install.
 *
 * Both are PostgreSQL behind the same Drizzle query builder, so the code that
 * runs locally is the code that runs in production. The client is created on
 * first use rather than at import, so `next build` (which imports every route
 * module) never opens a database.
 */
export type Database = NodePgDatabase<typeof schema>;
/** A transaction handle; accepts the same queries as `db`. */
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

type Holder = { db?: Database; pool?: Pool; pglite?: PGlite };
const holder: Holder = ((globalThis as { __midisCrmDb?: Holder }).__midisCrmDb ??= {});

export const PGLITE_DIR = path.join(process.cwd(), ".data", "pglite");

function create(): Database {
  const url = process.env.DATABASE_URL;
  if (url) {
    holder.pool = new Pool({
      connectionString: url,
      // Serverless functions each hold their own pool; keep it small and let
      // Neon's pooled endpoint do the multiplexing.
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
    });
    return drizzlePg(holder.pool, { schema });
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production" && !process.env.CRM_ALLOW_EMBEDDED_DB) {
    throw new Error(
      "DATABASE_URL is not set. The employee portal needs a PostgreSQL database in production " +
        "(add Neon from the Vercel dashboard). The embedded database is for local development only.",
    );
  }

  mkdirSync(path.dirname(PGLITE_DIR), { recursive: true });
  holder.pglite = new PGlite(PGLITE_DIR);
  // Same query-builder API; the cast only unifies the driver-specific result type.
  return drizzlePglite(holder.pglite, { schema }) as unknown as Database;
}

function real(): Database {
  return (holder.db ??= create());
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const target = real();
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

/** For CLI scripts: run migrations with the driver-appropriate migrator. */
export async function migrateDb(migrationsFolder: string) {
  const target = real();
  if (holder.pglite) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(target as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(target, { migrationsFolder });
  }
}

/** For CLI scripts: close connections (and flush the embedded database to disk). */
export async function closeDb() {
  await holder.pool?.end();
  await holder.pglite?.close();
  holder.db = holder.pool = holder.pglite = undefined;
}

export { schema };
