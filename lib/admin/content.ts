import "server-only";
import matter from "gray-matter";
import type { z } from "zod";
import { CONTENT_FILES, PROJECTS_DIR, projectPath, type ContentFileKey } from "@/lib/admin/paths";
import { FIX_FIELDS, validate, type SaveResult } from "@/lib/admin/result";
import { getStore, gitBlobSha, StoreError, type CommitInfo, type FileChange } from "@/lib/admin/store";
import { compareProjects, formatIssues } from "@/lib/projects";
import {
  AboutSchema,
  HobbiesSchema,
  LearningSchema,
  LogSchema,
  ProjectSchema,
  SiteSchema,
  slugify,
  ToolkitSchema,
  type ProjectData,
} from "@/lib/schemas";

// High-level content operations for the admin. Every write is validated with the build's own
// schemas here, on the server, whatever the form already checked.

const JSON_FILES = {
  site: { schema: SiteSchema, label: "settings" },
  about: { schema: AboutSchema, label: "about" },
  toolkit: { schema: ToolkitSchema, label: "toolkit" },
  log: { schema: LogSchema, label: "commit log" },
  learning: { schema: LearningSchema, label: "learning log" },
  hobbies: { schema: HobbiesSchema, label: "off the clock" },
} satisfies Record<ContentFileKey, { schema: z.ZodType; label: string }>;

export type JsonKey = keyof typeof JSON_FILES;
export type JsonData<K extends JsonKey> = z.infer<(typeof JSON_FILES)[K]["schema"]>;

function deploymentsUrl(): string | null {
  const url = process.env.VERCEL_DEPLOYMENTS_URL;
  return url && /^https:\/\/vercel\.com\//.test(url) ? url : null;
}

function success(commit: CommitInfo, shas: Record<string, string | null>, slug?: string): SaveResult {
  return {
    ok: true,
    status: { local: commit.local, shortSha: commit.shortSha, commitUrl: commit.url, deploymentsUrl: deploymentsUrl() },
    shas,
    ...(slug ? { slug } : {}),
  };
}

function shasAfter(changes: FileChange[]): Record<string, string | null> {
  return Object.fromEntries(changes.map((c) => [c.path, c.content === null ? null : gitBlobSha(c.content)]));
}

// --- JSON files ------------------------------------------------------------------------

export function serializeJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export async function loadJson<K extends JsonKey>(key: K): Promise<{ data: JsonData<K>; sha: string }> {
  const path = CONTENT_FILES[key];
  const file = await getStore().read(path);
  if (!file) throw new StoreError(`${path} doesn't exist in the repository.`);
  let raw: unknown;
  try {
    raw = JSON.parse(file.content);
  } catch (error) {
    throw new StoreError(`${path} isn't valid JSON, so it can't be edited here: ${(error as Error).message}`);
  }
  const result = JSON_FILES[key].schema.safeParse(raw);
  if (!result.success) {
    throw new StoreError(`${path} doesn't match its schema, so it can't be edited here:\n${formatIssues(result.error.issues)}`);
  }
  return { data: result.data as JsonData<K>, sha: file.sha };
}

/** "admin: update about (bio, experience)" for objects; "admin: update toolkit" for lists. */
function describeJsonChange(key: JsonKey, before: unknown, after: unknown): string {
  const base = `admin: update ${JSON_FILES[key].label}`;
  if (!before || typeof before !== "object" || Array.isArray(before) || !after || typeof after !== "object") return base;
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const changed = keys.filter(
    (k) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify((after as Record<string, unknown>)[k]),
  );
  return changed.length > 0 && changed.length <= 4 ? `${base} (${changed.join(", ")})` : base;
}

export async function saveJson(key: JsonKey, input: unknown, expectedSha: unknown): Promise<SaveResult> {
  if (typeof expectedSha !== "string") return { ok: false, error: "Reload the page and try again." };
  const checked = validate(JSON_FILES[key].schema, input);
  if (!checked.ok) return { ok: false, error: FIX_FIELDS, fieldErrors: checked.fieldErrors };

  const path = CONTENT_FILES[key];
  const store = getStore();
  const current = await store.read(path);
  let before: unknown = null;
  try {
    before = current ? JSON.parse(current.content) : null;
  } catch {
    // An unparseable file still gets replaced; the commit message just stays generic.
  }
  const content = serializeJson(checked.data);
  if (current && current.sha === expectedSha && current.content === content) {
    return { ok: false, error: "No changes to save." };
  }

  const changes: FileChange[] = [{ path, content, expectedSha }];
  const commit = await store.commit(changes, describeJsonChange(key, before, checked.data));
  return success(commit, shasAfter(changes));
}

// --- projects --------------------------------------------------------------------------

export type ProjectEntry = {
  slug: string;
  sha: string;
  project: ProjectData | null;
  /** Set when the file in the repo doesn't match the schema; it can only be deleted here. */
  error?: string;
};

/** Frontmatter in schema field order, so files read the same whether written here or by hand. */
export function serializeProject(project: ProjectData): string {
  const ordered = {
    title: project.title,
    status: project.status,
    tags: project.tags,
    blurb: project.blurb,
    ...(project.metric ? { metric: project.metric } : {}),
    points: project.points,
    stack: project.stack,
    links: project.links.map((link) => ({
      label: link.label,
      url: link.url,
      ...(link.primary ? { primary: true } : {}),
    })),
    ...(project.order !== undefined ? { order: project.order } : {}),
  };
  const out = matter.stringify("", ordered);
  return out.endsWith("\n") ? out : `${out}\n`;
}

function parseProject(content: string): { project: ProjectData | null; error?: string } {
  try {
    const result = ProjectSchema.safeParse(matter(content).data);
    return result.success ? { project: result.data } : { project: null, error: formatIssues(result.error.issues) };
  } catch (error) {
    return { project: null, error: `Unreadable frontmatter: ${(error as Error).message}` };
  }
}

const slugOf = (path: string) => path.split("/").pop()!.replace(/\.md$/, "");

export async function loadProjects(): Promise<ProjectEntry[]> {
  const store = getStore();
  const listed = await store.listMarkdown(PROJECTS_DIR);
  const files = await Promise.all(listed.map((entry) => store.read(entry.path)));
  const entries = files
    .filter((file) => file !== null)
    .map((file) => ({ slug: slugOf(file.path), sha: file.sha, ...parseProject(file.content) }));
  const valid = entries.filter((e) => e.project).sort((a, b) => compareProjects(a.project!, b.project!));
  return [...valid, ...entries.filter((e) => !e.project)];
}

export async function loadProject(slug: string): Promise<{ project: ProjectData; sha: string } | null> {
  const file = await getStore().read(projectPath(slug));
  if (!file) return null;
  const parsed = parseProject(file.content);
  if (!parsed.project) {
    throw new StoreError(`content/projects/${slug}.md doesn't match the schema, so it can't be edited here:\n${parsed.error}`);
  }
  return { project: parsed.project, sha: file.sha };
}

export async function createProject(input: unknown): Promise<SaveResult> {
  const checked = validate(ProjectSchema, input);
  if (!checked.ok) return { ok: false, error: FIX_FIELDS, fieldErrors: checked.fieldErrors };

  // The slug comes from the validated title and stays fixed from here on.
  const slug = slugify(checked.data.title);
  const path = projectPath(slug);
  const store = getStore();
  if (await store.read(path)) {
    return {
      ok: false,
      error: FIX_FIELDS,
      fieldErrors: { title: `A project with the file name ${slug}.md already exists. Pick a different title.` },
    };
  }

  let project = checked.data;
  if (project.order === undefined) {
    const orders = (await loadProjects()).map((e) => e.project?.order).filter((o): o is number => o !== undefined);
    project = { ...project, order: orders.length ? Math.max(...orders) + 1 : 1 };
  }

  const changes: FileChange[] = [{ path, content: serializeProject(project), expectedSha: null }];
  const commit = await store.commit(changes, `admin: add project ${slug}`);
  return success(commit, shasAfter(changes), slug);
}

/** "admin: update project fakewave", or "admin: set fakewave status to live" when that's all that changed. */
function describeProjectChange(slug: string, before: ProjectData | null, after: ProjectData): string {
  if (before && before.status !== after.status && serializeProject({ ...before, status: after.status }) === serializeProject(after)) {
    return `admin: set ${slug} status to ${after.status}`;
  }
  return `admin: update project ${slug}`;
}

export async function updateProject(slug: unknown, input: unknown, expectedSha: unknown): Promise<SaveResult> {
  const path = projectPath(slug);
  if (typeof expectedSha !== "string") return { ok: false, error: "Reload the page and try again." };
  const checked = validate(ProjectSchema, input);
  if (!checked.ok) return { ok: false, error: FIX_FIELDS, fieldErrors: checked.fieldErrors };

  const store = getStore();
  const current = await store.read(path);
  const content = serializeProject(checked.data);
  if (current && current.sha === expectedSha && current.content === content) {
    return { ok: false, error: "No changes to save." };
  }
  const before = current ? parseProject(current.content).project : null;

  const changes: FileChange[] = [{ path, content, expectedSha }];
  const commit = await store.commit(changes, describeProjectChange(slug as string, before, checked.data));
  return success(commit, shasAfter(changes));
}

export async function deleteProject(slug: unknown, expectedSha: unknown): Promise<SaveResult> {
  const path = projectPath(slug);
  if (typeof expectedSha !== "string") return { ok: false, error: "Reload the page and try again." };
  const changes: FileChange[] = [{ path, content: null, expectedSha }];
  const commit = await getStore().commit(changes, `admin: delete project ${slug as string}`);
  return success(commit, shasAfter(changes));
}

/**
 * Moves a project one place up or down. Orders are renumbered 1..n in the new sequence and every
 * file whose order changes goes into a single commit. `knownShas` is the list the admin was looking
 * at; if any file it would touch has changed since, nothing is written.
 */
export async function moveProject(slug: unknown, direction: unknown, knownShas: unknown): Promise<SaveResult> {
  projectPath(slug); // validates the slug
  if (direction !== "up" && direction !== "down") return { ok: false, error: "Unknown direction." };
  if (!knownShas || typeof knownShas !== "object") return { ok: false, error: "Reload the page and try again." };
  const shas = knownShas as Record<string, unknown>;

  const entries = (await loadProjects()).filter((e) => e.project);
  const from = entries.findIndex((e) => e.slug === slug);
  if (from < 0) return { ok: false, error: "That project no longer exists. Reload to get the latest.", conflict: true };
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= entries.length) return { ok: false, error: `It's already at the ${direction === "up" ? "top" : "bottom"}.` };

  const reordered = [...entries];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

  const changes: FileChange[] = [];
  reordered.forEach((entry, i) => {
    const order = i + 1;
    if (entry.project!.order === order) return;
    const expected = shas[entry.slug];
    changes.push({
      path: projectPath(entry.slug),
      content: serializeProject({ ...entry.project!, order }),
      // Unknown to the admin's view means it changed underneath them.
      expectedSha: typeof expected === "string" ? expected : "(not in the list you loaded)",
    });
  });

  const commit = await getStore().commit(changes, `admin: move ${slug as string} ${direction}`);
  return success(commit, shasAfter(changes));
}
