// Who may use /admin. Access is granted by numeric GitHub user ID, which never changes;
// a login can be renamed and then claimed by someone else.

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** ADMIN_GITHUB_IDS, e.g. "112473328" or "112473328,123". Empty or unset means nobody (fail closed). */
export function adminGithubIds(): Set<string> {
  return new Set(parseList(process.env.ADMIN_GITHUB_IDS).filter((id) => /^\d+$/.test(id)));
}

export function isAdminGithubId(id: unknown): boolean {
  return typeof id === "string" && /^\d+$/.test(id) && adminGithubIds().has(id);
}

/** ADMIN_GITHUB_LOGINS: display only (e.g. on the refusal message). Never used to grant access. */
export function adminGithubLogins(): string[] {
  return parseList(process.env.ADMIN_GITHUB_LOGINS);
}
