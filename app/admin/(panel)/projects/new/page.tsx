import type { Metadata } from "next";
import AreaHead from "@/components/admin/AreaHead";
import ProjectForm from "@/components/admin/ProjectForm";
import { loadProjects } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "new project" };

export default async function NewProjectPage() {
  await requireAdminPage();
  const loaded = await tryLoad(loadProjects);
  const projects = loaded.ok ? loaded.value.flatMap((e) => (e.project ? [e.project] : [])) : [];
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));
  const orders = projects.map((p) => p.order).filter((o): o is number => o !== undefined);

  return (
    <>
      <AreaHead kicker="touch content/projects/…" title="new project" local={localWritesEnabled()} error={loaded.ok ? undefined : loaded.error} />
      <ProjectForm existing={null} initial={null} allTags={allTags} nextOrder={orders.length ? Math.max(...orders) + 1 : 1} />
    </>
  );
}
