import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
// Relative with an extension: scripts/add-project.ts runs this file directly on Node.
import { ProjectSchema, type ProjectData } from "./schemas.ts";

export { PROJECT_STATUSES, ProjectSchema, type ProjectStatus } from "./schemas.ts";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export type Project = ProjectData & { slug: string };

function isContentFile(filename: string) {
  return filename.endsWith(".md") && !filename.startsWith("_");
}

/** "  - links.0.url: Enter a full URL ..." lines for a build error. */
export function formatIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => `  - ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/**
 * Reads and validates every Markdown file under content/projects. Throws a
 * build-failing error naming the offending file and field when a file doesn't
 * match ProjectSchema. Only the frontmatter is used.
 */
function loadProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  return fs
    .readdirSync(PROJECTS_DIR)
    .filter(isContentFile)
    .map((filename) => {
      const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
      const result = ProjectSchema.safeParse(matter(raw).data);
      if (!result.success) {
        throw new Error(
          `Invalid project file: content/projects/${filename}\n${formatIssues(result.error.issues)}`,
        );
      }
      return { ...result.data, slug: filename.replace(/\.md$/, "") };
    });
}

/** Lower `order` first; projects without one go last, by title. */
export function compareProjects(
  a: { order?: number; title: string },
  b: { order?: number; title: string },
): number {
  const orderA = a.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title);
}

let cache: Project[] | null = null;

export function getAllProjects(): Project[] {
  if (cache) return cache;
  cache = loadProjects().sort(compareProjects);
  return cache;
}

/** Filter tags in first-seen project order, e.g. ["ml", "data", "web", "software"]. */
export function getAllTags(): string[] {
  return Array.from(new Set(getAllProjects().flatMap((project) => project.tags)));
}
