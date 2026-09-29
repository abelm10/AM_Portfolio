import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import nodePath from "node:path";
import { assertWritablePath } from "@/lib/admin/paths";

// Reads and writes content files, either through the GitHub API (default: every save is a commit
// on the branch Vercel deploys) or straight on disk (ADMIN_LOCAL_WRITES=true, local only).

export type StoredFile = { path: string; content: string; sha: string };

/**
 * One file to write. `expectedSha` is the version the editor opened: the save is refused if the
 * file has changed since. `null` means "this file must not exist yet" (creating a project).
 * `content: null` deletes the file.
 */
export type FileChange = { path: string; content: string | null; expectedSha: string | null };

export type CommitInfo = { sha: string; shortSha: string; url: string | null; local: boolean };

export interface ContentStore {
  readonly mode: "github" | "local";
  read(path: string): Promise<StoredFile | null>;
  /** Markdown files in a directory, skipping "_" templates. */
  listMarkdown(dir: string): Promise<{ path: string; sha: string }[]>;
  /** Writes all changes as one commit (one save), or throws ConflictError without writing anything. */
  commit(changes: FileChange[], message: string): Promise<CommitInfo>;
}

export class ConflictError extends Error {
  constructor() {
    super("This changed since you opened it. Reload to get the latest.");
    this.name = "ConflictError";
  }
}

/** A problem worth showing the admin as-is (bad token, rate limit, missing config ...). */
export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

/** Git's blob hash, so a file has the same sha on disk as on GitHub. */
export function gitBlobSha(content: string): string {
  const bytes = Buffer.from(content, "utf8");
  return crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

/** Local writes are for development only; they're ignored on Vercel even if the variable is set. */
export function localWritesEnabled(): boolean {
  return process.env.ADMIN_LOCAL_WRITES === "true" && !process.env.VERCEL;
}

export function getStore(): ContentStore {
  return localWritesEnabled() ? localStore : githubStore();
}

function isMarkdownContent(name: string) {
  return name.endsWith(".md") && !name.startsWith("_");
}

// --- GitHub --------------------------------------------------------------------------

class GitHubHttpError extends Error {
  constructor(
    readonly status: number,
    readonly githubMessage: string,
  ) {
    super(`GitHub ${status}: ${githubMessage}`);
  }
}

function githubStore(): ContentStore {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) {
    throw new StoreError(
      "GITHUB_CONTENT_TOKEN isn't set, so the admin can't read or save content. See ADMIN_SETUP.md, step 2.",
    );
  }
  const repo = process.env.GITHUB_REPO || "abelm10/AM_Portfolio";
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new StoreError(`GITHUB_REPO should look like owner/name, not "${repo}".`);
  if (!/^[\w./-]+$/.test(branch)) throw new StoreError(`GITHUB_BRANCH "${branch}" isn't a valid branch name.`);

  // Test-only override (a local mock of the GitHub API). Ignored on Vercel, so the token only
  // ever goes to api.github.com in production.
  const apiBase = (!process.env.VERCEL && process.env.GITHUB_API_URL) || "https://api.github.com";
  const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

  async function request<T>(method: string, apiPath: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${apiBase}/repos/${repo}${apiPath}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "abelm10-portfolio-admin",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
    } catch {
      throw new StoreError("Couldn't reach GitHub. Check your connection and try again.");
    }
    if (res.ok) return (res.status === 204 ? null : await res.json()) as T;

    const payload = (await res.json().catch(() => ({}))) as { message?: string };
    const message = payload.message ?? res.statusText;
    if (res.status === 401) {
      throw new StoreError(
        "GitHub rejected the token (401). It may have expired or been regenerated. See ADMIN_SETUP.md, “Renewing it”.",
      );
    }
    if ((res.status === 403 || res.status === 429) && (res.headers.get("x-ratelimit-remaining") === "0" || /rate limit/i.test(message))) {
      throw new StoreError("GitHub's rate limit is used up for now. Try again in a few minutes.");
    }
    if (res.status === 403) {
      throw new StoreError(`The token isn't allowed to do this. It needs “Contents: Read and write” on ${repo}.`);
    }
    throw new GitHubHttpError(res.status, message);
  }

  type ContentsFile = { type: string; path: string; sha: string; content?: string; encoding?: string };

  async function readAt(path: string, ref: string): Promise<StoredFile | null> {
    try {
      const file = await request<ContentsFile>("GET", `/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
      if (file.type !== "file" || file.encoding !== "base64" || file.content === undefined) {
        throw new StoreError(`${path} on GitHub isn't a readable file.`);
      }
      return { path, sha: file.sha, content: Buffer.from(file.content, "base64").toString("utf8") };
    } catch (error) {
      if (error instanceof GitHubHttpError && error.status === 404) return null;
      throw error;
    }
  }

  const commitInfo = (sha: string): CommitInfo => ({
    sha,
    shortSha: sha.slice(0, 7),
    url: `https://github.com/${repo}/commit/${sha}`,
    local: false,
  });

  /** One file: Contents API. GitHub's own sha precondition makes the write atomic. */
  async function commitOne(change: FileChange, message: string): Promise<CommitInfo> {
    // Read the current version right before writing, so a newer save is never overwritten.
    const current = await readAt(change.path, branch);
    if ((current?.sha ?? null) !== change.expectedSha) throw new ConflictError();

    try {
      if (change.content === null) {
        if (!current) throw new ConflictError();
        const res = await request<{ commit: { sha: string } }>("DELETE", `/contents/${encodePath(change.path)}`, {
          message,
          sha: current.sha,
          branch,
        });
        return commitInfo(res.commit.sha);
      }
      const res = await request<{ commit: { sha: string } }>("PUT", `/contents/${encodePath(change.path)}`, {
        message,
        branch,
        content: Buffer.from(change.content, "utf8").toString("base64"),
        ...(current ? { sha: current.sha } : {}),
      });
      return commitInfo(res.commit.sha);
    } catch (error) {
      // 409: sha no longer matches. 422: the file appeared (or vanished) in between.
      if (error instanceof GitHubHttpError && (error.status === 409 || error.status === 422)) throw new ConflictError();
      throw error;
    }
  }

  /** Several files in one commit: Git Data API, fast-forward only. */
  async function commitMany(changes: FileChange[], message: string): Promise<CommitInfo> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await request<{ object: { sha: string } }>("GET", `/git/ref/heads/${encodePath(branch)}`);
      const head = ref.object.sha;
      const headCommit = await request<{ tree: { sha: string } }>("GET", `/git/commits/${head}`);

      const current = await Promise.all(changes.map((change) => readAt(change.path, head)));
      changes.forEach((change, i) => {
        if ((current[i]?.sha ?? null) !== change.expectedSha) throw new ConflictError();
      });

      const tree = await request<{ sha: string }>("POST", "/git/trees", {
        base_tree: headCommit.tree.sha,
        tree: changes.map((change) =>
          change.content === null
            ? { path: change.path, mode: "100644", type: "blob", sha: null }
            : { path: change.path, mode: "100644", type: "blob", content: change.content },
        ),
      });
      const commit = await request<{ sha: string }>("POST", "/git/commits", {
        message,
        tree: tree.sha,
        parents: [head],
      });
      try {
        await request("PATCH", `/git/refs/heads/${encodePath(branch)}`, { sha: commit.sha, force: false });
        return commitInfo(commit.sha);
      } catch (error) {
        // Someone pushed between reading the head and updating it. Re-check the files and retry.
        if (error instanceof GitHubHttpError && error.status === 422) continue;
        throw error;
      }
    }
    throw new ConflictError();
  }

  return {
    mode: "github",
    read: (path) => readAt(path, branch),
    async listMarkdown(dir) {
      try {
        const entries = await request<ContentsFile[]>("GET", `/contents/${encodePath(dir)}?ref=${encodeURIComponent(branch)}`);
        return entries
          .filter((entry) => entry.type === "file" && isMarkdownContent(entry.path.split("/").pop() ?? ""))
          .map((entry) => ({ path: entry.path, sha: entry.sha }));
      } catch (error) {
        if (error instanceof GitHubHttpError && error.status === 404) {
          throw new StoreError(
            `GitHub couldn't find ${dir} in ${repo} on branch ${branch}. Check GITHUB_REPO and that the token covers this repository.`,
          );
        }
        throw error;
      }
    },
    async commit(changes, message) {
      if (changes.length === 0) throw new StoreError("Nothing to save.");
      changes.forEach((change) => assertWritablePath(change.path));
      try {
        return changes.length === 1 ? await commitOne(changes[0], message) : await commitMany(changes, message);
      } catch (error) {
        if (error instanceof GitHubHttpError) throw new StoreError(`GitHub refused the save: ${error.githubMessage}`);
        throw error;
      }
    },
  };
}

// --- local disk (development) ----------------------------------------------------------

const ROOT = process.cwd();
const CONTENT_ROOT = nodePath.join(ROOT, "content");

// The local store never runs on Vercel, so these paths are kept out of the deployment trace.
function diskPath(path: string): string {
  const full = nodePath.resolve(/*turbopackIgnore: true*/ ROOT, path);
  if (!full.startsWith(CONTENT_ROOT + nodePath.sep)) throw new StoreError(`Refusing to touch ${path}`);
  return full;
}

async function readDisk(path: string): Promise<StoredFile | null> {
  try {
    const content = await fs.readFile(/*turbopackIgnore: true*/ diskPath(path), "utf8");
    return { path, content, sha: gitBlobSha(content) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

const localStore: ContentStore = {
  mode: "local",
  read: readDisk,
  async listMarkdown(dir) {
    const names = await fs.readdir(/*turbopackIgnore: true*/ diskPath(dir));
    const files = await Promise.all(names.filter(isMarkdownContent).map((name) => readDisk(`${dir}/${name}`)));
    return files.filter((file): file is StoredFile => file !== null).map(({ path, sha }) => ({ path, sha }));
  },
  async commit(changes) {
    if (changes.length === 0) throw new StoreError("Nothing to save.");
    changes.forEach((change) => assertWritablePath(change.path));
    // Check every file first, so a conflict writes nothing.
    const current = await Promise.all(changes.map((change) => readDisk(change.path)));
    changes.forEach((change, i) => {
      if ((current[i]?.sha ?? null) !== change.expectedSha) throw new ConflictError();
    });
    for (const change of changes) {
      if (change.content === null) await fs.unlink(/*turbopackIgnore: true*/ diskPath(change.path));
      else await fs.writeFile(/*turbopackIgnore: true*/ diskPath(change.path), change.content, "utf8");
    }
    return { sha: "local", shortSha: "local", url: null, local: true };
  },
};
