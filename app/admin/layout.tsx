import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "admin", template: "%s · admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
