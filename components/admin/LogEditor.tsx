"use client";

import { LogSchema, type LogGroup } from "@/lib/schemas";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { FieldError, fieldProps, ItemControls, moveItem, removeItem, replaceItem } from "./ui";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** This month as a group key, e.g. "sep26_". */
function thisMonth(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]}${String(now.getFullYear()).slice(2)}_`;
}

function today(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")} ${MONTHS[now.getMonth()]}`;
}

type Item = LogGroup["items"][number];

export default function LogEditor(props: JsonEditorProps<LogGroup[]>) {
  const { draft: groups, setDraft, save, dirty, err, result, pending } = useJsonEditor("log", LogSchema, props);
  const setGroup = (g: number, group: LogGroup) => setDraft(replaceItem(groups, g, group));
  const setItem = (g: number, i: number, item: Item) => setGroup(g, { ...groups[g], items: replaceItem(groups[g].items, i, item) });

  const current = thisMonth();
  const hasCurrent = groups.some((g) => g.month === current);

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      <section className="admin-section">
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setDraft([{ month: hasCurrent ? "" : current, note: "", items: [{ date: today(), repo: "", text: "" }] }, ...groups])}
          >
            + Add month (at the top)
          </button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          Newest first. Months look like <code>sep26_</code>, dates like <code>22 sep</code>. Repo names link to github.com/abelm10/&lt;repo&gt;.
        </p>
      </section>

      {groups.map((group, g) => (
        <section className="admin-section" key={g}>
          <div className="list-item">
            <div className="field-row">
              <div className="field">
                <label htmlFor={`${g}.month`}>month</label>
                <input
                  className="input"
                  placeholder="sep26_"
                  {...fieldProps(`${g}.month`, err(`${g}.month`))}
                  value={group.month}
                  onChange={(e) => setGroup(g, { ...group, month: e.target.value })}
                />
                <FieldError id={`${g}.month`} error={err(`${g}.month`)} />
              </div>
              <div className="field">
                <label htmlFor={`${g}.note`}>note</label>
                <input
                  className="input"
                  placeholder="shipping month"
                  {...fieldProps(`${g}.note`, err(`${g}.note`))}
                  value={group.note}
                  onChange={(e) => setGroup(g, { ...group, note: e.target.value })}
                />
              </div>
            </div>
            <ItemControls
              index={g}
              count={groups.length}
              label={`month ${group.month || g + 1}`}
              onMove={(from, to) => setDraft(moveItem(groups, from, to))}
              onRemove={(index) => setDraft(removeItem(groups, index))}
            />
          </div>

          <div className="list-editor">
            {group.items.map((item, i) => {
              const base = `${g}.items.${i}`;
              return (
                <div className="list-item card-like" key={i}>
                  <div className="field-row grid-log">
                    <div className="field">
                      <input
                        className="input"
                        aria-label={`Entry ${i + 1} date`}
                        placeholder="22 sep"
                        {...fieldProps(`${base}.date`, err(`${base}.date`))}
                        value={item.date}
                        onChange={(e) => setItem(g, i, { ...item, date: e.target.value })}
                      />
                      <FieldError id={`${base}.date`} error={err(`${base}.date`)} />
                    </div>
                    <div className="field">
                      <input
                        className="input"
                        aria-label={`Entry ${i + 1} repo`}
                        placeholder="FakeWave"
                        {...fieldProps(`${base}.repo`, err(`${base}.repo`))}
                        value={item.repo}
                        onChange={(e) => setItem(g, i, { ...item, repo: e.target.value })}
                      />
                      <FieldError id={`${base}.repo`} error={err(`${base}.repo`)} />
                    </div>
                    <div className="field">
                      <input
                        className="input"
                        aria-label={`Entry ${i + 1} text`}
                        placeholder="What changed"
                        {...fieldProps(`${base}.text`, err(`${base}.text`))}
                        value={item.text}
                        onChange={(e) => setItem(g, i, { ...item, text: e.target.value })}
                      />
                    </div>
                  </div>
                  <ItemControls
                    index={i}
                    count={group.items.length}
                    label={`entry ${item.repo || i + 1}`}
                    onMove={(from, to) => setGroup(g, { ...group, items: moveItem(group.items, from, to) })}
                    onRemove={(index) => setGroup(g, { ...group, items: removeItem(group.items, index) })}
                  />
                </div>
              );
            })}
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setGroup(g, { ...group, items: [{ date: "", repo: "", text: "" }, ...group.items] })}
              >
                + Add entry to {group.month || "this month"}
              </button>
            </div>
          </div>
        </section>
      ))}
    </EditorShell>
  );
}
