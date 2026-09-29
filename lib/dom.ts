// Browser-only helpers shared by the canvas components. Call them from effects or handlers.

/** Current value of a CSS custom property on <html>, e.g. cssToken("--accent"). Follows theme switches. */
export function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Calls `callback` when the effective theme changes: the toggle or the OS setting. Returns a clean-up. */
export function onThemeChange(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    scheme.removeEventListener("change", callback);
  };
}

/**
 * Runs `frame` on requestAnimationFrame only while `element` is on screen and the tab is visible.
 * Returns a clean-up that stops the loop and its observers.
 */
export function animateWhileVisible(
  element: Element,
  frame: (timestamp: number) => void,
): () => void {
  let raf = 0;
  let onScreen = true;

  const loop = (timestamp: number) => {
    raf = 0;
    frame(timestamp);
    start();
  };
  const start = () => {
    if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) start();
    else stop();
  });
  intersection.observe(element);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  start();

  return () => {
    stop();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
