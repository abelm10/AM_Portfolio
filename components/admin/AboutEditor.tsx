"use client";

import { AboutSchema, type About, type TimelineItem } from "@/lib/schemas";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { Field, FieldError, fieldProps, ItemControls, moveItem, removeItem, replaceItem } from "./ui";

function TimelineList({
  name,
  items,
  onChange,
  err,
  example,
}: {
  name: "experience" | "education";
  items: TimelineItem[];
  onChange: (items: TimelineItem[]) => void;
  err: (path: string) => string | undefined;
  example: TimelineItem;
}) {
  // Optional parts are dropped when empty, so the saved JSON stays tidy.
  const update = (i: number, patch: Partial<Record<keyof TimelineItem, string>>) => {
    const next = { ...items[i], ...patch };
    const clean: TimelineItem = { title: next.title };
    if (next.org) clean.org = next.org;
    if (next.period) clean.period = next.period;
    onChange(replaceItem(items, i, clean));
  };

  return (
    <div className="list-editor">
      {items.length === 0 && <p className="hint" style={{ margin: 0 }}>{`// no ${name} entries yet`}</p>}
      {items.map((item, i) => (
        <div className="list-item card-like" key={i}>
          <div className="field-row">
            {(["title", "org", "period"] as const).map((part) => (
              <div className="field" key={part}>
                <label htmlFor={`${name}.${i}.${part}`}>
                  {part}
                  {part !== "title" && " (optional)"}
                </label>
                <input
                  className="input"
                  placeholder={example[part]}
                  {...fieldProps(`${name}.${i}.${part}`, err(`${name}.${i}.${part}`))}
                  value={item[part] ?? ""}
                  onChange={(e) => update(i, { [part]: e.target.value })}
                />
                <FieldError id={`${name}.${i}.${part}`} error={err(`${name}.${i}.${part}`)} />
              </div>
            ))}
          </div>
          <ItemControls
            index={i}
            count={items.length}
            label={`${name} ${item.title || i + 1}`}
            onMove={(from, to) => onChange(moveItem(items, from, to))}
            onRemove={(index) => onChange(removeItem(items, index))}
          />
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { title: "" }])}>
          + Add {name}
        </button>
      </div>
    </div>
  );
}

export default function AboutEditor(props: JsonEditorProps<About>) {
  const { draft, setDraft, save, dirty, err, result, pending } = useJsonEditor("about", AboutSchema, props);
  const set = <K extends keyof About>(key: K, value: About[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      <section className="admin-section">
        <Field id="bio" label="bio" error={err("bio")}>
          <textarea className="textarea" rows={5} {...fieldProps("bio", err("bio"))} value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
        </Field>
        <Field id="motto" label="motto" error={err("motto")}>
          <input className="input" {...fieldProps("motto", err("motto"))} value={draft.motto} onChange={(e) => set("motto", e.target.value)} />
        </Field>
      </section>

      <section className="admin-section">
        <h2>{"// key/value rows"}</h2>
        <div className="list-editor">
          {draft.facts.map((fact, i) => (
            <div className="list-item" key={i}>
              <div className="field-row grid-kv">
                <div className="field">
                  <input
                    className="input"
                    aria-label={`Row ${i + 1} key`}
                    placeholder="based_in"
                    {...fieldProps(`facts.${i}.key`, err(`facts.${i}.key`))}
                    value={fact.key}
                    onChange={(e) => set("facts", replaceItem(draft.facts, i, { ...fact, key: e.target.value }))}
                  />
                  <FieldError id={`facts.${i}.key`} error={err(`facts.${i}.key`)} />
                </div>
                <div className="field">
                  <input
                    className="input"
                    aria-label={`Row ${i + 1} value`}
                    {...fieldProps(`facts.${i}.value`, err(`facts.${i}.value`))}
                    value={fact.value}
                    onChange={(e) => set("facts", replaceItem(draft.facts, i, { ...fact, value: e.target.value }))}
                  />
                  <FieldError id={`facts.${i}.value`} error={err(`facts.${i}.value`)} />
                </div>
              </div>
              <ItemControls
                index={i}
                count={draft.facts.length}
                label={`row ${fact.key || i + 1}`}
                onMove={(from, to) => set("facts", moveItem(draft.facts, from, to))}
                onRemove={(index) => set("facts", removeItem(draft.facts, index))}
              />
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("facts", [...draft.facts, { key: "", value: "" }])}>
              + Add row
            </button>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>{"// experience"}</h2>
        <TimelineList
          name="experience"
          items={draft.experience}
          onChange={(items) => set("experience", items)}
          err={err}
          example={{ title: "Data Science Intern", org: "Company", period: "2026" }}
        />
        <Field
          id="experiencePending"
          label="placeholder while experience is empty"
          error={err("experiencePending")}
          hint="Shown with a blinking cursor, e.g. “syncing from LinkedIn”. Leave empty to hide the row."
        >
          <input
            className="input"
            {...fieldProps("experiencePending", err("experiencePending"))}
            value={draft.experiencePending ?? ""}
            onChange={(e) => set("experiencePending", e.target.value)}
          />
        </Field>
      </section>

      <section className="admin-section">
        <h2>{"// education"}</h2>
        <TimelineList
          name="education"
          items={draft.education}
          onChange={(items) => set("education", items)}
          err={err}
          example={{ title: "MSc Data Science", org: "CHRIST University", period: "2025–27" }}
        />
      </section>
    </EditorShell>
  );
}
