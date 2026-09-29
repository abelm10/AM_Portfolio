"use client";

import { useLayoutEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function readStored(): "light" | "dark" | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

/**
 * The inline script in app/layout.tsx applies the saved theme before paint.
 * The "light" / "dark" label is picked by CSS (see .theme-btn in globals.css)
 * from the same rules as the tokens, so it needs no client state.
 */
export default function ThemeToggle() {
  // Re-apply after React Strict Mode's dev remount clears <html> attributes.
  // A no-op in production.
  useLayoutEffect(() => {
    const saved = readStored();
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const current =
      root.getAttribute("data-theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode etc.): the switch still works for this visit.
    }
  }

  return (
    <button className="theme-btn" type="button" onClick={toggle}>
      theme: <span className="t-light">light</span>
      <span className="t-dark">dark</span>
      <span className="sr-only">, switch colour theme</span>
    </button>
  );
}
