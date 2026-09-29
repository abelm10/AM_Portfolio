"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/dom";

const CHARS = "-/).+=><*&{}#";
const COLORS = ["--accent", "--fg", "--pixel"];

/**
 * Code symbols that trail the pointer inside [data-trail] areas (hero and footer).
 * Fine pointers only, never over links, buttons or canvases, off under reduced motion.
 */
export default function CursorTrail() {
  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia("(pointer: fine)").matches) return;

    let lastTime = 0;
    let n = 0;
    const live = new Set<HTMLSpanElement>();

    function onMove(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (event.timeStamp - lastTime < 45 || target?.closest("canvas, a, button")) return;
      lastTime = event.timeStamp;

      const symbol = document.createElement("span");
      symbol.className = "trail";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      symbol.style.left = `${event.clientX}px`;
      symbol.style.top = `${event.clientY}px`;
      symbol.style.color = `var(${COLORS[n++ % COLORS.length]})`;
      document.body.appendChild(symbol);
      live.add(symbol);
      setTimeout(() => {
        symbol.remove();
        live.delete(symbol);
      }, 760);
    }

    const areas = document.querySelectorAll<HTMLElement>("[data-trail]");
    areas.forEach((area) => area.addEventListener("pointermove", onMove));

    return () => {
      areas.forEach((area) => area.removeEventListener("pointermove", onMove));
      live.forEach((symbol) => symbol.remove());
    };
  }, []);

  return null;
}
