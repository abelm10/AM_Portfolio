import { validate } from "@/lib/admin/result";
import { ScoreBody } from "@/lib/leaderboard/schemas";
import { getStore, recordScore } from "@/lib/leaderboard/store";
import { readToken } from "@/lib/leaderboard/token";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** Saves one finished round. The results screen uses these values, not the client's own. */
export async function POST(request: Request) {
  const store = getStore();
  if (!store) return Response.json({ error: "The leaderboard isn't set up." }, { status: 503, headers: NO_STORE });
  const body = validate(ScoreBody, await request.json().catch(() => null));
  if (!body.ok) return Response.json({ error: "That isn't a valid score." }, { status: 400, headers: NO_STORE });
  const key = readToken(body.data.token);
  if (!key) {
    return Response.json(
      { error: "Your session expired. Tap Next player and sign in again." },
      { status: 401, headers: NO_STORE },
    );
  }
  try {
    const result = await recordScore(store, key, body.data.score);
    if (!result) return Response.json({ error: "That player no longer exists." }, { status: 404, headers: NO_STORE });
    return Response.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error("[leaderboard] score failed", error);
    return Response.json({ error: "Couldn't save the round. Try again." }, { status: 500, headers: NO_STORE });
  }
}
