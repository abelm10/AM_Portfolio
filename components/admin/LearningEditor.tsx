"use client";

import { LearningSchema, type LearningRepo } from "@/lib/schemas";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { FieldError, fieldProps, ItemControls, moveItem, removeItem, replaceItem } from "./ui";

export default function LearningEditor(props: JsonEditorProps<LearningRepo[]>) {
  const { draft: repos, setDraft, save, dirty, err, result, pending } = useJsonEditor("learning", LearningSchema, props);

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      <section className="admin-section">
        <p className="hint" style={{ margin: 0 }}>
          Each name links to github.com/abelm10/&lt;name&gt;, so use the repo&apos;s exact name.
        </p>
        <div className="list-editor">
          {repos.map((repo, i) => (
            <div className="list-item card-like" key={i}>
              <div className="field-row grid-kv">
                <div className="field">
                  <input
                    className="input"
                    aria-label={`Repo ${i + 1} name`}
                    placeholder="basic-django"
                    {...fieldProps(`${i}.name`, err(`${i}.name`))}
                    value={repo.name}
                    onChange={(e) => setDraft(replaceItem(repos, i, { ...repo, name: e.target.value }))}
                  />
                  <FieldError id={`${i}.name`} error={err(`${i}.name`)} />
                </div>
                <div className="field">
                  <input
                    className="input"
                    aria-label={`Repo ${i + 1} note`}
                    placeholder="What it is"
                    {...fieldProps(`${i}.note`, err(`${i}.note`))}
                    value={repo.note}
                    onChange={(e) => setDraft(replaceItem(repos, i, { ...repo, note: e.target.value }))}
                  />
                </div>
              </div>
              <ItemControls
                index={i}
                count={repos.length}
                label={`repo ${repo.name || i + 1}`}
                onMove={(from, to) => setDraft(moveItem(repos, from, to))}
                onRemove={(index) => setDraft(removeItem(repos, index))}
              />
            </div>
          ))}
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft([...repos, { name: "", note: "" }])}>
              + Add repo
            </button>
          </div>
        </div>
      </section>
    </EditorShell>
  );
}
