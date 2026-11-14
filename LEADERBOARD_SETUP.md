# Leaderboard setup (Upstash Redis)

The ranked bug-bash mode stores players and scores in Upstash Redis. Until the database is connected, the live site hides the `#1` line, the leaderboard link and the set-a-record button in the footer. Everything else works as before.

## 1. Create the database

1. Open [vercel.com](https://vercel.com) and go to your **AM_Portfolio** project.
2. Click the **Storage** tab. If you don't see Upstash there, use **Marketplace** instead.
3. Pick **Upstash**, then **Redis**, and click **Create** (or **Install**).
4. Choose the **Free** plan, give the database a name (for example `bug-bash`), pick the region closest to you, and click **Create**.
5. When asked which environments to connect, tick **Production** and **Development**. You can also tick Preview if you want ranked mode on preview deployments. Click **Connect**.
6. Vercel adds the env vars for you. Check under **Settings → Environment Variables**: you should see either `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Either pair works.

`AUTH_SECRET` (already set for the admin) also signs the short-lived game tokens, so there's nothing else to add.

## 2. Use it locally (optional)

Without Redis vars, `npm run dev` uses a local file store at `.data/leaderboard.json`, which is git-ignored. If you'd rather use the real database while developing:

1. In Vercel, open **Storage**, then your Redis database, then the **.env.local** tab.
2. Copy the two REST lines (the URL and the token, **not** the read-only token).
3. Paste them into `.env.local` in the project folder and restart `npm run dev`.

## 3. Deploy

1. Push to `main`: `git push`.
2. In Vercel, open **Deployments** and wait for the newest one to show **Ready**.

The env vars only apply to deployments made after they were added. If you connected the database after the last deploy, push again or click **Redeploy** on the latest deployment.

## 4. Add the first player

1. Go to `https://<your-site>/admin` and sign in with GitHub.
2. Click **leaderboard/** in the sidebar.
3. Under **add player**, enter name **abel**, your 4-digit PIN twice, and starting best **30**.
4. Click **Add player**. The status line shows **✓ saved** and abel appears in the table.

A starting best above 0 counts as one game played today, so abel is ranked straight away.

## 5. Test the whole flow

On a laptop (the set-a-record button is hidden on touch screens):

1. **Footer:** reload the home page. The footer bar shows `#1 abel · 30`.
2. **Play as abel:** click **set a record ▶**, then **abel**, enter your PIN and click **Continue**. Click **Start ▶**, play the 60-second round and check the results screen.
3. **A new player:** click **Next player**, then **+ New player**. Enter a name and a PIN twice, click **Create and play**, then play a round.
4. **The board:** click **leaderboard**. The current player's row is highlighted with a "you" tag. Click **Back**, then close the arena with **✕**. The footer's `#1` line shows the top score.

## Managing players

`/admin`, then **leaderboard/**:

- **Set best** overwrites a player's best (0–500).
- **Reset PIN** sets a new 4-digit PIN for someone who forgot theirs.
- **Delete** removes the player after an in-page confirm.

These writes go straight to Redis and are live at once. Nothing is committed to GitHub.
