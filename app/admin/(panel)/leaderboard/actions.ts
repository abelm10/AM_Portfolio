"use server";

// Leaderboard admin writes. They go straight to the leaderboard store (Redis, or the local file
// store in development), not to GitHub, so there's no commit status: success is just "saved".

import { z } from "zod";
import { validate, type FieldErrors } from "@/lib/admin/result";
import { assertAdmin, NotAdminError } from "@/lib/admin/session";
import { MAX_SCORE, NameSchema, PinSchema } from "@/lib/leaderboard/schemas";
import {
  adminPlayers,
  createPlayer,
  getStore,
  setBest,
  setPin,
  type AdminPlayer,
  type LeaderboardStore,
} from "@/lib/leaderboard/store";

export type LeaderboardResult =
  | { ok: true; players: AdminPlayer[] }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

const BestSchema = z.coerce
  .number({ error: "Enter a number." })
  .int("Use a whole number.")
  .min(0, "Best can't be negative.")
  .max(MAX_SCORE, `Best can be at most ${MAX_SCORE}.`);

const AddSchema = z
  .object({ name: NameSchema, pin: PinSchema, pin2: z.string(), best: BestSchema })
  .refine((v) => v.pin === v.pin2, { path: ["pin2"], message: "The two PINs don't match." });

const PinPairSchema = z
  .object({ pin: PinSchema, pin2: z.string() })
  .refine((v) => v.pin === v.pin2, { path: ["pin2"], message: "The two PINs don't match." });

const KeySchema = z.string().min(1).max(32);

async function run(action: (store: LeaderboardStore) => Promise<LeaderboardResult>): Promise<LeaderboardResult> {
  try {
    await assertAdmin();
    const store = getStore();
    if (!store) return { ok: false, error: "The leaderboard store isn't set up. See LEADERBOARD_SETUP.md." };
    return await action(store);
  } catch (error) {
    if (error instanceof NotAdminError) return { ok: false, error: error.message };
    console.error("[admin] leaderboard save failed", error);
    return { ok: false, error: "Something went wrong while saving. Reload to check whether it went through." };
  }
}

export async function addPlayerAction(input: unknown): Promise<LeaderboardResult> {
  return run(async (store) => {
    const parsed = validate(AddSchema, input);
    if (!parsed.ok) return { ok: false, error: "Some fields need fixing. Nothing was saved.", fieldErrors: parsed.fieldErrors };
    const { name, pin, best } = parsed.data;
    const created = await createPlayer(store, name, pin, best);
    if (!created) {
      return { ok: false, error: `"${name}" is taken.`, fieldErrors: { name: `"${name}" is taken (names ignore case).` } };
    }
    return { ok: true, players: await adminPlayers(store) };
  });
}

export async function setBestAction(key: unknown, best: unknown): Promise<LeaderboardResult> {
  return run(async (store) => {
    const k = KeySchema.safeParse(key);
    const b = BestSchema.safeParse(best);
    if (!k.success) return { ok: false, error: "Unknown player." };
    if (!b.success) return { ok: false, error: b.error.issues[0]?.message ?? "Enter a number from 0 to 500." };
    if (!(await setBest(store, k.data, b.data))) return { ok: false, error: "That player no longer exists." };
    return { ok: true, players: await adminPlayers(store) };
  });
}

export async function resetPinAction(key: unknown, input: unknown): Promise<LeaderboardResult> {
  return run(async (store) => {
    const k = KeySchema.safeParse(key);
    if (!k.success) return { ok: false, error: "Unknown player." };
    const parsed = PinPairSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the PIN." };
    if (!(await setPin(store, k.data, parsed.data.pin))) return { ok: false, error: "That player no longer exists." };
    return { ok: true, players: await adminPlayers(store) };
  });
}

export async function deletePlayerAction(key: unknown): Promise<LeaderboardResult> {
  return run(async (store) => {
    const k = KeySchema.safeParse(key);
    if (!k.success) return { ok: false, error: "Unknown player." };
    await store.remove(k.data);
    return { ok: true, players: await adminPlayers(store) };
  });
}
