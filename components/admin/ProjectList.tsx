"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProjectAction, moveProjectAction, setProjectStatusAction } from "@/app/admin/(panel)/actions";
import { PROJECT_STATUSES } from "@/lib/schemas";
import { ConfirmDelete, SaveStatusLine, useSaver } from "./ui";

export type ProjectRow = {
  slug: string;
  sha: string;
  title: string;
  status: string | null;
  order: number | null;
  tags: string[];
  /** The file in the repo is invalid; it can only be deleted (or fixed in code). */
  error?: string;
};

export default function ProjectList({ rows }: { rows: ProjectRow[] }) {
  const router = useRouter();
  const { pending, result, run } = useSaver();
  const valid = rows.filter((row) => !row.error);
  // The list the admin is looking at: reorders are refused if any of these changed since.
  const knownShas = Object.fromEntries(rows.map((row) => [row.slug, row.sha]));
  const refresh = () => router.refresh();

  return (
    <>
      {(pending || result) && (
        <div className="save-bar" style={{ position: "static" }}>
          <SaveStatusLine result={result} pending={pending} />
        </div>
      )}
      <div className="admin-rows">
        {rows.length === 0 && <p className="admin-row admin-row-meta">{"// 0 rows returned. Add your first project."}</p>}
        {rows.map((row) => {
          const index = valid.indexOf(row);
          return (
            <div className="admin-row" key={row.slug}>
              <div className="admin-row-main">
                <span className="admin-row-title">
                  {row.error ? row.slug : <Link href={`/admin/projects/${row.slug}`}>{row.title}</Link>}
                </span>
                <span className="admin-row-meta">
                  content/projects/{row.slug}.md
                  {row.order !== null && ` · order ${row.order}`}
                  {row.tags.length > 0 && ` · ${row.tags.join(", ")}`}
                </span>
                {row.error && (
                  <span className="field-error" style={{ whiteSpace: "pre-wrap" }}>
                    This file is invalid and can&apos;t be edited here:{"\n"}
                    {row.error}
                  </span>
                )}
              </div>
              <div className="admin-row-actions">
                {!row.error && (
                  <>
                    <select
                      className="select"
                      style={{ width: "auto", padding: "6px 8px", fontSize: 14 }}
                      aria-label={`Status of ${row.title}`}
                      value={row.status ?? ""}
                      disabled={pending}
                      onChange={(e) => run(() => setProjectStatusAction(row.slug, e.target.value, row.sha), refresh)}
                    >
                      {PROJECT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      aria-label={`Move ${row.title} up`}
                      disabled={pending || index === 0}
                      onClick={() => run(() => moveProjectAction(row.slug, "up", knownShas), refresh)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      aria-label={`Move ${row.title} down`}
                      disabled={pending || index === valid.length - 1}
                      onClick={() => run(() => moveProjectAction(row.slug, "down", knownShas), refresh)}
                    >
                      ↓
                    </button>
                    <Link className="btn btn-ghost btn-sm" href={`/admin/projects/${row.slug}`}>
                      Edit
                    </Link>
                  </>
                )}
                <ConfirmDelete
                  what={row.error ? `${row.slug}.md` : row.title}
                  disabled={pending}
                  onConfirm={() => run(() => deleteProjectAction(row.slug, row.sha), refresh)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
