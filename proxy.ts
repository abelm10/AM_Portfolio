import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors with no session cookie to the login page before
// rendering anything. The real check (session + ID allow-list) runs on the server in every
// admin page, server action and route handler; see lib/admin/session.ts.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(name));
  if (hasSessionCookie) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
