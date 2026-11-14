import { z } from "zod";

// Shared by the API routes, the admin actions and the arena (no server-only imports here).

export const MAX_SCORE = 500;

export const NameSchema = z
  .string()
  .trim()
  .min(2, "Name needs at least 2 characters.")
  .max(16, "Name can be at most 16 characters.")
  .regex(/^[A-Za-z0-9 _.-]+$/, "Use letters, numbers, spaces, - _ or .");

export const PinSchema = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

export const ScoreSchema = z
  .number()
  .int("Score must be a whole number.")
  .min(0, "Score can't be negative.")
  .max(MAX_SCORE, `Score can be at most ${MAX_SCORE}.`);

/** What the store keeps per player, keyed by the lowercased name. */
export const PlayerRecordSchema = z.object({
  name: z.string(),
  pinHash: z.string(),
  pinSalt: z.string(),
  best: z.number().int().min(0),
  games: z.number().int().min(0),
  /** ISO date (YYYY-MM-DD) of the last round, or null before the first one. */
  last: z.string().nullable(),
  createdAt: z.string(),
});
export type PlayerRecord = z.infer<typeof PlayerRecordSchema>;

// --- request bodies ------------------------------------------------------------------------

export const NewPlayerBody = z.object({ name: NameSchema, pin: PinSchema });
export const VerifyBody = z.object({ name: z.string().trim().min(1).max(16), pin: PinSchema });
export const ScoreBody = z.object({ token: z.string().min(1).max(512), score: ScoreSchema });

// --- what the routes return (never pinHash or pinSalt) ---------------------------------------

export type BoardPlayer = { name: string; best: number; games: number; last: string | null };
export type ListPlayer = { name: string; best: number; games: number };
export type Session = { name: string; token: string };
export type ScoreResult = {
  score: number;
  best: number;
  previousBest: number;
  rank: number;
  total: number;
  previousTop: { name: string; best: number } | null;
  newTop: boolean;
  personalBest: boolean;
  /** The player's game count after this round, for the results facts line. */
  games: number;
  /** A fresh 30-minute token, so a long run of "Play again" doesn't expire mid-session. */
  token: string;
};

export const nameKey = (name: string) => name.trim().toLowerCase();
