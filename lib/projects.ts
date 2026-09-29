import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export const PROJECT_STATUSES = [
  "live",
  "in development",
  "completed",
  "case study",
] as const;

export const ProjectSchema = z.strictObject({
  title: z.string().min(1).endsWith("/", 'title must end with "/", e.g. "fakewave/"'),
  status: z.enum(PROJECT_STATUSES),
  tags: z.array(z.string().min(1)).min(1, "add at least one tag"),
  blurb: z.string().min(1),
  metric: z
    .strictObject({ value: z.string().min(1), label: z.string().min(1) })
    .optional(),
  points: z.array(z.string().min(1)),
  stack: z.array(z.string().min(1)),
  links: z.array(
    z.strictObject({
      label: z.string().min(1),
      url: z.url(),
      primary: z.boolean().optional(),
    }),
  ),
  order: z.number().optional(),
});

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = z.infer<typeof ProjectSchema> & { slug: string };

function isContentFile(filename: string) {
  return filename.endsWith(".md") && !filename.startsWith("_");
}

/**
 * Reads and validates every Markdown file under content/projects. Throws a
 * build-failing error naming the offending file and field when a file
 * doesn't match ProjectSchema. Only the frontmatter is used.
 */
function loadProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  return fs
    .readdirSync(PROJECTS_DIR)
    .filter(isContentFile)
    .map((filename) => {
      const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
      const { data } = matter(raw);

      const result = ProjectSchema.safeParse(data);
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("\n");
        throw new Error(
          `Invalid project file: content/projects/${filename}\n${issues}`,
        );
      }

      return { ...result.data, slug: filename.replace(/\.md$/, "") };
    });
}

let cache: Project[] | null = null;

export function getAllProjects(): Project[] {
  if (cache) return cache;

  cache = loadProjects().sort((a, b) => {
    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
  return cache;
}

/** Filter tags in first-seen project order, e.g. ["ml", "data", "web", "software"]. */
export function getAllTags(): string[] {
  return Array.from(new Set(getAllProjects().flatMap((project) => project.tags)));
}
