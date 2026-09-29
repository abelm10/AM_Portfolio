/** The editable areas, in sidebar order. `slug` is the URL segment under /admin. */
export const ADMIN_AREAS = [
  { slug: "projects", label: "projects/" },
  { slug: "about", label: "about/" },
  { slug: "commit-log", label: "commit-log/" },
  { slug: "toolkit", label: "toolkit/" },
  { slug: "off-the-clock", label: "off-the-clock/" },
  { slug: "learning-log", label: "learning-log/" },
  { slug: "settings", label: "settings/" },
] as const;

export type AdminAreaSlug = (typeof ADMIN_AREAS)[number]["slug"];
