import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { adminGithubLogins } from "@/lib/admin/allowlist";
import { getAdmin } from "@/lib/admin/session";
import { signInWithGitHub, signOutOfAdmin } from "../auth-actions";

export const metadata: Metadata = { title: "sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");

  const { error } = await searchParams;
  // A session that isn't on the allow-list (e.g. the list changed after sign-in).
  const signedInNonAdmin = Boolean((await auth())?.user);
  const denied = error === "AccessDenied" || signedInNonAdmin;
  const logins = adminGithubLogins();

  return (
    <main className="frame admin-login">
      <h1 className="nf-title">admin/</h1>
      <p className="nf-sub mono">{"// authorised personnel only"}</p>
      {denied && (
        <p className="admin-alert" role="alert">
          This account isn&apos;t an admin.
          {logins.length > 0 && ` Access is limited to ${logins.map((l) => `@${l}`).join(", ")}.`} To
          use a different GitHub account, sign out of GitHub first.
        </p>
      )}
      {!denied && error && (
        <p className="admin-alert" role="alert">
          Sign-in didn&apos;t work ({String(error)}). Try again.
        </p>
      )}
      <div className="nf-actions">
        {signedInNonAdmin ? (
          <form action={signOutOfAdmin}>
            <button className="btn btn-ghost" type="submit">
              Sign out
            </button>
          </form>
        ) : (
          <form action={signInWithGitHub}>
            <button className="btn btn-primary" type="submit">
              Sign in with GitHub <span aria-hidden="true">↗</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
