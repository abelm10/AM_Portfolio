import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import { isAdminGithubId } from "@/lib/admin/allowlist";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { githubId: string; login: string };
  }
}

// Reads AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // an 8-hour admin session
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    // Refuse non-admins at sign-in, so they never get a session cookie.
    // Every admin page, action and route still re-checks (lib/admin/session.ts).
    signIn({ account, profile }) {
      return account?.provider === "github" && isAdminGithubId(String(profile?.id ?? ""));
    },
    jwt({ token, profile }) {
      if (profile) {
        token.githubId = String(profile.id);
        token.login = String(profile.login ?? "");
      }
      return token;
    },
    session({ session, token }) {
      session.user.githubId = typeof token.githubId === "string" ? token.githubId : "";
      session.user.login = typeof token.login === "string" ? token.login : "";
      return session;
    },
  },
});
