import { nameKey, type PlayerRecord } from "./schemas";

/** Rank order: best score first, ties broken by name A–Z (case-insensitive). */
export function compareRank(a: PlayerRecord, b: PlayerRecord): number {
  return b.best - a.best || compareNames(a, b);
}

export function compareNames(a: { name: string }, b: { name: string }): number {
  const x = nameKey(a.name);
  const y = nameKey(b.name);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Only players with at least one game get a rank. */
export function rankPlayers(records: PlayerRecord[]): PlayerRecord[] {
  return records.filter((r) => r.games > 0).sort(compareRank);
}
