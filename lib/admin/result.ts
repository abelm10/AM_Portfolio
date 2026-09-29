import type { z } from "zod";

// Shared by server actions and the admin forms (no server-only imports here).

/** Field path → message, e.g. { "links.0.url": "Enter a full URL, starting with https://" }. */
export type FieldErrors = Record<string, string>;

export type SaveStatus = {
  local: boolean;
  shortSha: string;
  commitUrl: string | null;
  deploymentsUrl: string | null;
};

export type SaveSuccess = {
  ok: true;
  status: SaveStatus;
  /** New file shas after the save, by path (null = deleted), so editing can continue without a reload. */
  shas: Record<string, string | null>;
  /** Set when the save created something, e.g. the new project's slug. */
  slug?: string;
};

export type SaveFailure = {
  ok: false;
  error: string;
  fieldErrors?: FieldErrors;
  /** The file changed on GitHub since the editor loaded it. */
  conflict?: boolean;
};

export type SaveResult = SaveSuccess | SaveFailure;

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; fieldErrors: FieldErrors } {
  const result = schema.safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, fieldErrors: fieldErrorsFrom(result.error) };
}

export const FIX_FIELDS = "Some fields need fixing. Nothing was saved.";
