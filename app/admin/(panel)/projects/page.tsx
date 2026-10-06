import type { Metadata } from "next";
import Link from "next/link";
import AreaHead from "@/components/admin/AreaHead";
import ProjectList, { type ProjectRow } from "@/components/admin/ProjectList";
import { loadProjects } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "projects" };

export default async function AdminProjectsPage() {
  await requireAdminPage();
  const loaded = await tryLoad(loadProjects);
  const rows: ProjectRow[] = loaded.ok
    ? loaded.value.map((entry) => ({
        slug: entry.slug,
        sha: entry.sha,
        title: entry.project?.title ?? entry.slug,
        status: entry.project?.status ?? null,
        order: entry.project?.order ?? null,
        tags: entry.project?.tags ?? [],
        ...(entry.error ? { error: entry.error } : {}),
      }))
    : [];

  return (
    <>
      <AreaHead
        kicker="ls ./content/projects"
        title="projects/"
        sub="Reorder. dang bro, something new? crazy"
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      >
        <Link className="btn btn-primary" href="/admin/projects/new">
          New project
        </Link>
      </AreaHead>
      {loaded.ok && <ProjectList rows={rows} />}
    </>
  );
}
