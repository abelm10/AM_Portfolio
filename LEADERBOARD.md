# Add a ranked mode and leaderboard to the footer bug game

The portfolio is live and working. Add **one feature**: a ranked 60-second mode for the footer bug game, with name + PIN players and a leaderboard. The finished design and behaviour are in **`design-reference/leaderboard.html`**, a working single-file prototype. It is the source of truth for markup, styles, copy, timings and game rules.

## ⚠️ Scope: change nothing else

This is the most important rule in this brief.

- **Don't touch** any other section, component, style, content file, metadata, animation or dependency.
- **No refactors, renames, reformatting or "while I'm here" fixes.** If you notice something else worth fixing, list it at the end of your summary instead of changing it.
- **The casual footer game keeps its current behaviour.** It gets exactly two small changes, listed in section 3.
- **New CSS goes in one clearly marked block** (`/* ranked mode */`) appended to the existing stylesheet. Don't edit existing rules, except the two footer changes in section 3.
- **Before writing any code,** read this brief and the prototype in full. Then reply with:
  - the exact list of files you'll create or modify, and why
  - any questions

  **Then pause for my OK.**
- **At the end,** show `git diff --stat` and confirm that every changed file is on the approved list.

---

## 1. What the prototype contains (port this, not the extras)

From `design-reference/leaderboard.html`, port:

- **The footer bar:** "click the bugs · squashed: N" on the left. On the right: the green `#1` badge with name · best, a low-key **leaderboard** text link, and a **set a record ▶** button.
- **The full-screen arena** with screens `who → pin / new → ready → play → results`, plus `board`. Port its markup structure, its copy and its CSS (`.arena`, `.screen`, `.players`, `.pchip`, `.field`, `.pin`, `.rules`, `.hud`, `.pit`, `.count`, `.score-big`, `.banner`, `.facts`, `.lb`, `.crown`, `.rank-btn`, `.linkish`).

Do **not** port the prototype's extras:

- the yellow "prototype" strip and the "10-second rounds" toggle
- the sample players
- the contact and nav markup (that already exists on the site)

### Game rules (keep these exactly)

- **Arena:** a fixed logical size of **760 × 300**, scaled to fit the width, so every laptop gets the same arena.
- **Bugs:** **7**, at speed **80 px/s** (logical), respawning **0.6 s** after being squashed. The sprite scale is **5**, using the same 7×5 sprite as the casual game.
- **Hit box:** the sprite plus an **8 px** margin.
- **Round:** **60 s**. The countdown shows `3`, `2`, `1` (750 ms each), then `GO` (450 ms). The timer turns red for the last 10 s.
- **Reduced motion:** ranked bugs **still move** (it's opt-in play with fixed rules), but the result banner's pop animation is off.
- **Closing:** ✕ or Esc during a round ends it **without saving**.

### Flow

1. **Set a record ▶** opens the arena on **who's playing?** It shows every player as a name button, sorted A–Z with "best N" under each, plus **+ New player**.
2. **Existing player:** enter the 4-digit PIN.
   - Wrong PIN shows "That PIN doesn't match. Try again."
   - There's no lockout.
3. **New player:**
   - **Name:** 2–16 characters, using letters, numbers, spaces, `-`, `_` or `.`, and unique ignoring case. If it's taken, show: `"name" is taken. Pick another, or tap your name instead.`
   - **PIN:** 4 digits, typed twice.
4. **Ready** shows the rules, then **Start ▶** runs the countdown and the round.
5. **Results:**
   - the score
   - a banner:
     - **New #1!** You beat X's N.
     - **New record.** Still #1.
     - **New personal best,** up from N.
     - **First round on the board.**
   - the facts line: rank #r of n · your best · games · and, when you're not #1, who is
   - the buttons:
     - **Play again:** same player, no PIN.
     - **Next player:** clears the player, back to who's playing.
     - **leaderboard**
6. **Board:**
   - rank (with the green `#1` badge), player, best, games, last played
   - the current player's row highlighted, with a "you" tag
   - Opened from the footer link, **Back** closes the arena.
7. **Shared laptop:** no player stays signed in. The signed-in player lives only in memory while the arena is open, and is never written to cookies or localStorage. Closing the arena or pressing Next player forgets them.

## 2. Storage: Upstash Redis

Scores are written by visitors, so they go in **Upstash Redis**, not in the GitHub content files. The owner will add it from the Vercel dashboard (see section 6).

- **Package:** `@upstash/redis` is the only new dependency.
- **Env vars:** read the REST URL and token from `KV_REST_API_URL` / `KV_REST_API_TOKEN`, falling back to `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. The Vercel integration may create either pair. Add both pairs to `.env.example`, names only.
- **Local development with no Redis vars:** use a JSON file store at `.data/leaderboard.json` (add `.data/` to `.gitignore`), behind the same interface, so the feature works offline.
- **Production with no Redis vars:** the API returns 503, and the footer hides the `#1` line, the leaderboard link and the set-a-record button. The rest of the site is unaffected.

**Data, in `lib/leaderboard/`** (store interface, Redis store, file store, zod schemas):

- **One record per player**, keyed by the lowercased name: `name`, `pinHash`, `pinSalt`, `best`, `games`, `last` (ISO date), `createdAt`.
- **A sorted set of `best` scores** for ranking. Ties are broken by name, A–Z.
- **PINs are hashed** with Node `crypto.scrypt` and a per-player random salt, and compared with `timingSafeEqual`. A PIN or its hash is never returned by any route.

## 3. The two footer changes

1. **Remove** the `echo "clean-notebooks-later/" >> .todo` text from the footer bar.
2. **Add** the right-hand group from the prototype: the `#1` record, the leaderboard link and the set-a-record button.
   - The `#1` badge uses `--accent` / `--accent-ink`, not gold.
   - The set-a-record button is hidden under `(pointer: coarse)`, so it's laptop only.
   - With no players yet, show `#1 no record yet`.

The casual game itself must not change. The only exception: it pauses while the arena is open, and resumes afterwards.

## 4. API (Node runtime route handlers under `app/api/leaderboard/`)

Validate every body with zod. Responses never include `pinHash` or `pinSalt`.

| Route | Body | Returns |
|---|---|---|
| `GET /api/leaderboard` | none | `{ players: [{ name, best, games, last }] }`, sorted by rank. Only players with games > 0 get a rank. Send `Cache-Control: no-store`. |
| `GET /api/leaderboard/players` | none | `{ players: [{ name, best, games }] }` for the who's-playing list, sorted A–Z |
| `POST /api/leaderboard/players` | `{ name, pin }` | creates the player and returns `{ name, token }`. Returns 409 if the name is taken (case-insensitive) and 400 with field messages if invalid. |
| `POST /api/leaderboard/verify` | `{ name, pin }` | `{ name, token }`, or 401 "That PIN doesn't match." |
| `POST /api/leaderboard/score` | `{ token, score }` | updates `games + 1`, `last = today`, and `best` if higher. Returns `{ score, best, previousBest, rank, total, previousTop: { name, best } \| null, newTop, personalBest }` |

- **The token** is an HMAC-signed `{ nameKey, exp }`, signed with `AUTH_SECRET` (already set) and valid for 30 minutes. It's held only in memory on the client. This just stops a score from being posted under someone else's name without their PIN.
- **No anti-cheat:** this is a game among friends. The only check is that `score` is an integer from 0 to 500.
- **Results values come from the server:** the results screen uses the score response for rank, best, previous #1 and the banner.

## 5. Admin: a new `leaderboard/` area in the existing admin

Add one entry to the admin's area list and one editor, matching the existing admin's look and its `requireAdmin()` checks on every action.

- **Table:** name, best, games, last played.
- **Per row:**
  - **Set best** (a number, 0–500)
  - **Reset PIN** (a new 4-digit PIN, entered twice)
  - **Delete**, with an in-page confirm ("Delete abel? Yes, delete / Cancel") and no `confirm()`
- **Add player:** name, PIN and starting best. The owner will use this to add `abel` with a starting best of 30.
- **Writes go straight to the store,** not to GitHub commits. The admin's "committed" status line doesn't apply here: show `✓ saved`.

## 6. Owner setup (write this into `LEADERBOARD_SETUP.md`, click by click)

1. **Create the database:** Vercel → the project → **Storage** (or Marketplace) → **Upstash → Redis** → free plan → create. Connect it to the project for **Production** and **Development**. Vercel adds the env vars itself.
2. **Use it locally (optional):** copy the two REST vars from the database's **.env.local** tab into `.env.local`. Without them, local dev uses the file store.
3. **Deploy:** push, then wait for the deployment to show **Ready**.
4. **Add the first player:** `/admin` → leaderboard/ → **Add player** → abel, your PIN, starting best 30.
5. **Test the whole flow:**
   - footer shows `#1 abel · 30`
   - set a record → abel → PIN → play
   - Next player → **+ New player** → play
   - leaderboard

## 7. Checks before you report back

- `npm run lint` and `npm run build` pass.
- A browser test runs the whole flow against the file store:
  - new player; duplicate name refused
  - wrong PIN refused; right PIN accepted
  - a 60 s round. Speed up only the test's clock, not the shipped constants.
  - results banner and rank
  - Play again skips the PIN; Next player clears the player
  - board highlights the current player
  - footer #1 updates after a new top score
  - ✕ mid-round saves nothing
- With no Redis vars in a production build, the footer hides the ranked controls and the page still renders.
- On a 360 px touch viewport, the set-a-record button is hidden and nothing scrolls sideways.
- **Screenshot every other section** before and after, in light and dark: no visual change outside the footer bar.
- `git diff --stat`: every file on the approved list, and nothing else.

## 8. Phases

1. **Plan:** the file list and any questions. **Pause.**
2. **Build:** storage, API, footer changes, arena, admin area, setup doc, README section (append-only: "Ranked mode and leaderboard").
3. **Checks** from section 7. Commit as `feat: ranked bug-bash mode with leaderboard`.
4. **Report:** what changed, the check results, and any out-of-scope observations. **Don't push.** The owner pushes after setting up Upstash.
