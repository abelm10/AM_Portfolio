import type { Metadata } from "next";
import AreaHead from "@/components/admin/AreaHead";
import LeaderboardEditor from "@/components/admin/LeaderboardEditor";
import { requireAdminPage } from "@/lib/admin/session";
import { adminPlayers, getStore, type AdminPlayer } from "@/lib/leaderboard/store";

export const metadata: Metadata = { title: "leaderboard" };

export default async function AdminLeaderboardPage() {
  await requireAdminPage();
  const store = getStore();
  let players: AdminPlayer[] | null = null;
  let error: string | undefined;

  if (!store) {
    error =
      "The leaderboard store isn't set up: add Upstash Redis to the Vercel project (see LEADERBOARD_SETUP.md). Until then the footer hides ranked mode.";
  } else {
    try {
      players = await adminPlayers(store);
    } catch (e) {
      console.error("[admin] leaderboard load failed", e);
      error = "Couldn't load the leaderboard. Try reloading the page.";
    }
  }

  return (
    <>
      <AreaHead
        kicker="sort -k best -r players"
        title="leaderboard/"
        sub={
          <>
            Ranked bug-bash players. Changes save straight to the leaderboard store
            {store?.kind === "file" ? (
              <>
                {" "}
                (local file store: <code>.data/leaderboard.json</code>)
              </>
            ) : null}
            , not to GitHub.
          </>
        }
        local={false}
        error={error}
      />
      {players && <LeaderboardEditor initial={players} />}
    </>
  );
}
