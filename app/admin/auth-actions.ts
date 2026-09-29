"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/admin" });
}

export async function signOutOfAdmin() {
  await signOut({ redirectTo: "/admin/login" });
}
