import type { Metadata } from "next";
import ToolkitEditor from "@/components/admin/ToolkitEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "toolkit" };

export default async function AdminToolkitPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("toolkit"));

  return (
    <>
      <AreaHead
        kicker={"pip freeze | head"}
        title="toolkit/"
        sub="Rename rows; add, remove and rename chips."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <ToolkitEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.toolkit} />}
    </>
  );
}
