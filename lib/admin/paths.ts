import "server-only";
import { SLUG_PATTERN } from "@/lib/schemas";

// The only files the admin may write. Paths are always built here, from a fixed name or a
// validated slug, never from raw request input.

export const CONTENT_FILES = {
  site: "content/site.json",
  about: "content/about.json",
  toolkit: "content/toolkit.json",
  log: "content/log.json",
  learning: "content/learning.json",
  hobbies: "content/hobbies.json",
} as const;

export type ContentFileKey = keyof typeof CONTENT_FILES;

export const PROJECTS_DIR = "content/projects";

const PROJECT_PATH = /^content\/projects\/[a-z0-9-]+\.md$/;

export class InvalidPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPathError";
  }
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 60 && SLUG_PATTERN.test(slug);
}

export function projectPath(slug: unknown): string {
  if (!isValidSlug(slug)) throw new InvalidPathError(`Not a valid project slug: ${JSON.stringify(slug)}`);
  return `${PROJECTS_DIR}/${slug}.md`;
}

/** Last line of defence in the store: refuses anything outside the known content files. */
export function assertWritablePath(path: string): void {
  const known = (Object.values(CONTENT_FILES) as string[]).includes(path);
  if (!known && !PROJECT_PATH.test(path)) throw new InvalidPathError(`Refusing to write ${path}`);
}
