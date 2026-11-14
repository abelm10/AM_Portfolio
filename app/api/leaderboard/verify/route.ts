import { validate } from "@/lib/admin/result";
import { nameKey, VerifyBody } from "@/lib/leaderboard/schemas";
import { getStore, verifyPlayer } from "@/lib/leaderboard/store";
import { issueToken } from "@/lib/leaderboard/token";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** Checks a player's PIN. No lockout: this is a game among friends. */
export async function POST(request: Request) {
  const store = getStore();
  if (!store) return Response.json({ error: "The leaderboard isn't set up." }, { status: 503, headers: NO_STORE });
  const body = validate(VerifyBody, await request.json().catch(() => null));
  if (!body.ok) return Response.json({ error: "Enter your 4-digit PIN." }, { status: 400, headers: NO_STORE });
  try {
    const record = await verifyPlayer(store, body.data.name, body.data.pin);
    if (!record) return Response.json({ error: "That PIN doesn't match." }, { status: 401, headers: NO_STORE });
    return Response.json({ name: record.name, token: issueToken(nameKey(record.name)) }, { headers: NO_STORE });
  } catch (error) {
    console.error("[leaderboard] verify failed", error);
    return Response.json({ error: "Couldn't check the PIN. Try again." }, { status: 500, headers: NO_STORE });
  }
}
