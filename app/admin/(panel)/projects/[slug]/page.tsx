import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AreaHead from "@/components/admin/AreaHead";
import ProjectForm from "@/components/admin/ProjectForm";
import { loadProject, loadProjects } from "@/lib/admin/content";
import { isValidSlug } from "@/lib/admin/paths";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/admin/session";

export async function generateMetadata({ params }: PageProps<"/admin/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: isValidSlug(slug) ? `${slug}/` : "project" };
}

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[slug]">) {
  await requireAdminPage();
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const [one, all] = await Promise.all([tryLoad(() => loadProject(slug)), tryLoad(loadProjects)]);
  if (one.ok && one.value === null) notFound();
  const allTags = all.ok ? Array.from(new Set(all.value.flatMap((e) => e.project?.tags ?? []))) : [];

  return (
    <>
      <AreaHead
        kicker={`vim content/projects/${slug}.md`}
        title={one.ok && one.value ? one.value.project.title : `${slug}/`}
        local={localWritesEnabled()}
        error={one.ok ? undefined : one.error}
      />
      {one.ok && one.value && (
        <ProjectForm
          existing={{ slug, sha: one.value.sha }}
          initial={one.value.project}
          allTags={allTags}
          nextOrder={one.value.project.order ?? 1}
        />
      )}
    </>
  );
}
