import { boardPlayers, getStore } from "@/lib/leaderboard/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** The ranked board: players with at least one game, best first. */
export async function GET() {
  const store = getStore();
  if (!store) return Response.json({ error: "The leaderboard isn't set up." }, { status: 503, headers: NO_STORE });
  try {
    return Response.json({ players: await boardPlayers(store) }, { headers: NO_STORE });
  } catch (error) {
    console.error("[leaderboard] board failed", error);
    return Response.json({ error: "Couldn't load the leaderboard." }, { status: 500, headers: NO_STORE });
  }
}
