import "server-only";
import { localWritesEnabled, StoreError } from "@/lib/admin/store";

export type Loaded<T> = { ok: true; value: T } | { ok: false; error: string };

/** Runs a loader for an admin page, turning GitHub/config problems into a message to show. */
export async function tryLoad<T>(load: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await load() };
  } catch (error) {
    if (error instanceof StoreError) return { ok: false, error: error.message };
    console.error("[admin] load failed", error);
    return { ok: false, error: "Couldn't load this content. Try reloading the page." };
  }
}

export { localWritesEnabled };
