# abelm10 portfolio

Single-page portfolio for Abel M, live at https://am-portfolio-zeta.vercel.app. Built with Next.js (App Router), TypeScript and plain CSS. Every piece of copy lives in `content/`, is checked with [zod](https://zod.dev) at build time, and an invalid file fails the build with a message naming the file and field.

Vercel redeploys on every push to `main`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build; also validates all content
npm run lint
```

Node 22.18 or later (the `add-project` script runs TypeScript directly).

## Add a project

```bash
npm run add-project
```

It asks for each field, checks the answers against the same schema the build uses, and writes `content/projects/<slug>.md`. Or copy `content/projects/_template.md` (files starting with `_` are ignored) and fill it in by hand.

A project file is YAML frontmatter only:

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Shown as-is, so keep the trailing slash: `"fakewave/"` |
| `status` | yes | `live` (green tag), `in development` (gold tag), `completed`, `case study` |
| `tags` | yes | At least one. Drives the filter buttons: `ml`, `data`, `web`, `software` … |
| `blurb` | yes | One or two sentences |
| `metric` | no | `{ value: "64.7%", label: "what the number means" }` |
| `points` | yes | List of bullet points (can be empty) |
| `stack` | yes | List of chips |
| `links` | yes | At least one `{ label, url, primary? }` (http/https only); `primary: true` is the solid green button |
| `order` | no | Lower comes first; projects without one go last, by title |

Unknown fields are rejected, so a typo like `staus:` fails the build instead of being silently ignored.

## Edit other content

| File | What it drives |
|---|---|
| `content/site.json` | Name, handle, site URL, location, university, GitHub/LinkedIn/Kaggle links, optional `email` (the contact section shows an email row only when it's set) |
| `content/about.json` | Bio, motto, the key/value rows (`facts`), `experience` and `education` |
| `content/toolkit.json` | The three toolkit rows and their chips |
| `content/log.json` | commit-log month groups, newest first. Each item: `{ date: "22 sep", repo, text }`; `repo` links to `github.com/abelm10/<repo>` |
| `content/learning.json` | Repos in the collapsible learning-log |
| `content/hobbies.json` | The off-the-clock tiles. In `board` lines, wrap text in `*asterisks*` to highlight it |

`experience` and `education` in `about.json` render as extra rows in about/ as soon as they have entries, with no code changes:

```json
"experience": [{ "title": "Data Science Intern", "org": "Company", "period": "2026" }],
"education": [{ "title": "MSc Data Science", "org": "CHRIST University", "period": "2025–27" }]
```

`org` and `period` are optional. While `experience` is empty, the row shows `experiencePending` ("syncing from LinkedIn▌").

## Edit from the browser: /admin

Sign in at `/admin` with GitHub to add, edit, reorder and delete projects, and to edit every other content file. Only the GitHub user IDs in `ADMIN_GITHUB_IDS` get in. Each save is validated with the same schemas as the build and committed to `main` through the GitHub API, which triggers a Vercel redeploy (live in about a minute). Setup: [ADMIN_SETUP.md](ADMIN_SETUP.md).

**After editing through the admin, run `git pull` before working locally**, because the admin commits to GitHub directly.

To test without making commits, set `ADMIN_LOCAL_WRITES=true` in `.env.local`: saves then write the files in `content/` on disk (review them with `git diff`). It's ignored on Vercel.

## How it's put together

- `app/`: the page, layout (fonts, metadata, pre-paint theme script), 404, OG image, sitemap and robots.
- `app/globals.css`: the design system, ported from `design-reference/index.html` (the design's source of truth).
- `components/sections/`: one component per page section, all server-rendered from `content/`.
- `components/`: the client pieces: `ThemeToggle`, `ProjectFilters`, `Spectrogram`, `BugBash`, `CursorTrail`, `ConsoleEgg`.
- `lib/schemas.ts`: the zod schemas, shared by the build, `add-project` and the admin. `lib/content.ts` and `lib/projects.ts` load and validate the files.
- `app/admin/`, `components/admin/`, `lib/admin/`: the admin (sign-in, editors, GitHub and local-disk store). `auth.ts` configures Auth.js.
- `scripts/add-project.ts`: the interactive project helper.

The page is complete without JavaScript; the canvases, filters, theme switch and cursor trail are progressive. Everything animated respects `prefers-reduced-motion`.
