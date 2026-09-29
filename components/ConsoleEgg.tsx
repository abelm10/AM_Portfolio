"use client";

import { useEffect } from "react";

let logged = false; // once per page load, even across Strict Mode's dev remount

/** A hello for anyone who opens DevTools. */
export default function ConsoleEgg({ handle, linkedin }: { handle: string; linkedin: string }) {
  useEffect(() => {
    if (logged) return;
    logged = true;
    console.log(
      `%c ${handle} %c the projects live in content/projects/*.md, one Markdown file each. Say hi: ${linkedin}`,
      "background:#08872b;color:#fff;font-weight:700;padding:2px 6px",
      "color:inherit",
    );
  }, [handle, linkedin]);

  return null;
}
