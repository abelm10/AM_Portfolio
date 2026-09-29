import type { Metadata } from "next";
import LearningEditor from "@/components/admin/LearningEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "learning-log" };

export default async function AdminLearningPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("learning"));

  return (
    <>
      <AreaHead
        kicker={"ls ./learning"}
        title="learning-log/"
        sub="Smaller repos in the collapsible learning-log."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <LearningEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.learning} />}
    </>
  );
}
