import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { requireAdminPage } from "@/lib/admin/session";
import { signOutOfAdmin } from "../auth-actions";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage();

  return (
    <>
      <header className="nav">
        <div className="frame nav-row">
          <Link className="nav-logo" href="/admin" aria-label="Admin home">
            abel
            <span className="px" aria-hidden="true">
              <i />
              <i />
            </span>
            m10<span className="admin-crumb">/admin</span>
          </Link>
          <div className="admin-head-cells">
            <span className="admin-user">
              {admin.image && (
                <Image src={admin.image} alt="" width={28} height={28} unoptimized />
              )}
              <span className="mono">@{admin.login}</span>
            </span>
            <ThemeToggle />
            <a className="admin-head-link" href="/" target="_blank" rel="noopener">
              View site <span aria-hidden="true">↗</span>
            </a>
            <form action={signOutOfAdmin} className="admin-head-form">
              <button className="admin-head-link" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="frame admin-body">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
