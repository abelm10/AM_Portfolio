import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { rankPlayers } from "./rank";
import { PlayerRecordSchema, type PlayerRecord } from "./schemas";
import type { LeaderboardStore } from "./store";

// Local development without Redis: the same data in .data/leaderboard.json (git-ignored).

const FILE = path.join(process.cwd(), ".data", "leaderboard.json");
const FileSchema = z.object({ players: z.record(z.string(), PlayerRecordSchema) });
type FileData = z.infer<typeof FileSchema>;

// Writes are queued so two requests can't interleave read-modify-write. Kept on globalThis
// because each route is its own module in dev.
const shared = globalThis as typeof globalThis & { __leaderboardFileQueue?: Promise<unknown> };

async function load(): Promise<FileData> {
  try {
    return FileSchema.parse(JSON.parse(await readFile(FILE, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { players: {} };
    throw error;
  }
}

async function save(data: FileData): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, FILE);
}

function queued<T>(work: () => Promise<T>): Promise<T> {
  const run = (shared.__leaderboardFileQueue ?? Promise.resolve()).then(work, work);
  shared.__leaderboardFileQueue = run.catch(() => undefined);
  return run;
}

export function createFileStore(): LeaderboardStore {
  return {
    kind: "file",

    get: (key) => queued(async () => (await load()).players[key] ?? null),

    all: () => queued(async () => Object.values((await load()).players)),

    ranked: () => queued(async () => rankPlayers(Object.values((await load()).players))),

    create: (key, record) =>
      queued(async () => {
        const data = await load();
        if (data.players[key]) return false;
        data.players[key] = record;
        await save(data);
        return true;
      }),

    put: (key, record: PlayerRecord) =>
      queued(async () => {
        const data = await load();
        data.players[key] = record;
        await save(data);
      }),

    remove: (key) =>
      queued(async () => {
        const data = await load();
        delete data.players[key];
        await save(data);
      }),
  };
}
