import { notFound } from "next/navigation";
import { ADMIN_AREAS } from "@/lib/admin/areas";
import { requireAdminPage } from "@/lib/admin/session";

// Placeholder until each area gets its editor (admin phase 4).
export default async function AdminAreaPage({ params }: PageProps<"/admin/[area]">) {
  await requireAdminPage();
  const { area } = await params;
  const found = ADMIN_AREAS.find((a) => a.slug === area);
  if (!found) notFound();

  return (
    <div className="sec-head">
      <div>
        <p className="kicker">admin / {found.slug}</p>
        <h1 className="sec-title">{found.label}</h1>
        <p className="sec-sub">The editor for this area is coming next.</p>
      </div>
    </div>
  );
}
