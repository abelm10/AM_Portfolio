"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { FieldErrors, SaveResult, SaveSuccess } from "@/lib/admin/result";

// Small shared pieces for the admin editors.

// --- arrays ----------------------------------------------------------------------------

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const removeItem = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index);

export const replaceItem = <T,>(list: T[], index: number, item: T): T[] =>
  list.map((existing, i) => (i === index ? item : existing));

// --- saving ------------------------------------------------------------------------------

/** Runs a server action, keeps its result for the status line and field errors. */
export function useSaver() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);

  function run(action: () => Promise<SaveResult>, onSuccess?: (result: SaveSuccess) => void) {
    startTransition(async () => {
      let next: SaveResult;
      try {
        next = await action();
      } catch {
        next = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
      }
      setResult(next);
      if (next.ok) onSuccess?.(next);
    });
  }

  const fieldErrors: FieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  return { pending, result, setResult, run, fieldErrors };
}

/** "✓ committed a1b2c3d · the live site updates in about a minute", or the error. */
export function SaveStatusLine({ result, pending }: { result: SaveResult | null; pending?: boolean }) {
  if (pending) return <p className="status status-muted" role="status">saving…</p>;
  if (!result) return <p className="status status-muted" role="status" />;
  if (!result.ok) {
    return (
      <p className="status err" role="alert">
        {result.error}{" "}
        {result.conflict && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
            Reload
          </button>
        )}
      </p>
    );
  }
  const { status } = result;
  if (status.local) {
    return (
      <p className="status ok" role="status">
        ✓ saved to content/ on disk · local mode, nothing was committed
      </p>
    );
  }
  return (
    <p className="status ok" role="status">
      ✓ committed{" "}
      {status.commitUrl ? (
        <a href={status.commitUrl} target="_blank" rel="noopener">
          {status.shortSha}
        </a>
      ) : (
        status.shortSha
      )}{" "}
      · the live site updates in about a minute
      {status.deploymentsUrl && (
        <>
          {" "}
          ·{" "}
          <a href={status.deploymentsUrl} target="_blank" rel="noopener">
            deployments ↗
          </a>
        </>
      )}
    </p>
  );
}

/** Asks before leaving the page with unsaved edits. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

// --- fields --------------------------------------------------------------------------------

/** Props that tie an input to its error message for screen readers. */
export function fieldProps(id: string, error: string | undefined) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p className="field-error" id={`${id}-error`}>
      {error}
    </p>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      <FieldError id={id} error={error} />
    </div>
  );
}

// --- list controls -------------------------------------------------------------------------

export function ItemControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  /** What the item is, for screen readers: "point 2", "link Repo" ... */
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="list-item-controls">
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
      <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${label}`} onClick={() => onRemove(index)}>
        ✕
      </button>
    </div>
  );
}

/** "Delete fakewave/?  Yes, delete / Cancel", in the page, never confirm(). */
export function ConfirmDelete({
  what,
  onConfirm,
  disabled,
  label = "Delete",
}: {
  what: string;
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const [asking, setAsking] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  // Keep keyboard focus sensible: onto Cancel when asking, back to Delete afterwards.
  useEffect(() => {
    if (asking) cancelRef.current?.focus();
    else if (wasAsking.current) deleteRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <button ref={deleteRef} type="button" className="btn btn-danger btn-sm" disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="confirm" role="group" aria-label={`Confirm deleting ${what}`}>
      <span>Delete {what}?</span>
      <button
        type="button"
        className="btn btn-danger solid btn-sm"
        disabled={disabled}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Yes, delete
      </button>
      <button ref={cancelRef} type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  );
}
