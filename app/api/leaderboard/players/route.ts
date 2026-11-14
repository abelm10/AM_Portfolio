import { validate } from "@/lib/admin/result";
import { nameKey, NewPlayerBody } from "@/lib/leaderboard/schemas";
import { createPlayer, getStore, listPlayers } from "@/lib/leaderboard/store";
import { issueToken } from "@/lib/leaderboard/token";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const unavailable = () =>
  Response.json({ error: "The leaderboard isn't set up." }, { status: 503, headers: NO_STORE });

/** Everyone, A–Z, for the who's-playing list. */
export async function GET() {
  const store = getStore();
  if (!store) return unavailable();
  try {
    return Response.json({ players: await listPlayers(store) }, { headers: NO_STORE });
  } catch (error) {
    console.error("[leaderboard] players failed", error);
    return Response.json({ error: "Couldn't load players." }, { status: 500, headers: NO_STORE });
  }
}

/** Creates a player and signs them in for this arena session. */
export async function POST(request: Request) {
  const store = getStore();
  if (!store) return unavailable();
  const body = validate(NewPlayerBody, await request.json().catch(() => null));
  if (!body.ok) {
    const first = Object.values(body.fieldErrors)[0] ?? "Check the name and PIN.";
    return Response.json({ error: first, fieldErrors: body.fieldErrors }, { status: 400, headers: NO_STORE });
  }
  const { name, pin } = body.data;
  try {
    const record = await createPlayer(store, name, pin);
    if (!record) {
      return Response.json(
        { error: `"${name}" is taken. Pick another, or tap your name instead.` },
        { status: 409, headers: NO_STORE },
      );
    }
    return Response.json(
      { name: record.name, token: issueToken(nameKey(record.name)) },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error("[leaderboard] create failed", error);
    return Response.json({ error: "Couldn't create the player. Try again." }, { status: 500, headers: NO_STORE });
  }
}
