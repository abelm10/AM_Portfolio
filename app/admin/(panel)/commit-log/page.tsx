import type { Metadata } from "next";
import LogEditor from "@/components/admin/LogEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "commit-log" };

export default async function AdminLogPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("log"));

  return (
    <>
      <AreaHead
        kicker={"git log --all"}
        title="commit-log/"
        sub="Month groups, newest first."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <LogEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.log} />}
    </>
  );
}
