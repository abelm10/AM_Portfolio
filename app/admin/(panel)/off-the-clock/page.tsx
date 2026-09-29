import type { Metadata } from "next";
import HobbiesEditor from "@/components/admin/HobbiesEditor";
import AreaHead from "@/components/admin/AreaHead";
import { loadJson } from "@/lib/admin/content";
import { localWritesEnabled, tryLoad } from "@/lib/admin/load";
import { CONTENT_FILES } from "@/lib/admin/paths";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "off-the-clock" };

export default async function AdminHobbiesPage() {
  await requireAdminPage();
  const loaded = await tryLoad(() => loadJson("hobbies"));

  return (
    <>
      <AreaHead
        kicker={"while (weekend) { watch(); }"}
        title="off-the-clock/"
        sub="The three tiles, including their scoreboards."
        local={localWritesEnabled()}
        error={loaded.ok ? undefined : loaded.error}
      />
      {loaded.ok && <HobbiesEditor data={loaded.value.data} sha={loaded.value.sha} path={CONTENT_FILES.hobbies} />}
    </>
  );
}
