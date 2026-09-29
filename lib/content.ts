import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import {
  AboutSchema,
  HobbiesSchema,
  LearningSchema,
  LogSchema,
  SiteSchema,
  ToolkitSchema,
  type About,
  type Hobby,
  type LearningRepo,
  type LogGroup,
  type Site,
  type ToolkitRow,
} from "@/lib/schemas";
import { formatIssues } from "@/lib/projects";

export type { About, Hobby, LearningRepo, LogGroup, Site, TimelineItem, ToolkitRow } from "@/lib/schemas";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Reads and validates content/<filename>. An invalid file fails the build with a readable message. */
function loadJson<T extends z.ZodType>(filename: string, schema: T): z.infer<T> {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid content file: content/${filename}\n  - ${(error as Error).message}`);
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content file: content/${filename}\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

export function getSite(): Site {
  return loadJson("site.json", SiteSchema);
}

/** Link to one of my repos by name, e.g. repoUrl("FakeWave"). */
export function repoUrl(repo: string): string {
  return `${getSite().github.replace(/\/$/, "")}/${repo}`;
}

export function getAbout(): About {
  return loadJson("about.json", AboutSchema);
}

export function getToolkit(): ToolkitRow[] {
  return loadJson("toolkit.json", ToolkitSchema);
}

export function getLog(): LogGroup[] {
  return loadJson("log.json", LogSchema);
}

export function getLearning(): LearningRepo[] {
  return loadJson("learning.json", LearningSchema);
}

export function getHobbies(): Hobby[] {
  return loadJson("hobbies.json", HobbiesSchema);
}
