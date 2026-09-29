import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/sections/Footer";
import Nav from "@/components/sections/Nav";

export const metadata: Metadata = { title: "404 · Abel M", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <Nav hrefBase="/" />
      <main>
        <section className="frame nf" style={{ borderTop: 0 }}>
          <h1 className="nf-title">404/</h1>
          <p className="nf-sub mono">{"// route not found. The bugs got to it."}</p>
          <div className="nf-actions">
            <Link className="btn btn-primary" href="/">
              Back home <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
