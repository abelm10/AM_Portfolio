"use client";

import { SiteSchema, type Site } from "@/lib/schemas";
import { EditorShell, useJsonEditor, type JsonEditorProps } from "./JsonEditor";
import { Field, fieldProps } from "./ui";

// Name, handle, role and the site URL aren't editable here; they're kept as they are.
const FIELDS: { key: keyof Site; label: string; type?: string; hint?: string; placeholder?: string }[] = [
  { key: "email", label: "email (optional)", type: "email", hint: "Leave empty to hide the email row in the contact section." },
  { key: "linkedin", label: "linkedin", type: "url", placeholder: "https://www.linkedin.com/in/…" },
  { key: "github", label: "github", type: "url", hint: "Also the base for repo links in the commit log and learning log." },
  { key: "kaggle", label: "kaggle", type: "url" },
  { key: "location", label: "location", placeholder: "Bangalore, India" },
  { key: "university", label: "university", hint: "The about/ “studying” row is edited separately, under about/." },
];

export default function SettingsEditor(props: JsonEditorProps<Site>) {
  const { draft, setDraft, save, dirty, err, result, pending } = useJsonEditor("site", SiteSchema, props);

  return (
    <EditorShell onSave={save} result={result} pending={pending} dirty={dirty}>
      <section className="admin-section">
        {FIELDS.map((field) => (
          <Field key={field.key} id={field.key} label={field.label} error={err(field.key)} hint={field.hint}>
            <input
              className="input"
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              {...fieldProps(field.key, err(field.key))}
              value={draft[field.key] ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setDraft((d) => {
                  if (field.key === "email" && value.trim() === "") {
                    // Unset rather than "", so the file stays as if it was never set.
                    const next = { ...d };
                    delete next.email;
                    return next;
                  }
                  return { ...d, [field.key]: value };
                });
              }}
            />
          </Field>
        ))}
      </section>
    </EditorShell>
  );
}
