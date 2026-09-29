"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteProjectAction, saveProjectAction } from "@/app/admin/(panel)/actions";
import ProjectCard from "@/components/ProjectCard";
import { FIX_FIELDS, validate } from "@/lib/admin/result";
import { PROJECT_STATUSES, ProjectSchema, slugify, type ProjectData, type ProjectStatus } from "@/lib/schemas";
import ChipInput from "./ChipInput";
import {
  ConfirmDelete,
  Field,
  FieldError,
  fieldProps,
  ItemControls,
  moveItem,
  removeItem,
  replaceItem,
  SaveStatusLine,
  useSaver,
  useUnsavedWarning,
} from "./ui";

type Link_ = { label: string; url: string; primary: boolean };

type Draft = {
  title: string;
  status: ProjectStatus;
  tags: string[];
  blurb: string;
  metricValue: string;
  metricLabel: string;
  points: string[];
  stack: string[];
  links: Link_[];
  order: string;
};

function toDraft(project: ProjectData | null, nextOrder: number): Draft {
  return {
    title: project?.title ?? "",
    status: project?.status ?? "in development",
    tags: project?.tags ?? [],
    blurb: project?.blurb ?? "",
    metricValue: project?.metric?.value ?? "",
    metricLabel: project?.metric?.label ?? "",
    points: project?.points ?? [""],
    stack: project?.stack ?? [],
    links: project?.links.map((l) => ({ label: l.label, url: l.url, primary: Boolean(l.primary) })) ?? [
      { label: "Repo", url: "", primary: true },
    ],
    order: String(project?.order ?? nextOrder),
  };
}

/** "fakewave" → "fakewave/": the title is shown as a folder path. */
const withSlash = (title: string) => (title && !title.endsWith("/") ? `${title}/` : title);

/** What gets validated and saved. The server re-validates all of it. */
function toInput(draft: Draft) {
  const hasMetric = draft.metricValue.trim() !== "" || draft.metricLabel.trim() !== "";
  return {
    title: withSlash(draft.title.trim()),
    status: draft.status,
    tags: draft.tags,
    blurb: draft.blurb,
    ...(hasMetric ? { metric: { value: draft.metricValue, label: draft.metricLabel } } : {}),
    points: draft.points.filter((point) => point.trim() !== ""), // blank points are simply dropped
    stack: draft.stack,
    links: draft.links.map((l) => ({ label: l.label, url: l.url.trim(), ...(l.primary ? { primary: true } : {}) })),
    ...(draft.order.trim() !== "" ? { order: Number(draft.order) } : {}),
  };
}

type Props = {
  /** Set when editing; null when creating. */
  existing: { slug: string; sha: string } | null;
  initial: ProjectData | null;
  allTags: string[];
  nextOrder: number;
};

export default function ProjectForm({ existing, initial, allTags, nextOrder }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState(existing);
  const [draft, setDraft] = useState(() => toDraft(initial, nextOrder));
  const [saved, setSaved] = useState(() => JSON.stringify(toDraft(initial, nextOrder)));
  const { pending, result, setResult, run, fieldErrors } = useSaver();
  const dirty = JSON.stringify(draft) !== saved;
  useUnsavedWarning(dirty);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const err = (path: string) => fieldErrors[path];
  /** First error at or under a path, e.g. any "tags.N" for the tags field. */
  const errUnder = (prefix: string) =>
    Object.entries(fieldErrors).find(([key]) => key === prefix || key.startsWith(`${prefix}.`))?.[1];

  // After a failed save, move focus to the first field that needs fixing.
  useEffect(() => {
    if (result && !result.ok && result.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [result]);

  const slug = file?.slug ?? slugify(withSlash(draft.title.trim()));

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input = toInput(draft);
    setDraft((d) => ({ ...d, title: input.title }));
    const checked = validate(ProjectSchema, input);
    if (!checked.ok) {
      setResult({ ok: false, error: FIX_FIELDS, fieldErrors: checked.fieldErrors });
      return;
    }
    run(
      () => saveProjectAction(file?.slug ?? null, input, file?.sha ?? null),
      (res) => {
        const newSlug = res.slug ?? file!.slug;
        const sha = res.shas[`content/projects/${newSlug}.md`];
        if (sha) setFile({ slug: newSlug, sha });
        setSaved(JSON.stringify({ ...draft, title: input.title }));
        // A new project now has a fixed slug: stay on the form, but at its edit URL.
        if (!file) window.history.replaceState(null, "", `/admin/projects/${newSlug}`);
      },
    );
  }

  const preview = { ...toInput(draft), slug: "preview" };
  if (!preview.title) preview.title = "untitled/";

  return (
    <div className="editor-split">
      <form ref={formRef} className="editor-form" onSubmit={onSubmit} noValidate>
        <Field
          id="title"
          label="title"
          error={err("title")}
          hint={
            <>
              The trailing “/” is added for you. File: <code>content/projects/{slug || "…"}.md</code>
              {file ? " (fixed)" : " (fixed once created)"}
            </>
          }
        >
          <input
            className="input"
            {...fieldProps("title", err("title"))}
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            onBlur={() => set("title", withSlash(draft.title.trim()))}
            placeholder="fakewave/"
          />
        </Field>

        <div className="field-row">
          <Field id="status" label="status" error={err("status")}>
            <select
              className="select"
              {...fieldProps("status", err("status"))}
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ProjectStatus)}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Field id="order" label="order" error={err("order")} hint="Lower comes first.">
            <input
              className="input"
              inputMode="numeric"
              {...fieldProps("order", err("order"))}
              value={draft.order}
              onChange={(e) => set("order", e.target.value)}
            />
          </Field>
        </div>

        <div className="field">
          <label htmlFor="tags">tags</label>
          <ChipInput
            id="tags"
            value={draft.tags}
            onChange={(tags) => set("tags", tags)}
            suggestions={allTags}
            invalid={Boolean(errUnder("tags"))}
            describedBy={errUnder("tags") ? "tags-error" : undefined}
            placeholder="ml, data …"
          />
          <span className="hint">Comma-separated. These drive the filter buttons.</span>
          <FieldError id="tags" error={errUnder("tags")} />
        </div>

        <Field id="blurb" label="blurb" error={err("blurb")}>
          <textarea
            className="textarea"
            {...fieldProps("blurb", err("blurb"))}
            value={draft.blurb}
            onChange={(e) => set("blurb", e.target.value)}
          />
        </Field>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ padding: 0, marginBottom: 6 }}>
            metric (optional)
          </legend>
          <div className="field-row">
            <div className="field">
              <input
                className="input"
                aria-label="Metric value"
                placeholder="64.7%"
                {...fieldProps("metric.value", err("metric.value"))}
                value={draft.metricValue}
                onChange={(e) => set("metricValue", e.target.value)}
              />
              <FieldError id="metric.value" error={err("metric.value")} />
            </div>
            <div className="field">
              <input
                className="input"
                aria-label="Metric label"
                placeholder="what the number means"
                {...fieldProps("metric.label", err("metric.label"))}
                value={draft.metricLabel}
                onChange={(e) => set("metricLabel", e.target.value)}
              />
              <FieldError id="metric.label" error={err("metric.label")} />
            </div>
          </div>
        </fieldset>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ padding: 0, marginBottom: 6 }}>
            points
          </legend>
          <div className="list-editor">
            {draft.points.map((point, i) => (
              <div className="list-item" key={i}>
                <div className="field">
                  <textarea
                    className="textarea"
                    rows={2}
                    style={{ minHeight: 0 }}
                    aria-label={`Point ${i + 1}`}
                    {...fieldProps(`points.${i}`, err(`points.${i}`))}
                    value={point}
                    onChange={(e) => set("points", replaceItem(draft.points, i, e.target.value))}
                  />
                  <FieldError id={`points.${i}`} error={err(`points.${i}`)} />
                </div>
                <ItemControls
                  index={i}
                  count={draft.points.length}
                  label={`point ${i + 1}`}
                  onMove={(from, to) => set("points", moveItem(draft.points, from, to))}
                  onRemove={(index) => set("points", removeItem(draft.points, index))}
                />
              </div>
            ))}
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("points", [...draft.points, ""])}>
                + Add point
              </button>
            </div>
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="stack">stack</label>
          <ChipInput
            id="stack"
            value={draft.stack}
            onChange={(stack) => set("stack", stack)}
            invalid={Boolean(errUnder("stack"))}
            describedBy={errUnder("stack") ? "stack-error" : undefined}
            placeholder="PyTorch, Gradio …"
          />
          <span className="hint">Press Enter or comma after each. Click a chip to rename it.</span>
          <FieldError id="stack" error={errUnder("stack")} />
        </div>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ padding: 0, marginBottom: 6 }}>
            links
          </legend>
          <div className="list-editor">
            {draft.links.map((link, i) => (
              <div className="list-item card-like" key={i}>
                <div className="field-row">
                  <div className="field">
                    <input
                      className="input"
                      aria-label={`Link ${i + 1} label`}
                      placeholder="Repo"
                      {...fieldProps(`links.${i}.label`, err(`links.${i}.label`))}
                      value={link.label}
                      onChange={(e) => set("links", replaceItem(draft.links, i, { ...link, label: e.target.value }))}
                    />
                    <FieldError id={`links.${i}.label`} error={err(`links.${i}.label`)} />
                  </div>
                  <div className="field">
                    <input
                      className="input"
                      type="url"
                      aria-label={`Link ${i + 1} URL`}
                      placeholder="https://github.com/abelm10/…"
                      {...fieldProps(`links.${i}.url`, err(`links.${i}.url`))}
                      value={link.url}
                      onChange={(e) => set("links", replaceItem(draft.links, i, { ...link, url: e.target.value }))}
                    />
                    <FieldError id={`links.${i}.url`} error={err(`links.${i}.url`)} />
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={link.primary}
                      onChange={(e) => set("links", replaceItem(draft.links, i, { ...link, primary: e.target.checked }))}
                    />
                    primary (green button)
                  </label>
                </div>
                <ItemControls
                  index={i}
                  count={draft.links.length}
                  label={`link ${link.label || i + 1}`}
                  onMove={(from, to) => set("links", moveItem(draft.links, from, to))}
                  onRemove={(index) => set("links", removeItem(draft.links, index))}
                />
              </div>
            ))}
            <FieldError id="links" error={err("links")} />
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => set("links", [...draft.links, { label: "", url: "", primary: false }])}
              >
                + Add link
              </button>
            </div>
          </div>
        </fieldset>

        <div className="save-bar" style={{ margin: "0 calc(-1 * var(--pad))" }}>
          <SaveStatusLine result={result} pending={pending} />
          <div className="admin-toolbar">
            {file && (
              <ConfirmDelete
                what={draft.title || file.slug}
                disabled={pending}
                onConfirm={() =>
                  run(
                    () => deleteProjectAction(file.slug, file.sha),
                    () => {
                      setSaved(JSON.stringify(draft));
                      router.push("/admin/projects");
                      router.refresh();
                    },
                  )
                }
              />
            )}
            <Link className="btn btn-ghost" href="/admin/projects">
              Back to list
            </Link>
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {file ? "Save" : "Create project"}
            </button>
          </div>
        </div>
      </form>

      <aside className="editor-preview" aria-label="Preview">
        <p className="preview-label">{"// preview, exactly as on the site"}</p>
        <div className="cards" style={{ gridTemplateColumns: "1fr" }}>
          <ProjectCard project={preview as Parameters<typeof ProjectCard>[0]["project"]} />
        </div>
      </aside>
    </div>
  );
}
