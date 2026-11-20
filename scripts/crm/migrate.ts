/**
 * Applies pending migrations from ./drizzle.
 *
 *   npm run db:migrate                       # local embedded database
 *   DATABASE_URL=postgres://… npm run db:migrate   # Neon / production
 */
import path from "node:path";
import { closeDb, migrateDb } from "@/crm/db";

const target = process.env.DATABASE_URL ? "DATABASE_URL" : "the local embedded database (.data/pglite)";
console.log(`Applying migrations to ${target}…`);

migrateDb(path.join(process.cwd(), "drizzle"))
  .then(() => console.log("Migrations are up to date."))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
