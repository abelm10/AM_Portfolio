import "server-only";
import { Redis } from "@upstash/redis";
import { rankPlayers } from "./rank";
import { PlayerRecordSchema, type PlayerRecord } from "./schemas";
import type { LeaderboardStore } from "./store";

// One JSON record per player at lb:player:<nameKey>, plus the sorted set lb:best
// (member = nameKey, score = best) that orders the board. Ties are broken by name in rankPlayers.

const playerKey = (key: string) => `lb:player:${key}`;
const BEST = "lb:best";

export function createRedisStore(url: string, token: string): LeaderboardStore {
  const redis = new Redis({ url, token });

  async function records(keys: string[]): Promise<PlayerRecord[]> {
    if (keys.length === 0) return [];
    const values = await redis.mget<unknown[]>(...keys.map(playerKey));
    return values.flatMap((value) => {
      const parsed = PlayerRecordSchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    });
  }

  return {
    kind: "redis",

    async get(key) {
      const parsed = PlayerRecordSchema.safeParse(await redis.get(playerKey(key)));
      return parsed.success ? parsed.data : null;
    },

    async all() {
      return records(await redis.zrange<string[]>(BEST, 0, -1));
    },

    async ranked() {
      const keys = await redis.zrange<string[]>(BEST, 0, -1, { rev: true });
      return rankPlayers(await records(keys));
    },

    async create(key, record) {
      const created = await redis.set(playerKey(key), record, { nx: true });
      if (created !== "OK") return false;
      await redis.zadd(BEST, { score: record.best, member: key });
      return true;
    },

    async put(key, record) {
      const tx = redis.multi();
      tx.set(playerKey(key), record);
      tx.zadd(BEST, { score: record.best, member: key });
      await tx.exec();
    },

    async remove(key) {
      const tx = redis.multi();
      tx.del(playerKey(key));
      tx.zrem(BEST, key);
      await tx.exec();
    },
  };
}
