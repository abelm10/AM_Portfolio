"use client";

import { HobbiesSchema, type Hobby } from "@/lib/schemas";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { Field, fieldProps, replaceItem } from "./ui";

export default function HobbiesEditor(props: JsonEditorProps<Hobby[]>) {
  const { draft: tiles, setDraft, save, dirty, err, fieldErrors, result, pending } = useJsonEditor("hobbies", HobbiesSchema, props);
  const setTile = (t: number, tile: Hobby) => setDraft(replaceItem(tiles, t, tile));
  const boardError = (t: number) =>
    Object.entries(fieldErrors).find(([key]) => key === `${t}.board` || key.startsWith(`${t}.board.`))?.[1];

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      {tiles.map((tile, t) => (
        <section className="admin-section" key={t}>
          <h2>{`// tile ${t + 1}`}</h2>
          <Field id={`${t}.title`} label="title" error={err(`${t}.title`)}>
            <input className="input" {...fieldProps(`${t}.title`, err(`${t}.title`))} value={tile.title} onChange={(e) => setTile(t, { ...tile, title: e.target.value })} />
          </Field>
          <Field
            id={`${t}.board`}
            label="scoreboard"
            error={boardError(t)}
            hint={
              <>
                One line per scoreboard line. Wrap text in <code>*asterisks*</code> to show it in gold.
              </>
            }
          >
            <textarea
              className="textarea mono"
              rows={3}
              style={{ minHeight: 0, fontFamily: "var(--mono)", fontSize: 14, whiteSpace: "pre" }}
              {...fieldProps(`${t}.board`, boardError(t))}
              value={tile.board.join("\n")}
              onChange={(e) => setTile(t, { ...tile, board: e.target.value.split("\n") })}
            />
          </Field>
          <Field id={`${t}.text`} label="text" error={err(`${t}.text`)}>
            <textarea className="textarea" rows={3} {...fieldProps(`${t}.text`, err(`${t}.text`))} value={tile.text} onChange={(e) => setTile(t, { ...tile, text: e.target.value })} />
          </Field>
        </section>
      ))}
    </EditorShell>
  );
}
