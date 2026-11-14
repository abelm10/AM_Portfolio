import "server-only";
import { createFileStore } from "./file-store";
import { burnPinCheck, checkPin, hashPin } from "./pin";
import { compareNames, compareRank } from "./rank";
import { createRedisStore } from "./redis-store";
import {
  nameKey,
  type BoardPlayer,
  type ListPlayer,
  type PlayerRecord,
  type ScoreResult,
} from "./schemas";
import { issueToken, tokensAvailable } from "./token";

/** Where players live: Upstash Redis in production, a JSON file in local development. */
export interface LeaderboardStore {
  kind: "redis" | "file";
  get(key: string): Promise<PlayerRecord | null>;
  /** Every player, in no particular order. */
  all(): Promise<PlayerRecord[]>;
  /** Players with games > 0, best first, ties by name A–Z. */
  ranked(): Promise<PlayerRecord[]>;
  /** False if the key is already taken. */
  create(key: string, record: PlayerRecord): Promise<boolean>;
  put(key: string, record: PlayerRecord): Promise<void>;
  remove(key: string): Promise<void>;
}

const cache = globalThis as typeof globalThis & { __leaderboardStore?: LeaderboardStore };

/**
 * Redis when its REST URL and token are set (either the Vercel KV or the Upstash names), the
 * file store in development, and null in production without Redis (the API then answers 503).
 */
export function getStore(): LeaderboardStore | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!tokensAvailable()) return null;
  if (url && token) {
    if (cache.__leaderboardStore?.kind !== "redis") cache.__leaderboardStore = createRedisStore(url, token);
    return cache.__leaderboardStore;
  }
  if (process.env.NODE_ENV === "production") return null;
  if (cache.__leaderboardStore?.kind !== "file") cache.__leaderboardStore = createFileStore();
  return cache.__leaderboardStore;
}

export const today = () => new Date().toISOString().slice(0, 10);

// --- reads -----------------------------------------------------------------------------------

export async function boardPlayers(store: LeaderboardStore): Promise<BoardPlayer[]> {
  return (await store.ranked()).map(({ name, best, games, last }) => ({ name, best, games, last }));
}

export async function listPlayers(store: LeaderboardStore): Promise<ListPlayer[]> {
  return (await store.all()).sort(compareNames).map(({ name, best, games }) => ({ name, best, games }));
}

// --- player writes ---------------------------------------------------------------------------

/**
 * Creates a player. A starting best above 0 (admin only) counts as one game played today, so
 * the player is ranked straight away.
 */
export async function createPlayer(
  store: LeaderboardStore,
  name: string,
  pin: string,
  startingBest = 0,
): Promise<PlayerRecord | null> {
  const now = new Date();
  const record: PlayerRecord = {
    name: name.trim(),
    ...(await hashPin(pin)),
    best: startingBest,
    games: startingBest > 0 ? 1 : 0,
    last: startingBest > 0 ? today() : null,
    createdAt: now.toISOString(),
  };
  return (await store.create(nameKey(name), record)) ? record : null;
}

/** The player if the PIN matches, otherwise null. Unknown names take as long as wrong PINs. */
export async function verifyPlayer(store: LeaderboardStore, name: string, pin: string): Promise<PlayerRecord | null> {
  const record = await store.get(nameKey(name));
  if (!record) {
    await burnPinCheck(pin);
    return null;
  }
  return (await checkPin(pin, record)) ? record : null;
}

/** Records one finished round. Null if the player no longer exists. */
export async function recordScore(store: LeaderboardStore, key: string, score: number): Promise<ScoreResult | null> {
  const record = await store.get(key);
  if (!record) return null;

  const before = await store.ranked();
  const topBefore = before[0] ?? null;
  const previousBest = record.best;
  const personalBest = score > previousBest;
  const updated: PlayerRecord = {
    ...record,
    games: record.games + 1,
    last: today(),
    best: personalBest ? score : record.best,
  };
  await store.put(key, updated);

  const after = await store.ranked();
  const rank = after.findIndex((r) => nameKey(r.name) === key) + 1;
  const newTop =
    score > 0 && after[0] !== undefined && nameKey(after[0].name) === key && (!topBefore || score > topBefore.best);

  return {
    score,
    best: updated.best,
    previousBest,
    rank,
    total: after.length,
    previousTop: topBefore ? { name: topBefore.name, best: topBefore.best } : null,
    newTop,
    personalBest,
    games: updated.games,
    token: issueToken(key),
  };
}

// --- admin ------------------------------------------------------------------------------------

export type AdminPlayer = { key: string; name: string; best: number; games: number; last: string | null };

/** Every player for the admin table: ranked players first, then the ones with no games, A–Z. */
export async function adminPlayers(store: LeaderboardStore): Promise<AdminPlayer[]> {
  const unranked = (r: PlayerRecord) => (r.games > 0 ? 0 : 1);
  return (await store.all())
    .sort((a, b) => unranked(a) - unranked(b) || compareRank(a, b))
    .map(({ name, best, games, last }) => ({ key: nameKey(name), name, best, games, last }));
}

// --- admin writes ----------------------------------------------------------------------------

export async function setBest(store: LeaderboardStore, key: string, best: number): Promise<boolean> {
  const record = await store.get(key);
  if (!record) return false;
  const seeded = record.games === 0 && best > 0;
  await store.put(key, {
    ...record,
    best,
    games: seeded ? 1 : record.games,
    last: seeded ? today() : record.last,
  });
  return true;
}

export async function setPin(store: LeaderboardStore, key: string, pin: string): Promise<boolean> {
  const record = await store.get(key);
  if (!record) return false;
  await store.put(key, { ...record, ...(await hashPin(pin)) });
  return true;
}
