"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { z } from "zod";
import { saveJsonAction } from "@/app/admin/(panel)/actions";
import { FIX_FIELDS, validate, type FieldErrors, type SaveResult } from "@/lib/admin/result";
import { SaveStatusLine, useSaver, useUnsavedWarning } from "./ui";

export type JsonFileKey = "site" | "about" | "toolkit" | "log" | "learning" | "hobbies";

export type JsonEditorProps<T> = { data: T; sha: string; path: string };

/** Draft state + save for one content/*.json file. */
export function useJsonEditor<T>(key: JsonFileKey, schema: z.ZodType, { data, sha, path }: JsonEditorProps<T>) {
  const [draft, setDraft] = useState<T>(data);
  const [currentSha, setCurrentSha] = useState(sha);
  const [saved, setSaved] = useState(() => JSON.stringify(data));
  const saver = useSaver();
  const dirty = JSON.stringify(draft) !== saved;
  useUnsavedWarning(dirty);

  function save() {
    // Same schema as the server: instant field errors. The server validates again regardless.
    const checked = validate(schema, draft);
    if (!checked.ok) {
      saver.setResult({ ok: false, error: FIX_FIELDS, fieldErrors: checked.fieldErrors });
      return;
    }
    const sent = draft;
    saver.run(
      () => saveJsonAction(key, sent, currentSha),
      (res) => {
        const next = res.shas[path];
        if (next) setCurrentSha(next);
        setSaved(JSON.stringify(sent));
      },
    );
  }

  const err = (fieldPath: string) => saver.fieldErrors[fieldPath];
  return { draft, setDraft, save, dirty, err, ...saver };
}

/** The form wrapper: focuses the first invalid field after a failed save, sticky save bar. */
export function EditorShell({
  onSave,
  result,
  pending,
  dirty,
  children,
}: {
  onSave: () => void;
  result: SaveResult | null;
  pending: boolean;
  dirty: boolean;
  fieldErrors?: FieldErrors;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result && !result.ok && result.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [result]);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {children}
      <div className="save-bar">
        <SaveStatusLine result={result} pending={pending} />
        <div className="admin-toolbar">
          {dirty && !pending && <span className="status status-muted">unsaved changes</span>}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
