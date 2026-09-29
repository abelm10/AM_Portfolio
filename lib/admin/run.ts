import "server-only";
import { InvalidPathError } from "@/lib/admin/paths";
import type { SaveResult } from "@/lib/admin/result";
import { assertAdmin, NotAdminError } from "@/lib/admin/session";
import { ConflictError, StoreError } from "@/lib/admin/store";

/**
 * Every admin server action runs through here: the session and the ID allow-list are checked on
 * the server first, then known failures become messages the form can show.
 */
export async function runAdminAction(action: () => Promise<SaveResult>): Promise<SaveResult> {
  try {
    await assertAdmin();
    return await action();
  } catch (error) {
    if (error instanceof NotAdminError) return { ok: false, error: error.message };
    if (error instanceof ConflictError) return { ok: false, error: error.message, conflict: true };
    if (error instanceof StoreError) return { ok: false, error: error.message };
    if (error instanceof InvalidPathError) return { ok: false, error: "That isn't a file the admin can change." };
    console.error("[admin] save failed", error);
    return { ok: false, error: "Something went wrong while saving. Reload to check whether it went through." };
  }
}
