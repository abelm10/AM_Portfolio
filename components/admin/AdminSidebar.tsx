"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_AREAS } from "@/lib/admin/areas";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="admin-side" aria-label="Content areas">
      {ADMIN_AREAS.map((area) => {
        const href = `/admin/${area.slug}`;
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={area.slug} href={href} aria-current={current ? "page" : undefined}>
            {area.label}
          </Link>
        );
      })}
    </nav>
  );
}
