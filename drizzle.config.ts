import { defineConfig } from "drizzle-kit";

/**
 * Generates SQL migrations for the employee portal from src/crm/db/schema.ts.
 * `npm run db:generate` writes them to ./drizzle; `npm run db:migrate`
 * applies them (scripts/crm/migrate.ts), to Neon when DATABASE_URL is set or
 * to the local embedded database otherwise.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/crm/db/schema.ts",
  out: "./drizzle",
  strict: true,
});
