import "server-only";
import { createSign } from "node:crypto";

/**
 * Read-only Google Sheets access with a Google Cloud service account.
 *
 * Configuration (server-side environment variables only — never sent to the
 * browser, logged, or stored in the database):
 *   GOOGLE_SHEETS_CLIENT_EMAIL     service account email (…@….iam.gserviceaccount.com)
 *   GOOGLE_SHEETS_PRIVATE_KEY      its private key (PEM; "\n" escapes are accepted)
 *   GOOGLE_SHEETS_SPREADSHEET_ID   the Development team spreadsheet's ID
 *
 * The spreadsheet must be shared with the service account email as Viewer.
 * Scope is spreadsheets.readonly: this code can never change the sheet.
 */

const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://sheets.googleapis.com/v4/spreadsheets";
const TIMEOUT_MS = 15_000;

export type SheetsConfig = { clientEmail: string; privateKey: string; spreadsheetId: string };
export type SheetsStatus = { configured: boolean; problems: string[]; clientEmail: string | null; spreadsheetId: string | null };

export class SheetsError extends Error {
  constructor(
    message: string,
    /** Safe to show to a Super Admin: never contains tokens or key material. */
    public readonly safeMessage: string,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

function readConfig(): { config: SheetsConfig | null; status: SheetsStatus } {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim() ?? "";
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "";
  const privateKey = rawKey.replace(/\\n/g, "\n").trim();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ?? "";
  const problems: string[] = [];
  if (!clientEmail) problems.push("GOOGLE_SHEETS_CLIENT_EMAIL is not set.");
  else if (!/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(clientEmail)) problems.push("GOOGLE_SHEETS_CLIENT_EMAIL doesn't look like a service account email (…@….iam.gserviceaccount.com).");
  if (!privateKey) problems.push("GOOGLE_SHEETS_PRIVATE_KEY is not set.");
  else if (!/^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----$/.test(privateKey)) problems.push("GOOGLE_SHEETS_PRIVATE_KEY isn't a PEM private key (it should start with -----BEGIN PRIVATE KEY-----).");
  if (!spreadsheetId) problems.push("GOOGLE_SHEETS_SPREADSHEET_ID is not set.");
  else if (!/^[A-Za-z0-9_-]{20,100}$/.test(spreadsheetId)) problems.push("GOOGLE_SHEETS_SPREADSHEET_ID doesn't look like a spreadsheet ID.");
  const ok = problems.length === 0;
  return {
    config: ok ? { clientEmail, privateKey, spreadsheetId } : null,
    status: { configured: ok, problems, clientEmail: clientEmail || null, spreadsheetId: spreadsheetId || null },
  };
}

export function sheetsStatus(): SheetsStatus {
  return readConfig().status;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** A signed service-account JWT (RS256), exchanged for a short-lived access token. */
export function signServiceAccountJwt(config: Pick<SheetsConfig, "clientEmail" | "privateKey">, now = Math.floor(Date.now() / 1000)) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: config.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(config.privateKey, "base64url");
  } catch {
    throw new SheetsError("Invalid private key", "The service account private key couldn't be used. Check GOOGLE_SHEETS_PRIVATE_KEY.");
  }
  return `${header}.${claims}.${signature}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch with a timeout and up to 3 attempts for network errors, 429 and 5xx. */
async function request(url: string, init: RequestInit, label: string, delays = [1000, 3000]): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    let networkError = false;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      networkError = true;
    }
    const retryable = networkError || (res !== null && (res.status === 429 || res.status >= 500));
    if (!retryable) return res!;
    if (attempt >= delays.length) {
      throw new SheetsError(`${label}: ${networkError ? "network error" : `HTTP ${res!.status}`}`, `Google didn't respond (${networkError ? "network error or timeout" : `HTTP ${res!.status}`}) after ${attempt + 1} attempts. The next sync will try again.`, true);
    }
    await sleep(delays[attempt]! + Math.floor(Math.random() * 250));
  }
}

async function accessToken(config: SheetsConfig, delays?: number[]) {
  const res = await request(
    TOKEN_URL,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signServiceAccountJwt(config) }) },
    "token",
    delays,
  );
  if (!res.ok) {
    throw new SheetsError(`token: HTTP ${res.status}`, "Google rejected the service account credentials. Check GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY (the key may have been deleted or disabled).");
  }
  const json = (await res.json().catch(() => null)) as { access_token?: string } | null;
  if (!json?.access_token) throw new SheetsError("token: no access_token", "Google returned no access token.");
  return json.access_token;
}

function explain(status: number, clientEmail: string) {
  if (status === 403) return `The service account can't open the spreadsheet. Share it with ${clientEmail} as Viewer.`;
  if (status === 404) return "Spreadsheet not found. Check GOOGLE_SHEETS_SPREADSHEET_ID.";
  if (status === 400) return "Google rejected the request (a tab may have been renamed).";
  return `Google returned HTTP ${status}.`;
}

/** Reads the named tabs (as displayed in the sheet) plus the spreadsheet title. */
export async function readTabs(tabNames: string[], opts: { retryDelays?: number[] } = {}): Promise<{ title: string; tabs: Record<string, string[][]> }> {
  const { config } = readConfig();
  if (!config) throw new SheetsError("not configured", "Google Sheets isn't configured. See the setup steps on this page.");
  const token = await accessToken(config, opts.retryDelays);
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const id = encodeURIComponent(config.spreadsheetId);

  const metaRes = await request(`${API}/${id}?fields=properties.title,sheets.properties.title`, auth, "metadata", opts.retryDelays);
  if (!metaRes.ok) throw new SheetsError(`metadata: HTTP ${metaRes.status}`, explain(metaRes.status, config.clientEmail));
  const meta = (await metaRes.json()) as { properties?: { title?: string }; sheets?: { properties?: { title?: string } }[] };
  const present = new Set((meta.sheets ?? []).map((s) => s.properties?.title ?? ""));
  const missing = tabNames.filter((t) => !present.has(t));
  if (missing.length) throw new SheetsError(`missing tabs: ${missing.join(", ")}`, `The spreadsheet has no tab named ${missing.map((m) => `“${m}”`).join(", ")}. Tabs found: ${[...present].map((p) => `“${p}”`).join(", ")}.`);

  const qs = new URLSearchParams({ valueRenderOption: "FORMATTED_VALUE", majorDimension: "ROWS" });
  for (const t of tabNames) qs.append("ranges", `'${t.replace(/'/g, "''")}'`);
  const valRes = await request(`${API}/${id}/values:batchGet?${qs}`, auth, "values", opts.retryDelays);
  if (!valRes.ok) throw new SheetsError(`values: HTTP ${valRes.status}`, explain(valRes.status, config.clientEmail));
  const vals = (await valRes.json()) as { valueRanges?: { values?: unknown[][] }[] };
  const tabs: Record<string, string[][]> = {};
  tabNames.forEach((t, i) => {
    tabs[t] = (vals.valueRanges?.[i]?.values ?? []).map((row) => row.map((c) => (c == null ? "" : String(c))));
  });
  return { title: meta.properties?.title ?? "", tabs };
}
