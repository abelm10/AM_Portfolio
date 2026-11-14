import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// A short-lived signed { nameKey, exp }. It only stops scores being posted under someone else's
// name without their PIN; the client holds it in memory and never stores it.

const TTL_MS = 30 * 60 * 1000;

const devSecret = globalThis as typeof globalThis & { __leaderboardDevSecret?: string };

function secret(): string | null {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") return null;
  // Local development without AUTH_SECRET: one random secret per dev server.
  devSecret.__leaderboardDevSecret ??= randomBytes(32).toString("hex");
  return devSecret.__leaderboardDevSecret;
}

export const tokensAvailable = () => secret() !== null;

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function issueToken(nameKey: string, now = Date.now()): string {
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET is not set.");
  const payload = Buffer.from(JSON.stringify({ nameKey, exp: now + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** The nameKey the token was issued for, or null if it's forged, malformed or expired. */
export function readToken(token: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, key));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const { nameKey, exp } = data as { nameKey?: unknown; exp?: unknown };
    if (typeof nameKey !== "string" || typeof exp !== "number" || exp <= now) return null;
    return nameKey;
  } catch {
    return null;
  }
}
