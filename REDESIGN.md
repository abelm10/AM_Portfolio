# Redesign: replace the Greek-temple theme with the "conference grid" design

This project (a Next.js portfolio) is half-built with an ancient-Greece theme. We're changing direction completely. The new design is finished and lives in **`design-reference/index.html`**, a single self-contained HTML page. Your job is to rebuild this Next.js site so it looks and behaves exactly like that reference, while keeping the good engineering already in place: zod-validated content files and the `npm run add-project` command.

**Read `design-reference/index.html` in full before you change anything.** It is the source of truth for layout, CSS, copy, project data and interactions. When this brief and the reference disagree on something visual, the reference wins.

Then look at the current codebase (`app/`, `components/`, `content/`, `lib/`, `scripts/`) and tell me in a short list what you'll keep, what you'll rewrite and what you'll delete, before you start editing.

---

## 0. Ground rules

- Work on a new git branch: `git checkout -b redesign-grid`. The Greek version stays on `main` in case I want it back.
- Keep: Next.js App Router, TypeScript strict, Tailwind (or plain CSS modules if that's cleaner for porting the reference CSS; your call, but tell me), zod content validation, the `add-project` script, the build-time error on invalid content.
- Delete: everything Greek. That includes the boot sequence, curtain, royal, stage and columns; the Pantheon, Agora, Library, Oracle and Gymnasium styling; the Greek-key divider; marble textures; the Cinzel font; and the Konami "Olympus mode". Remove unused dependencies (GSAP, Motion etc.) if nothing in the new design needs them. The reference uses no animation library.
- No external runtime requests except Google Fonts via `next/font`.
- After each phase, run `npm run lint` and `npm run build`, fix everything, and commit.

---

## 1. Design system (port from the reference's `:root` block)

- Copy the CSS custom properties from the reference **exactly**: `--bg`, `--surface`, `--line`, `--fg`, `--muted`, `--accent`, `--accent-ink`, `--pixel`, plus the dark values. Keep the same three-state theme logic: the light values on `:root`; the dark values under `prefers-color-scheme: dark` guarded by `:root:not([data-theme="light"])`; and the dark values again under `[data-theme="dark"]`.
- The theme toggle in the nav reads "theme: light / dark", saves to `localStorage` (inside try/catch), and sets `data-theme` on `<html>`. Avoid a flash of the wrong theme: set the attribute from a tiny inline script in `<head>` before paint.
- Fonts via `next/font/google`:
  - **Mona Sans** as a variable font with both the `wght` and `wdth` axes. The wordmark uses `font-stretch: 125%`, so the width axis matters. If `next/font/google` doesn't offer Mona Sans with `wdth` in this Next version, self-host the official OFL release with `next/font/local`.
  - **Geist Mono** for all the mono labels.
- The layout frame: a `max-width: 1280px` column with 1px side borders (`.frame`). Sections are separated by 1px rules, and cells inside sections use border-right/border-bottom lines rather than gaps. Body side gutter of 16px minimum.
- No rounded corners anywhere. Buttons are square. The primary button is solid `--accent`; the ghost button is 1px `--line`.

---

## 2. Page structure (single page, same order as the reference)

Build each as its own component in `components/sections/`, with the markup and class structure mirroring the reference:

1. **Nav** (sticky): a bordered cell row: `abel▮m10` logo with the two-pixel mark, then Projects / Toolkit / Log / About / Off the clock, the theme button, and a green "Get in touch ↗" cell. On narrow screens the links cell scrolls horizontally and the CTA shrinks to "↗".
2. **Hero**:
   - A giant `ABEL` wordmark with the green/gold pixel pair and the `M` cropped at the bottom-right.
   - Below it, a two-cell grid:
     - **Left:** the spectrogram canvas with its label, the real/synthetic toggle, the axis note and the caption.
     - **Right:** the mono meta lines with the blinking cursor, the lede, and the two buttons.
   - On mobile the info cell comes first.
3. **Statement + pillars**: "I like the whole path…", followed by the three pillars `abel.clean()`, `abel.model()` and `abel.ship()`.
4. **projects/**: the segmented filter with counts, the card grid (3 → 2 → 1 columns) and the collapsible `learning-log/`.
5. **toolkit/**: agenda-style rows (languages, data_&_ml, ship).
6. **commit-log/**: month groups (`sep26_` …) with dated entries linking to repos.
7. **about/**: the bio, the motto block and the key/value list.
8. **off-the-clock/**: three tiles, each with an inverted mini scoreboard.
9. **let's-build-something/**: the big heading with a cursor, the sub line and three link rows.
10. **Footer**: the bug-bash mini game (score counter), © line and tagline.

Use the copy from the reference verbatim.

---

## 3. Interactive pieces (client components)

Port these from the reference's `<script>` as small `"use client"` components, with clean-up on unmount:

- **`Spectrogram.tsx`**: the canvas log-mel illustration. Keep the same generation logic: mel-scaled harmonics, the real/synthetic modes, the 9px cells, the quantised alpha and the gold peaks. It redraws on theme change, pauses when offscreen or when the tab is hidden, and draws one static frame under `prefers-reduced-motion`.
- **`BugBash.tsx`**: the pixel-bug game in the footer, with the score, the squash burst and respawns. Bugs don't move under reduced motion.
- **`CursorTrail.tsx`**: code symbols (`-/).+=><*&{}#`) that trail the pointer in the hero and footer only. It's for fine pointers only, skips links, buttons and canvases, and is off under reduced motion.
- **`ThemeToggle.tsx`**
- **`ProjectFilters.tsx`**: filter buttons with `aria-pressed`, plus the empty state `// 0 rows returned. Try another filter.`
- Keep the console easter egg.

---

## 4. Content: keep it file-based and validated

All content comes from `content/`, validated with zod at build time. Update the existing loaders and schemas instead of hard-coding the reference's JS arrays.

**`content/site.ts`**
- name: "Abel M"
- handle: "abelm10"
- role: "MSc Data Science student"
- location: "Bangalore, India"
- university: "CHRIST University" (add a `// TODO confirm` comment)
- github: https://github.com/abelm10
- linkedin: https://www.linkedin.com/in/abelm10
- kaggle: https://www.kaggle.com/datasets/abelmathews2548401/fakewave-fake-vs-real-audio-dataset
- email: leave it optional and unset. The contact section hides the email row when it's empty.

**Project schema.** Replace the old one with fields matching the reference:

```ts
title: string            // shown as "fakewave/", so write it with the trailing slash
status: "live" | "in development" | "completed" | "case study"
tags: string[]           // drives the filter buttons: ml, data, web, software …
blurb: string
metric?: { value: string; label: string }
points: string[]
stack: string[]
links: { label: string; url: string; primary?: boolean }[]
order?: number
```

- Status styling: "live" is the solid green tag; "in development" is the gold-tinted tag; the others are the neutral outline tag.
- Recreate `content/projects/*.md` with the **six projects from the reference** (fakewave, asg-airlines-pipeline, fixtures, weather-classification, healthmate, lost-found-system), in that order, using exactly the numbers and wording in the reference. Delete the old seeded files.
- Update `content/projects/_template.md` and the **`npm run add-project`** prompts to match the new schema.
- The build must still fail with a readable message on an invalid file. Test it once with a deliberately broken file, then delete that file.

**Other content files:**
- `content/learning.json`: the 7 learning-log repos.
- `content/log.json`: the commit-log month groups.
- `content/toolkit.json`: the three rows.
- `content/hobbies.json`: the three off-the-clock tiles, including their scoreboard text.

About:
- Keep "experience" as a pending row ("syncing from LinkedIn▌") driven by content.
- Add an `experience` array and an `education` array to the content, both empty for now. When I fill them in later, they should render as extra key/value rows with no code changes.

---

## 5. Quality bar

- Complete at rest: no content hidden waiting for a scroll observer. The only load motion is the wordmark's small settle.
- Keyboard accessible, with visible focus rings (2px `--accent`). One `h1` (the wordmark, labelled "Abel M"), and a logical heading order.
- `prefers-reduced-motion` respected everywhere.
- No horizontal page scroll at 360px. Test the nav, hero, cards and link rows at phone width.
- Metadata: a title of "Abel M", a description, Open Graph tags, and a generated OG image (`app/opengraph-image.tsx`) showing the ABEL wordmark with the pixel pair on `--bg`. Add `sitemap.ts` and `robots.ts`.
- Lighthouse on mobile: Performance ≥ 90, Accessibility 100.
- Keep or rebuild a simple `not-found.tsx` in the new style: big `404/` heading, the line `// route not found. The bugs got to it.` and a green "Back home" button.

---

## 6. Phases

1. **Plan:** read the reference and the codebase, list keep/rewrite/delete, and create the branch. **Pause for my OK.**
2. **Foundation:** tokens, fonts, theme toggle, frame, nav, footer shell, deletion of the Greek code, and the content schema migration with the six projects.
3. **Sections:** hero (static first), statement/pillars, projects plus filters and learning log, toolkit, commit-log, about, off-the-clock, contact.
4. **Interactions:** spectrogram, bug bash, cursor trail, console egg.
5. **Polish:** mobile pass, dark mode pass against the reference, accessibility, metadata/OG, 404, Lighthouse (report the scores), and an updated README explaining how to add a project and edit content.
6. **Pause and summarise** what changed. Don't merge to `main` until I say so.

## 7. Done when

- [ ] `npm run build` and `npm run lint` pass with zero errors
- [ ] Side by side with `design-reference/index.html`, desktop and phone, light and dark, it looks the same
- [ ] All six projects render from `content/projects/*.md`, and the filters and counts work
- [ ] `npm run add-project` creates a valid file that shows up on the page
- [ ] An invalid project file fails the build with a clear message
- [ ] Spectrogram toggle, bug bash, cursor trail and theme toggle all work, and all behave under reduced motion
- [ ] No Greek-theme code or dependencies left on the branch
