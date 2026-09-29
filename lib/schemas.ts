// The single source of truth for what valid content looks like. Used by the build (lib/content.ts,
// lib/projects.ts), `npm run add-project`, and every admin save. No file-system access here, so the
// admin forms can import it in the browser too.
//
// Imports must stay relative with explicit extensions (none needed today): scripts/add-project.ts
// runs this file directly on Node.

import { z } from "zod";

// Messages are written for the admin form, where each shows next to its field.

/** http(s) only: these end up in href attributes, so no javascript: or data: URLs. */
const webUrl = (what = "a full URL") =>
  z.url({ protocol: /^https?$/, error: `Enter ${what}, starting with https://` });

const text = (message: string) => z.string({ error: message }).trim().min(1, message);

/** A GitHub repository name, as it appears in github.com/abelm10/<name>. */
const repoName = z
  .string({ error: "Add the repo name" })
  .trim()
  .regex(/^[A-Za-z0-9._-]+$/, "Use the repo's name exactly as on GitHub, e.g. FakeWave");

// --- projects ------------------------------------------------------------------

export const PROJECT_STATUSES = ["live", "in development", "completed", "case study"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Slugs name project files: content/projects/<slug>.md. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** "Weather Classification/" → "weather-classification" */
export function slugify(title: string): string {
  return title
    .replace(/\/+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export const ProjectLinkSchema = z.strictObject({
  label: text("Add a label for this link"),
  url: webUrl(),
  primary: z.boolean().optional(),
});

export const ProjectSchema = z.strictObject({
  title: text("Add a title")
    .max(80, "Keep the title under 80 characters")
    .endsWith("/", 'End the title with "/", e.g. "fakewave/"')
    .refine((title) => slugify(title) !== "", "The title needs at least one letter or number"),
  status: z.enum(PROJECT_STATUSES, { error: "Pick a status" }),
  tags: z.array(text("Tags can't be empty")).min(1, "Add at least one tag"),
  blurb: text("Add a short blurb").max(400, "Keep the blurb under 400 characters"),
  metric: z
    .strictObject({
      value: text("Add the metric's value, e.g. 64.7%"),
      label: text("Say what the number means"),
    })
    .optional(),
  points: z.array(text("Fill in this point or remove it")),
  stack: z.array(text("Stack items can't be empty")),
  links: z.array(ProjectLinkSchema).min(1, "Add at least one link"),
  order: z.number({ error: "Order must be a number" }).int("Order must be a whole number").optional(),
});

export type ProjectData = z.infer<typeof ProjectSchema>;

// --- site ----------------------------------------------------------------------

export const SiteSchema = z.strictObject({
  name: text("Add your name"),
  handle: text("Add your handle"),
  url: webUrl("the site's address"),
  role: text("Add your role"),
  location: text("Add your location"),
  university: text("Add your university"),
  github: webUrl("your GitHub profile URL"),
  linkedin: webUrl("your LinkedIn profile URL"),
  kaggle: webUrl("the Kaggle URL"),
  email: z.union([z.email({ error: "Enter a valid email address, or leave it empty" }), z.literal("")]).optional(),
});

export type Site = z.infer<typeof SiteSchema>;

// --- about ---------------------------------------------------------------------

// Shared by experience and education; rendered as "title, org · period".
export const TimelineItemSchema = z.strictObject({
  title: text("Add a title, e.g. Data Science Intern"),
  org: z.string().trim().min(1).optional(),
  period: z.string().trim().min(1).optional(),
});

export const AboutSchema = z.strictObject({
  bio: text("Add a bio"),
  motto: text("Add a motto"),
  facts: z.array(
    z.strictObject({
      key: text("Add a key, e.g. based_in"),
      value: text("Add a value"),
    }),
  ),
  experience: z.array(TimelineItemSchema),
  // Shown in the experience row while `experience` is empty.
  experiencePending: z.string().trim().optional(),
  education: z.array(TimelineItemSchema),
});

export type About = z.infer<typeof AboutSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

// --- toolkit -------------------------------------------------------------------

export const ToolkitRowSchema = z.strictObject({
  label: text("Add a row name, e.g. languages"),
  note: z.string().trim(),
  items: z.array(text("Chips can't be empty")),
});

export const ToolkitSchema = z.array(ToolkitRowSchema);
export type ToolkitRow = z.infer<typeof ToolkitRowSchema>;

// --- commit log ------------------------------------------------------------------

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

export const LogGroupSchema = z.strictObject({
  month: z
    .string({ error: "Add the month" })
    .trim()
    .regex(new RegExp(`^(${MONTHS})\\d{2}_$`), "Write the month like sep26_"),
  note: z.string().trim(),
  items: z.array(
    z.strictObject({
      date: z
        .string({ error: "Add the date" })
        .trim()
        .regex(new RegExp(`^\\d{2} (${MONTHS})$`), "Write the date like 22 sep"),
      repo: repoName,
      text: z.string().trim(),
    }),
  ),
});

export const LogSchema = z.array(LogGroupSchema);
export type LogGroup = z.infer<typeof LogGroupSchema>;

// --- learning log ----------------------------------------------------------------

export const LearningRepoSchema = z.strictObject({
  name: repoName,
  note: z.string().trim(),
});

export const LearningSchema = z.array(LearningRepoSchema);
export type LearningRepo = z.infer<typeof LearningRepoSchema>;

// --- off the clock ---------------------------------------------------------------

export const HobbySchema = z.strictObject({
  title: text("Add a title, e.g. football/"),
  // Scoreboard lines; wrap a part in *asterisks* to highlight it.
  board: z.array(z.string()).min(1, "Add at least one scoreboard line"),
  text: text("Add a description"),
});

export const HobbiesSchema = z.array(HobbySchema);
export type Hobby = z.infer<typeof HobbySchema>;
