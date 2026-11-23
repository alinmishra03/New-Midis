/**
 * Read-only production preflight for the employee portal. Writes nothing.
 *
 * Run it in your own PowerShell window (not through a chat or CI log):
 *
 *   npx tsx scripts/crm/preflight.ts
 *
 * Secrets are never passed on the command line or written anywhere.
 * DATABASE_URL and BLOB_READ_WRITE_TOKEN are read from the environment if
 * present and non-empty; otherwise the script asks for them with hidden
 * input (nothing is echoed). Paste them from the Neon console and the Blob
 * store's settings. BLOB_STORE_ID and CRM_BASE_URL are not secret and are
 * asked for visibly (Enter skips them).
 *
 * Guarantees:
 * - No secret value is printed: every message is scrubbed of both secrets
 *   before output, including error messages.
 * - Database access runs inside BEGIN TRANSACTION READ ONLY … ROLLBACK, so
 *   PostgreSQL itself rejects any write.
 * - Blob access is list() only.
 * - Nothing is written to disk.
 *
 * Exits non-zero if anything required is missing or unreachable.
 */
import { Pool } from "pg";
import { list } from "@vercel/blob";

const secrets: string[] = [];
const redact = (s: string) => secrets.reduce((acc, v) => (v ? acc.split(v).join("[redacted]") : acc), s);

let problems = 0;
const say = (m: string) => console.log(redact(m));
const ok = (m: string) => say(`  ✓ ${m}`);
const bad = (m: string) => {
  problems++;
  say(`  ✗ ${m}`);
};
const errText = (e: unknown) => {
  const err = e as { message?: string; code?: string; errors?: { code?: string }[] };
  return redact(err?.message || err?.code || err?.errors?.map((x) => x.code).join(", ") || "unknown error");
};

/** Reads a line from the terminal without echoing it. */
function promptHidden(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error("hidden input needs an interactive terminal"));
    process.stdout.write(`${label} (input hidden): `);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value.trim());
        }
        if (ch === "\u0003") {
          // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** Visible prompt for non-secret values. */
function promptVisible(label: string): Promise<string> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve("");
    process.stdout.write(`${label}: `);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (d: string) => {
      process.stdin.pause();
      resolve(d.trim());
    });
  });
}

async function value(name: string, secret: boolean, hint: string) {
  const fromEnv = process.env[name]?.trim();
  if (fromEnv) return fromEnv;
  if (!process.stdin.isTTY) return "";
  return secret ? promptHidden(`${name} — ${hint}`) : promptVisible(`${name} — ${hint} (Enter to skip)`);
}

async function main() {
  if (!process.stdin.isTTY && (!process.env.DATABASE_URL?.trim() || !process.env.BLOB_READ_WRITE_TOKEN?.trim())) {
    console.log("\nRun this in your own PowerShell window: it needs an interactive terminal to ask for secrets with hidden input.\n");
    process.exitCode = 1;
    return;
  }

  console.log("\nMIDIS employee portal — read-only production preflight\n");
  const url = await value("DATABASE_URL", true, "paste the Neon connection string");
  if (url) secrets.push(url);
  const token = await value("BLOB_READ_WRITE_TOKEN", true, "paste the Blob store's read-write token");
  if (token) secrets.push(token);
  const storeIdEnv = await value("BLOB_STORE_ID", false, "store ID from the Blob store settings");
  const base = await value("CRM_BASE_URL", false, "e.g. https://new-midis-ten.vercel.app");
  // Also scrub the password and token secret parts on their own, in case an error quotes a fragment.
  try {
    const pw = decodeURIComponent(new URL(url).password);
    if (pw) secrets.push(pw);
  } catch {
    /* validated below */
  }
  const tokenParts = token.split("_");
  if (tokenParts[4]) secrets.push(tokenParts[4]);

  console.log("\nValues");
  (url ? ok : bad)(`DATABASE_URL ${url ? "provided" : "MISSING"}`);
  (token ? ok : bad)(`BLOB_READ_WRITE_TOKEN ${token ? "provided" : "MISSING"}`);
  if (storeIdEnv) ok("BLOB_STORE_ID provided");
  (base ? ok : bad)(`CRM_BASE_URL ${base ? "provided" : "MISSING"}`);

  /* ------------------------------------------------------------- database */
  console.log("\nDatabase (read-only transaction)");
  if (url) {
    let u: URL | null = null;
    try {
      u = new URL(url);
    } catch {
      bad("DATABASE_URL is not a valid connection URL");
    }
    if (u) {
      const neon = u.hostname.endsWith(".neon.tech");
      (neon ? ok : bad)(`host is ${neon ? "Neon" : "NOT Neon"}, ${u.hostname.includes("-pooler") ? "pooled" : "direct"} endpoint`);
      const ssl = u.searchParams.get("sslmode");
      (ssl === "require" || ssl === "verify-full" ? ok : bad)(`sslmode=${ssl ?? "(none)"}`);

      const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000 });
      pool.on("error", () => undefined);
      let client;
      try {
        client = await pool.connect();
        await client.query("BEGIN TRANSACTION READ ONLY");
        const v = await client.query("select current_database() as db, split_part(version(), ' ', 2) as ver, current_setting('transaction_read_only') as ro");
        ok(`connected to database "${v.rows[0].db}", PostgreSQL ${v.rows[0].ver} (transaction_read_only=${v.rows[0].ro})`);
        const t = await client.query("select table_schema, count(*)::int as n from information_schema.tables where table_schema in ('public','drizzle') group by table_schema");
        const n = (s: string) => t.rows.find((r) => r.table_schema === s)?.n ?? 0;
        say(`  · tables: public=${n("public")}, drizzle=${n("drizzle")}`);
        if (n("drizzle")) {
          const m = await client.query("select count(*)::int as n from drizzle.__drizzle_migrations");
          say(`  · migrations already applied: ${m.rows[0].n}`);
        } else {
          say("  · migrations already applied: none (fresh database)");
        }
        if (n("public") && !n("drizzle")) {
          const names = await client.query("select table_name from information_schema.tables where table_schema='public' order by 1 limit 20");
          bad(`public schema already has ${n("public")} table(s) not created by these migrations (${names.rows.map((r) => r.table_name).join(", ")}). Migrate would stop on a name clash and change nothing.`);
        } else if (!n("public")) {
          ok("public schema is empty: ready for the first migration");
        }
      } catch (e) {
        bad(`database check failed: ${errText(e)}`);
      } finally {
        if (client) {
          await client.query("ROLLBACK").catch(() => undefined);
          client.release();
        }
        await pool.end().catch(() => undefined);
      }
    }
  }

  /* ----------------------------------------------------------------- blob */
  console.log("\nBlob storage (list only)");
  if (token) {
    const looksRight = tokenParts.length >= 5 && tokenParts[0] === "vercel" && tokenParts[1] === "blob" && tokenParts[2] === "rw";
    (looksRight ? ok : bad)(looksRight ? "token has the read-write format" : "token is not a Blob read-write token (expected vercel_blob_rw_…)");
    const tokenStore = tokenParts[3]?.toLowerCase();
    if (storeIdEnv && tokenStore) {
      const same = storeIdEnv.replace(/^store_/i, "").toLowerCase() === tokenStore;
      (same ? ok : bad)(same ? "token belongs to the same store as BLOB_STORE_ID" : "token belongs to a DIFFERENT store than BLOB_STORE_ID");
    } else if (!storeIdEnv) {
      say("  · BLOB_STORE_ID not given: store consistency not checked");
    }
    try {
      const r = await list({ limit: 5, token });
      ok(`token can list its store (${r.blobs.length}${r.hasMore ? "+" : ""} object(s))`);
    } catch (e) {
      bad(`token could not list its store: ${errText(e)}`);
    }
    say("  · access mode: the store must show “Private” in the Vercel dashboard (uploads request private access and fail on a public store)");
  }

  /* --------------------------------------------------------- base url */
  console.log("\nCRM_BASE_URL");
  if (base) {
    try {
      const u = new URL(base);
      const clean = u.protocol === "https:" && (u.pathname === "/" || u.pathname === "") && !u.search;
      (clean ? ok : bad)(clean ? `${u.origin}` : `${u.origin} must be a bare https origin`);
    } catch {
      bad("is not a valid URL");
    }
  }

  console.log(problems ? `\n${problems} problem(s) found. Nothing was written.\n` : "\nAll checks passed. Nothing was written.\n");
  process.exitCode = problems ? 1 : 0;
}

main().catch((e) => {
  console.error(`Preflight stopped: ${errText(e)}`);
  process.exitCode = 1;
});
