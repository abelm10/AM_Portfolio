"use client";

import { ToolkitSchema, type ToolkitRow } from "@/lib/schemas";
import ChipInput from "./ChipInput";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { FieldError, fieldProps, replaceItem } from "./ui";

export default function ToolkitEditor(props: JsonEditorProps<ToolkitRow[]>) {
  const { draft: rows, setDraft, save, dirty, err, fieldErrors, result, pending } = useJsonEditor("toolkit", ToolkitSchema, props);
  const setRow = (r: number, row: ToolkitRow) => setDraft(replaceItem(rows, r, row));
  const errUnder = (prefix: string) =>
    Object.entries(fieldErrors).find(([key]) => key === prefix || key.startsWith(`${prefix}.`))?.[1];

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      {rows.map((row, r) => (
        <section className="admin-section" key={r}>
          <div className="field-row">
            <div className="field">
              <label htmlFor={`${r}.label`}>row name</label>
              <input className="input" {...fieldProps(`${r}.label`, err(`${r}.label`))} value={row.label} onChange={(e) => setRow(r, { ...row, label: e.target.value })} />
              <FieldError id={`${r}.label`} error={err(`${r}.label`)} />
            </div>
            <div className="field">
              <label htmlFor={`${r}.note`}>note</label>
              <input className="input" {...fieldProps(`${r}.note`, err(`${r}.note`))} value={row.note} onChange={(e) => setRow(r, { ...row, note: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${r}.items`}>chips</label>
            <ChipInput
              id={`${r}.items`}
              value={row.items}
              onChange={(items) => setRow(r, { ...row, items })}
              invalid={Boolean(errUnder(`${r}.items`))}
              describedBy={errUnder(`${r}.items`) ? `${r}.items-error` : undefined}
              placeholder="Add a tool"
            />
            <span className="hint">Enter or comma adds a chip. Click a chip to rename it, ✕ to remove it.</span>
            <FieldError id={`${r}.items`} error={errUnder(`${r}.items`)} />
          </div>
        </section>
      ))}
    </EditorShell>
  );
}
