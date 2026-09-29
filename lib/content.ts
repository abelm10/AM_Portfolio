import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import siteConfig from "@/content/site";

const CONTENT_DIR = path.join(process.cwd(), "content");

function fail(filename: string, error: z.ZodError): never {
  const issues = error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid content file: content/${filename}\n${issues}`);
}

function loadJson<T extends z.ZodType>(filename: string, schema: T): z.infer<T> {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid content file: content/${filename}\n  - ${(error as Error).message}`);
  }
  const result = schema.safeParse(data);
  if (!result.success) fail(filename, result.error);
  return result.data;
}

// --- site.ts -----------------------------------------------------------------

const SiteSchema = z.strictObject({
  name: z.string().min(1),
  handle: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  university: z.string().min(1),
  github: z.url(),
  linkedin: z.url(),
  kaggle: z.url(),
  email: z.union([z.email(), z.literal("")]).optional(),
});

export type Site = z.infer<typeof SiteSchema>;

export function getSite(): Site {
  const result = SiteSchema.safeParse(siteConfig);
  if (!result.success) fail("site.ts", result.error);
  return result.data;
}

/** Link to one of my repos by name, e.g. repoUrl("FakeWave"). */
export function repoUrl(repo: string): string {
  return `${getSite().github.replace(/\/$/, "")}/${repo}`;
}

// --- about.json --------------------------------------------------------------

// Shared by experience and education: rendered as "title, org · period".
const TimelineItemSchema = z.strictObject({
  title: z.string().min(1),
  org: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
});

const AboutSchema = z.strictObject({
  bio: z.string().min(1),
  motto: z.string().min(1),
  facts: z.array(z.strictObject({ key: z.string().min(1), value: z.string().min(1) })),
  experience: z.array(TimelineItemSchema),
  // Shown in the experience row while `experience` is empty.
  experiencePending: z.string().optional(),
  education: z.array(TimelineItemSchema),
});

export type About = z.infer<typeof AboutSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export function getAbout(): About {
  return loadJson("about.json", AboutSchema);
}

// --- toolkit.json ------------------------------------------------------------

const ToolkitRowSchema = z.strictObject({
  label: z.string().min(1),
  note: z.string(),
  items: z.array(z.string().min(1)),
});

export type ToolkitRow = z.infer<typeof ToolkitRowSchema>;

export function getToolkit(): ToolkitRow[] {
  return loadJson("toolkit.json", z.array(ToolkitRowSchema));
}

// --- log.json ----------------------------------------------------------------

const LogGroupSchema = z.strictObject({
  month: z.string().min(1),
  note: z.string(),
  items: z.array(
    z.strictObject({
      date: z.string().min(1),
      repo: z.string().min(1),
      text: z.string(),
    }),
  ),
});

export type LogGroup = z.infer<typeof LogGroupSchema>;

export function getLog(): LogGroup[] {
  return loadJson("log.json", z.array(LogGroupSchema));
}

// --- learning.json -----------------------------------------------------------

const LearningRepoSchema = z.strictObject({
  name: z.string().min(1),
  note: z.string(),
});

export type LearningRepo = z.infer<typeof LearningRepoSchema>;

export function getLearning(): LearningRepo[] {
  return loadJson("learning.json", z.array(LearningRepoSchema));
}

// --- hobbies.json ------------------------------------------------------------

const HobbySchema = z.strictObject({
  title: z.string().min(1),
  // Scoreboard lines; wrap a part in *asterisks* to highlight it.
  board: z.array(z.string()).min(1),
  text: z.string().min(1),
});

export type Hobby = z.infer<typeof HobbySchema>;

export function getHobbies(): Hobby[] {
  return loadJson("hobbies.json", z.array(HobbySchema));
}
