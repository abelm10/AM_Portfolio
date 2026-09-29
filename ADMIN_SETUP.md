# Admin setup

The `/admin` area needs a few credentials that only you can create. This takes about 15 minutes. You'll end up with these values:

| Variable | What it is | Where it comes from |
|---|---|---|
| `AUTH_SECRET` | Encrypts the login session cookie | Step 3 |
| `AUTH_GITHUB_ID` | OAuth app's Client ID | Step 1 |
| `AUTH_GITHUB_SECRET` | OAuth app's Client secret | Step 1 |
| `ADMIN_GITHUB_IDS` | Who may use /admin | Your GitHub user ID: `112473328` |
| `ADMIN_GITHUB_LOGINS` | Display only | `abelm10` |
| `GITHUB_CONTENT_TOKEN` | Lets the admin commit content | Step 2 |
| `VERCEL_DEPLOYMENTS_URL` | Optional link shown after each save | Step 4 |

`ADMIN_GITHUB_IDS` is what grants access. It uses your numeric ID rather than your username because a username can be changed and then claimed by someone else. You can check your ID any time at https://api.github.com/users/abelm10 (the `"id"` field).

Keep every value private. None of them go in the repo: `.env.local` is gitignored, and `.env.example` lists only the names.

---

## 1. Create the GitHub OAuth App (for signing in)

1. Go to https://github.com/settings/developers (GitHub → your avatar → **Settings** → **Developer settings** at the bottom of the left sidebar → **OAuth Apps**).
2. Click **New OAuth App** (or **Register a new application**).
3. Fill in:
   - **Application name:** `abelm10 portfolio admin`
   - **Homepage URL:** `https://am-portfolio-zeta.vercel.app`
   - **Application description:** leave empty
   - **Authorization callback URL:** `https://am-portfolio-zeta.vercel.app/api/auth/callback/github`
   - Leave **Enable Device Flow** unticked.
4. Click **Register application**.
5. On the app's page, copy the **Client ID**. This is `AUTH_GITHUB_ID`.
6. Click **Generate a new client secret**, confirm, and copy the secret straight away (GitHub shows it only once). This is `AUTH_GITHUB_SECRET`.

### A second app for local sign-in (optional)

An OAuth App has exactly one callback URL, so the production app can't sign you in at `http://localhost:3000`. If you want to use /admin locally, repeat the steps above to make a second app:

- **Application name:** `abelm10 portfolio admin (local)`
- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

Its Client ID and secret go in `.env.local` only (step 5), never in Vercel.

## 2. Create the fine-grained token (for saving content)

This token lets the admin commit to one repository and nothing else.

1. Go to https://github.com/settings/personal-access-tokens (**Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**).
2. Click **Generate new token**.
3. Fill in:
   - **Token name:** `AM_Portfolio admin content`
   - **Description:** `Commits content from /admin`
   - **Resource owner:** `abelm10`
   - **Expiration:** choose **Custom** and pick a date one year from today.
4. Under **Repository access**, choose **Only select repositories**, open the dropdown and pick **abelm10/AM_Portfolio**.
5. Under **Permissions** → **Repository permissions**, find **Contents** and set it to **Read and write**. GitHub adds **Metadata: Read-only** automatically; that's expected. Leave everything else at **No access**.
6. Click **Generate token**, then copy the token (starts with `github_pat_`). GitHub shows it only once. This is `GITHUB_CONTENT_TOKEN`.

### Renewing it

GitHub emails you a week before the token expires. When it does (or any time you think the token has leaked):

1. Open https://github.com/settings/personal-access-tokens and click the token's name.
2. Click **Regenerate token**, pick a new expiry a year out, and copy the new value.
3. Update `GITHUB_CONTENT_TOKEN` in Vercel (step 4) and in `.env.local`, then redeploy.

Regenerating immediately invalidates the old value. Until you update Vercel, saving in /admin shows an error, but the public site keeps working.

## 3. Generate `AUTH_SECRET`

In the project folder, run:

```bash
npx auth secret
```

It prints a random secret and may also add it to `.env.local` for you. Copy the value. Using a different secret locally and in Vercel is fine (and slightly safer); changing it just signs everyone out.

If that command doesn't work for you, this does the same thing:

```bash
node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"
```

## 4. Add the variables in Vercel, then redeploy

1. Open https://vercel.com, pick your team, and open the **am-portfolio** project.
2. Go to **Settings** → **Environment Variables**.
3. Add each of these. For **Environments**, tick **Production** only, because the OAuth app only knows the production URL. Turn on **Sensitive** for the secrets.

   | Key | Value | Sensitive |
   |---|---|---|
   | `AUTH_SECRET` | from step 3 | yes |
   | `AUTH_GITHUB_ID` | production app's Client ID (step 1) | no |
   | `AUTH_GITHUB_SECRET` | production app's Client secret (step 1) | yes |
   | `ADMIN_GITHUB_IDS` | `112473328` | no |
   | `ADMIN_GITHUB_LOGINS` | `abelm10` | no |
   | `GITHUB_CONTENT_TOKEN` | from step 2 | yes |
   | `VERCEL_DEPLOYMENTS_URL` | optional, see below | no |

   Don't add `ADMIN_LOCAL_WRITES` in Vercel. The admin ignores it in production anyway.

   For `VERCEL_DEPLOYMENTS_URL`: open the project's **Deployments** tab and copy the address from your browser, e.g. `https://vercel.com/abelm10s-projects/am-portfolio/deployments`.

4. Redeploy so the new variables take effect: **Deployments** tab → the ⋯ menu on the latest production deployment → **Redeploy** → **Redeploy**.

## 5. Put the same variables in `.env.local` (for local use)

Create `.env.local` in the project folder (copy `.env.example`) and fill it in:

```bash
AUTH_SECRET=...                # from step 3
AUTH_GITHUB_ID=...             # the *local* OAuth app's Client ID
AUTH_GITHUB_SECRET=...         # the *local* OAuth app's Client secret
ADMIN_GITHUB_IDS=112473328
ADMIN_GITHUB_LOGINS=abelm10
GITHUB_CONTENT_TOKEN=github_pat_...
VERCEL_DEPLOYMENTS_URL=https://vercel.com/<team>/am-portfolio/deployments

# Optional: save to the files on disk instead of committing to GitHub.
ADMIN_LOCAL_WRITES=true
```

With `ADMIN_LOCAL_WRITES=true`, saves change the files in `content/` directly (review them with `git diff`), and you don't need `GITHUB_CONTENT_TOKEN`. Without it, local saves commit to GitHub exactly like production does.

Restart `npm run dev` after editing `.env.local`.

## 6. Test it

1. Open https://am-portfolio-zeta.vercel.app/admin. You should land on the `admin/` sign-in page.
2. Click **Sign in with GitHub ↗** and approve the app. You should arrive at `projects/`, with your avatar and `@abelm10` in the header.
3. Open a project, change one word in its blurb, and click **Save**.
4. The status line should read `✓ committed a1b2c3d · the live site updates in about a minute`. Click the commit link to see it on GitHub.
5. Open the Vercel **Deployments** tab: a new production deployment should be building. When it's ready (about a minute), reload the public site and check the blurb.
6. Optional: sign in from a different GitHub account (or ask a friend). It should be refused with "This account isn't an admin".

After using the admin, run `git pull` before working locally, because the admin commits to GitHub directly.
