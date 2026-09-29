import { ImageResponse } from "next/og";
import { getSite } from "@/lib/content";

export const alt = "ABEL M wordmark with a green and gold pixel pair";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Light tokens from app/globals.css.
const BG = "#e9edec";
const LINE = "#c3ccc7";
const FG = "#0a0c0b";
const MUTED = "#56615a";
const ACCENT = "#08872b";
const PIXEL = "#c9a400";

/**
 * Mona Sans at the wordmark's width, as a static TTF (Satori can't use woff2 or
 * variable axes). Fetched from Google Fonts once, at build time, since this image
 * is prerendered. Falls back to the default font rather than failing the build.
 */
async function wordmarkFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@125,900&text=ABELM",
      { headers: { "User-Agent": "Mozilla/4.0" } }, // old UA → Google serves TrueType
    ).then((res) => res.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url).then((res) => res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const site = getSite();
  const font = await wordmarkFont();
  const word = {
    fontFamily: font ? "Mona Sans" : undefined,
    fontSize: 250,
    fontWeight: 900,
    lineHeight: 0.8,
    letterSpacing: -9,
  } as const;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, padding: "0 40px" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderLeft: `2px solid ${LINE}`,
            borderRight: `2px solid ${LINE}`,
            color: FG,
          }}
        >
          <div
            style={{
              height: 84,
              display: "flex",
              alignItems: "center",
              padding: "0 32px",
              borderBottom: `2px solid ${LINE}`,
              fontSize: 28,
              color: MUTED,
            }}
          >
            {`${site.handle} · msc data science / bangalore, IN`}
          </div>
          {/* Sized to fit ABEL, so the bottom rule crops the M like the hero does. */}
          <div
            style={{
              height: 252,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "44px 32px 0",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", ...word }}>
              ABEL
              <div style={{ display: "flex", flexDirection: "column", width: 26, height: 52, marginLeft: 16, marginTop: 6 }}>
                <div style={{ flex: 1, background: ACCENT }} />
                <div style={{ flex: 1, background: PIXEL }} />
              </div>
            </div>
            <div style={{ display: "flex", transform: "translateY(92px)", ...word }}>M</div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 14,
              padding: "0 32px 40px",
              borderTop: `2px solid ${LINE}`,
            }}
          >
            <div style={{ display: "flex", fontSize: 26, color: MUTED }}>currently: training fakewave</div>
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.2, maxWidth: 1000 }}>
              I build models, data pipelines and the small web apps that put them to work.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Mona Sans", data: font, weight: 900, style: "normal" }] : undefined,
    },
  );
}
