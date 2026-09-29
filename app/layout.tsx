import type { Metadata } from "next";
import { Geist_Mono, Mona_Sans } from "next/font/google";
import { getSite } from "@/lib/content";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

// Variable Mona Sans with the width axis: the wordmark uses font-stretch 125%.
const monaSans = Mona_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-mona",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const site = getSite();
const description =
  "Abel M, MSc Data Science student in Bangalore. Models, data pipelines and the small web apps that put them to work.";

// The OG image comes from app/opengraph-image.tsx and is attached automatically.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.name,
    description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: site.name, description },
};

// Runs during HTML parsing, before first paint, so a saved theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
