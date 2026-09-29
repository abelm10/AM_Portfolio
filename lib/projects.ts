import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export const ProjectSchema = z.object({
  title: z.string(),
  tagline: z.string().max(120),
  kind: z.enum(["ml", "app", "analysis"]),
  status: z.enum(["shipped", "in-progress", "archived"]),
  source: z.enum(["github", "manual"]),
  repo: z.string().url().optional(),
  demo: z.string().url().optional(),
  cover: z.string().optional(),
  stack: z.array(z.string()),
  tags: z.array(z.string()),
  features: z.array(z.string()).optional(),
  modelCard: z
    .object({
      problem: z.string(),
      data: z.string(),
      approach: z.string(),
      metrics: z.array(z.object({ label: z.string(), value: z.string() })),
      perClass: z
        .array(z.object({ label: z.string(), score: z.number() }))
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "date must be in YYYY-MM format")
    .optional(),
  featured: z.boolean().default(false),
  order: z.number().optional(),
});

export type ProjectFrontmatter = z.infer<typeof ProjectSchema>;

export type Project = ProjectFrontmatter & {
  slug: string;
  body: string;
};

function isContentFile(filename: string) {
  return filename.endsWith(".md") && !filename.startsWith("_");
}

/**
 * Reads and validates every hand-authored Markdown file under
 * content/projects. Throws a build-failing error naming the offending
 * file and field when a file doesn't match ProjectSchema.
 */
function loadManualProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  return fs
    .readdirSync(PROJECTS_DIR)
    .filter(isContentFile)
    .map((filename) => {
      const fullPath = path.join(PROJECTS_DIR, filename);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);

      const result = ProjectSchema.safeParse(data);
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("\n");
        throw new Error(
          `Invalid project file: content/projects/${filename}\n${issues}`,
        );
      }

      const slug = filename.replace(/\.md$/, "");
      return { ...result.data, slug, body: content.trim() };
    });
}

/**
 * Placeholder for a future GitHub-backed source. Wiring this up (e.g. via
 * the GitHub REST API at build time) and merging its output into
 * getAllProjects() below is intended to be the *only* change needed to
 * support `source: "github"` projects that are fetched rather than
 * hand-authored — the cards, modal and schema already support it.
 */
function loadGithubProjects(): Project[] {
  return [];
}

let cache: Project[] | null = null;

export function getAllProjects(): Project[] {
  if (cache) return cache;

  const projects = [...loadManualProjects(), ...loadGithubProjects()];

  projects.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;

    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;

    const dateA = a.date ?? "0000-00";
    const dateB = b.date ?? "0000-00";
    return dateA < dateB ? 1 : dateA > dateB ? -1 : 0;
  });

  cache = projects;
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((project) => project.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const project of getAllProjects()) {
    for (const tag of project.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}
