import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson(filename: string): unknown {
  const fullPath = path.join(CONTENT_DIR, filename);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function fail(filename: string, error: z.ZodError): never {
  const issues = error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid content file: content/${filename}\n${issues}`);
}

// --- about.md ------------------------------------------------------------

const AboutSchema = z.object({
  quickFacts: z.array(z.object({ key: z.string(), value: z.string() })),
});

export type About = z.infer<typeof AboutSchema> & { body: string };

export function getAbout(): About {
  const fullPath = path.join(CONTENT_DIR, "about.md");
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const result = AboutSchema.safeParse(data);
  if (!result.success) fail("about.md", result.error);
  return { ...result.data, body: content.trim() };
}

// --- skills.json -----------------------------------------------------------

const SkillSchema = z.object({
  name: z.string(),
  level: z.number().min(0).max(100),
  category: z.enum(["languages", "ml", "data", "tools"]),
});

export type Skill = z.infer<typeof SkillSchema>;

export function getSkills(): Skill[] {
  const result = z.array(SkillSchema).safeParse(readJson("skills.json"));
  if (!result.success) fail("skills.json", result.error);
  return result.data;
}

// --- timeline.json ---------------------------------------------------------

const TimelineEntrySchema = z.object({
  hash: z.string().optional(),
  date: z.string(),
  type: z.enum(["feat", "fix", "chore", "release"]),
  title: z.string(),
  detail: z.string().optional(),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema> & {
  hash: string;
};

// Deterministic fake 7-char hash so entries without one still look like a
// real commit — same title always produces the same hash.
function fakeHash(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

export function getTimeline(): TimelineEntry[] {
  const result = z
    .array(TimelineEntrySchema)
    .safeParse(readJson("timeline.json"));
  if (!result.success) fail("timeline.json", result.error);
  return result.data.map((entry) => ({
    ...entry,
    hash: entry.hash ?? fakeHash(entry.title),
  }));
}

// --- hobbies.json ------------------------------------------------------------

const HobbySchema = z.object({
  name: z.string(),
  icon: z.string(),
  line: z.string(),
  joke: z.string(),
  relatedProject: z.string().optional(),
});

export type Hobby = z.infer<typeof HobbySchema>;

export function getHobbies(): Hobby[] {
  const result = z.array(HobbySchema).safeParse(readJson("hobbies.json"));
  if (!result.success) fail("hobbies.json", result.error);
  return result.data;
}
