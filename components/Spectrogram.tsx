"use client";

import { useEffect, useRef, useState } from "react";
import { animateWhileVisible, cssTokens, onThemeChange, prefersReducedMotion } from "@/lib/dom";

type Mode = "real" | "synthetic";

const CELL = 9; // px per spectrogram cell
const mel = (f: number) => 2595 * Math.log10(1 + f / 700);
const MELMAX = mel(4200);

/**
 * Log-mel spectrogram illustration, ported from the reference. "real" has pitch
 * jitter, uneven harmonics and room noise; "synthetic" is too clean, with a
 * vocoder band near the top. Scrolls one column per ~70ms while on screen;
 * draws a single static frame under prefers-reduced-motion.
 */
export default function Spectrogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<Mode>("real");
  const redrawStaticRef = useRef<() => void>(() => {});
  const [mode, setMode] = useState<Mode>("real");

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const reduceMotion = prefersReducedMotion();
    let cols = 0;
    let rows = 0;
    let buf: Float32Array[] = [];
    let t = 0;
    let f0 = 170;
    let f0Target = 170;
    let last = 0;
    const readColors = () => cssTokens(["--bg", "--accent", "--pixel", "--line"] as const);
    let colors = readColors();

    function column(): Float32Array {
      t++;
      const col = new Float32Array(rows);
      const real = modeRef.current === "real";
      const pause = Math.sin(t * 0.031) < -0.55;
      let env = Math.pow(Math.max(0, Math.sin(t * 0.085)), real ? 0.6 : 0.35);
      if (real) env *= 0.75 + 0.25 * Math.random();
      if (pause) env *= real ? 0.12 : 0.03;
      if (t % 45 === 0) f0Target = 130 + Math.random() * 110;
      f0 += (f0Target - f0) * (real ? 0.07 : 0.03);
      const f = real
        ? f0 + 7 * Math.sin(t * 0.42) + (Math.random() - 0.5) * 9
        : f0 + 4 * Math.sin(t * 0.06);
      const width = real ? 0.022 : 0.012;
      for (let r = 0; r < rows; r++) {
        const y = (rows - 1 - r) / Math.max(1, rows - 1);
        let v = 0;
        for (let k = 1; k <= 12; k++) {
          const hk = mel(k * f) / MELMAX;
          if (hk > 1.05) break;
          const amp = real ? (1 / Math.pow(k, 0.8)) * (0.7 + 0.5 * Math.random()) : 1 / Math.pow(k, 0.55);
          const d = (y - hk) / width;
          v += amp * Math.exp(-d * d);
        }
        if (!real) {
          const band = (y - 0.9) / 0.015;
          v += 0.45 * Math.exp(-band * band);
        }
        v *= env;
        if (real) v += Math.random() * 0.16 * (1 - y * 0.6);
        col[r] = Math.min(1, v);
      }
      return col;
    }

    function fill() {
      buf = [];
      for (let i = 0; i < cols; i++) buf.push(column());
    }

    function draw() {
      if (!ctx) return;
      const w = cols * CELL;
      const h = rows * CELL;
      const { "--bg": bg, "--accent": accent, "--pixel": pixel, "--line": line } = colors;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w + CELL, h + CELL);
      ctx.fillStyle = line;
      for (let i = 0; i < cols; i += 4) {
        for (let r = 0; r < rows; r += 4) ctx.fillRect(i * CELL + 3, r * CELL + 3, 2, 2);
      }
      for (let i = 0; i < buf.length; i++) {
        const col = buf[i];
        for (let r = 0; r < rows; r++) {
          const v = col[r];
          if (v < 0.1) continue;
          ctx.globalAlpha = Math.ceil(v * 5) / 5; // quantised alpha
          ctx.fillStyle = v > 0.84 ? pixel : accent; // gold peaks
          ctx.fillRect(i * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      if (!cv || !ctx) return;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(rect.width * dpr));
      cv.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(rect.width / CELL);
      rows = Math.floor(rect.height / CELL);
      fill();
      draw();
    }

    // Motion mode picks up a new mode column by column; a static frame redraws at once.
    redrawStaticRef.current = () => {
      if (reduceMotion) {
        fill();
        draw();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(cv);
    const stopTheme = onThemeChange(() => {
      colors = readColors();
      draw();
    });
    const stopLoop = reduceMotion
      ? () => {}
      : animateWhileVisible(cv, (ts) => {
          if (ts - last > 70) {
            last = ts;
            buf.shift();
            buf.push(column());
            draw();
          }
        });

    return () => {
      stopLoop();
      stopTheme();
      resizeObserver.disconnect();
      redrawStaticRef.current = () => {};
    };
  }, []);

  function choose(next: Mode) {
    modeRef.current = next;
    setMode(next);
    redrawStaticRef.current();
  }

  return (
    <div className="spec-wrap">
      <canvas
        ref={canvasRef}
        className="spec-canvas"
        role="img"
        aria-label="Animated illustration of a log-mel spectrogram of speech"
      />
      <span className="spec-label">fakewave · log-mel spectrogram</span>
      <div className="spec-toggle" role="group" aria-label="Voice type">
        <button type="button" aria-pressed={mode === "real"} onClick={() => choose("real")}>
          real voice
        </button>
        <button type="button" aria-pressed={mode === "synthetic"} onClick={() => choose("synthetic")}>
          synthetic
        </button>
      </div>
      <span className="spec-axis y">freq ↑ · time →</span>
    </div>
  );
}
