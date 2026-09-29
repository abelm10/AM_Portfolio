import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminGithubId } from "@/lib/admin/allowlist";

export type Admin = { githubId: string; login: string; name: string | null; image: string | null };

/** The signed-in admin, or null. Checks the session *and* the ID allow-list on every call. */
export async function getAdmin(): Promise<Admin | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || !isAdminGithubId(user.githubId)) return null;
  return { githubId: user.githubId, login: user.login, name: user.name ?? null, image: user.image ?? null };
}

/** For admin pages and layouts: sends anyone who isn't an admin to the login page. */
export async function requireAdminPage(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class NotAdminError extends Error {
  constructor() {
    super("You're signed out or not an admin. Sign in again at /admin/login.");
    this.name = "NotAdminError";
  }
}

/** For server actions and route handlers: throws unless the caller is an admin. */
export async function assertAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new NotAdminError();
  return admin;
}
