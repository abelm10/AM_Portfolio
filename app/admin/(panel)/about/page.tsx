import type { Metadata } from "next";
import AboutEditor from "@/components/admin/AboutEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "about" };

export default async function AdminAboutPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("about"));

  return (
    <>
      <AreaHead
        kicker={"cat README.md"}
        title="about/"
        sub="Bio, motto, the key/value rows, experience and education."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <AboutEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.about} />}
    </>
  );
}
