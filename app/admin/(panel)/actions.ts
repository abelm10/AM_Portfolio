"use server";

// Every admin write. Each action checks the session and allow-list on the server (runAdminAction)
// and validates its input with the build's schemas (lib/admin/content.ts). Arguments arrive from
// the browser, so they're treated as unknown until validated.

import {
  createProject,
  deleteProject,
  moveProject,
  saveJson,
  setProjectStatus,
  updateProject,
  type JsonKey,
} from "@/lib/admin/content";
import type { SaveResult } from "@/lib/admin/result";
import { runAdminAction } from "@/lib/admin/run";

const JSON_KEYS: readonly JsonKey[] = ["site", "about", "toolkit", "log", "learning", "hobbies"];

export async function saveProjectAction(slug: unknown, input: unknown, expectedSha: unknown): Promise<SaveResult> {
  return runAdminAction(() => (slug === null ? createProject(input) : updateProject(slug, input, expectedSha)));
}

export async function setProjectStatusAction(slug: unknown, status: unknown, expectedSha: unknown): Promise<SaveResult> {
  return runAdminAction(() => setProjectStatus(slug, status, expectedSha));
}

export async function deleteProjectAction(slug: unknown, expectedSha: unknown): Promise<SaveResult> {
  return runAdminAction(() => deleteProject(slug, expectedSha));
}

export async function moveProjectAction(slug: unknown, direction: unknown, knownShas: unknown): Promise<SaveResult> {
  return runAdminAction(() => moveProject(slug, direction, knownShas));
}

export async function saveJsonAction(key: unknown, input: unknown, expectedSha: unknown): Promise<SaveResult> {
  return runAdminAction(async () => {
    if (!JSON_KEYS.includes(key as JsonKey)) return { ok: false, error: "Unknown content file." };
    return saveJson(key as JsonKey, input, expectedSha);
  });
}
