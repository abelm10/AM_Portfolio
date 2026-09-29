"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** One-click additions, e.g. existing tags. Ones already added are hidden. */
  suggestions?: string[];
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
};

/**
 * Chips with add (Enter or comma), remove (✕ or Backspace on an empty input) and rename
 * (click a chip's text, edit, Enter to keep, Esc to cancel).
 */
export default function ChipInput({ id, value, onChange, suggestions = [], invalid, describedBy, placeholder }: Props) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);

  function add(raw: string) {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !value.includes(s));
    if (items.length) onChange([...value, ...Array.from(new Set(items))]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  function commitRename() {
    if (!editing) return;
    const text = editing.text.trim();
    if (text && !value.some((v, i) => v === text && i !== editing.index)) {
      onChange(value.map((v, i) => (i === editing.index ? text : v)));
    }
    setEditing(null);
  }

  const open = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="field-stack" style={{ display: "grid", gap: 8 }}>
      <div className="chip-input" aria-invalid={invalid || undefined}>
        {value.map((item, index) =>
          editing?.index === index ? (
            <input
              key={`edit-${index}`}
              className="chip"
              aria-label={`Rename ${item}`}
              value={editing.text}
              autoFocus
              size={Math.max(4, editing.text.length)}
              onChange={(e) => setEditing({ index, text: e.target.value })}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  setEditing(null);
                }
              }}
            />
          ) : (
            <span className="chip" key={`${item}-${index}`}>
              <button type="button" aria-label={`Rename ${item}`} onClick={() => setEditing({ index, text: item })} style={{ padding: 0, color: "inherit" }}>
                {item}
              </button>
              <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>
                ✕
              </button>
            </span>
          ),
        )}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          aria-describedby={describedBy}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>
      {open.length > 0 && (
        <div className="suggestions" aria-label="Suggestions">
          {open.map((s) => (
            <button key={s} type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...value, s])}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
