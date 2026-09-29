"use client";

import { useEffect, useRef, useState } from "react";
import { animateWhileVisible, cssTokens, onThemeChange, prefersReducedMotion } from "@/lib/dom";

type Bug = { x: number; y: number; vx: number; vy: number; dead: number; leg: number };

const SPRITE = ["0100010", "0011100", "1111111", "0111110", "1010101"];
const P = 4; // px per sprite pixel
const SW = SPRITE[0].length * P;
const SH = SPRITE.length * P;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Footer mini game: click the pixel bugs. Under reduced motion the bugs stand still. */
export default function BugBash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const reduceMotion = prefersReducedMotion();
    let W = 0;
    let H = 0;
    let frame = 0;
    const bugs: Bug[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const readColors = () => cssTokens(["--bg", "--fg", "--accent"] as const);
    let colors = readColors();

    function spawn(bug: Bug = { x: 0, y: 0, vx: 0, vy: 0, dead: 0, leg: 0 }): Bug {
      bug.x = rnd(10, Math.max(11, W - SW - 10));
      bug.y = rnd(10, Math.max(11, H - SH - 10));
      const angle = rnd(0, Math.PI * 2);
      const speed = reduceMotion ? 0 : rnd(0.25, 0.7);
      bug.vx = Math.cos(angle) * speed;
      bug.vy = Math.sin(angle) * speed;
      bug.dead = 0;
      bug.leg = 0;
      return bug;
    }

    function drawBug(bug: Bug, fg: string, accent: string) {
      if (!ctx) return;
      if (bug.dead) {
        // Squash burst: ten pixels flying outwards and fading.
        ctx.globalAlpha = Math.max(0, 1 - bug.dead / 40);
        ctx.fillStyle = accent;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const d = 4 + bug.dead * 0.6;
          ctx.fillRect(bug.x + SW / 2 + Math.cos(a) * d, bug.y + SH / 2 + Math.sin(a) * d, P, P);
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.fillStyle = fg;
      SPRITE.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          let on = row[rx] === "1";
          if (ry === 4 && bug.leg) on = row[rx] !== "1" && rx > 0 && rx < 6;
          if (on) ctx.fillRect(Math.round(bug.x) + rx * P, Math.round(bug.y) + ry * P, P, P);
        }
      });
    }

    function draw() {
      if (!ctx) return;
      const { "--bg": bg, "--fg": fg, "--accent": accent } = colors;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      bugs.forEach((bug) => drawBug(bug, fg, accent));
    }

    function resize() {
      if (!cv || !ctx) return;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rect.width;
      H = rect.height;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = W < 500 ? 4 : 7;
      while (bugs.length < count) bugs.push(spawn());
      bugs.length = count;
      bugs.forEach((bug) => {
        if (bug.x > W - SW) bug.x = W - SW - 4;
        if (bug.y > H - SH) bug.y = H - SH - 4;
      });
      draw();
    }

    function tick() {
      frame++;
      bugs.forEach((bug) => {
        if (bug.dead) {
          bug.dead++;
          if (bug.dead > 40) spawn(bug);
          return;
        }
        bug.x += bug.vx;
        bug.y += bug.vy;
        if (bug.x < 2 || bug.x > W - SW - 2) bug.vx *= -1;
        if (bug.y < 2 || bug.y > H - SH - 2) bug.vy *= -1;
        if (frame % 12 === 0) bug.leg ^= 1;
        if (Math.random() < 0.01) {
          const a = Math.atan2(bug.vy, bug.vx) + rnd(-1, 1);
          const s = Math.hypot(bug.vx, bug.vy);
          bug.vx = Math.cos(a) * s;
          bug.vy = Math.sin(a) * s;
        }
      });
      draw();
    }

    function onPointerDown(event: PointerEvent) {
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = bugs.find(
        (bug) => !bug.dead && x > bug.x - 8 && x < bug.x + SW + 8 && y > bug.y - 8 && y < bug.y + SH + 8,
      );
      if (!hit) return;
      hit.dead = 1;
      setScore((s) => s + 1);
      if (reduceMotion) {
        // No animation loop: show the burst, then respawn in place of it.
        draw();
        const timer = setTimeout(() => {
          timers.delete(timer);
          spawn(hit);
          draw();
        }, 400);
        timers.add(timer);
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(cv);
    cv.addEventListener("pointerdown", onPointerDown);
    const stopTheme = onThemeChange(() => {
      colors = readColors();
      draw();
    });
    const stopLoop = reduceMotion ? () => {} : animateWhileVisible(cv, tick);

    return () => {
      stopLoop();
      stopTheme();
      resizeObserver.disconnect();
      cv.removeEventListener("pointerdown", onPointerDown);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div className="bug-head">
        <span>echo &quot;clean-notebooks-later/&quot; &gt;&gt; .todo &nbsp;·&nbsp; click the bugs</span>
        <span>
          bugs squashed: <strong>{score}</strong>
        </span>
      </div>
      <div className="bug-wrap">
        <canvas
          ref={canvasRef}
          className="bug-canvas"
          role="img"
          aria-label="Mini game: click the pixel bugs to squash them"
        />
      </div>
    </>
  );
}
