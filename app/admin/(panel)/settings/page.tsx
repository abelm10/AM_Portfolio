import type { Metadata } from "next";
import SettingsEditor from "@/components/admin/SettingsEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "settings" };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("site"));

  return (
    <>
      <AreaHead
        kicker={"cat content/site.json"}
        title="settings/"
        sub="Contact links, location and university."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <SettingsEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.site} />}
    </>
  );
}
