import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing with scrypt (memory-hard, built into Node — no native
 * add-on to install). Parameters are stored with each hash so they can be
 * raised later without invalidating existing passwords.
 *
 * Format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;

function scrypt(password: string, salt: Buffer, keyLen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize("NFKC"), salt, keyLen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

const maxmem = (n: number, r: number) => 128 * n * r * 2;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: maxmem(Number(n), Number(r)),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * A precomputed hash used to make login take the same time whether or not
 * the email exists, so response timing does not reveal which addresses have
 * accounts.
 */
let dummyHash: Promise<string> | undefined;
export function dummyPasswordHash() {
  return (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));
}

/** A URL-safe random token with 256 bits of entropy. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored only as their SHA-256, so the database never holds a usable token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Password policy, shared by the activation, reset and change-password forms. */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 10) problems.push("Use at least 10 characters.");
  if (password.length > 200) problems.push("Use at most 200 characters.");
  if (!/[a-z]/i.test(password)) problems.push("Include at least one letter.");
  if (!/[0-9]/.test(password)) problems.push("Include at least one number.");
  return problems;
}
