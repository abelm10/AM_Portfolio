import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminHome() {
  await requireAdminPage();
  redirect("/admin/projects");
}
