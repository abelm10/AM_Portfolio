import ThemeToggle from "@/components/ThemeToggle";
import { getSite } from "@/lib/content";

const LINKS = [
  { href: "#projects", label: "Projects" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#log", label: "Log" },
  { href: "#about", label: "About" },
  { href: "#off-the-clock", label: "Off the clock" },
];

/** hrefBase="/" makes the links work from pages other than the home page (e.g. the 404). */
export default function Nav({ hrefBase = "" }: { hrefBase?: string }) {
  const { handle } = getSite();
  // "abelm10" → "abel" ▮ "m10": the pixel pair sits where the space would be.
  const [first, rest] = [handle.slice(0, 4), handle.slice(4)];

  return (
    <header className="nav">
      <div className="frame nav-row">
        <a className="nav-logo" href={`${hrefBase}#top`} aria-label={`${handle}, back to top`}>
          {first}
          <span className="px" aria-hidden="true">
            <i />
            <i />
          </span>
          {rest}
        </a>
        <nav className="nav-links" aria-label="Sections">
          {LINKS.map((link) => (
            <a key={link.href} href={`${hrefBase}${link.href}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
        <a className="nav-cta" href={`${hrefBase}#contact`}>
          <span className="long">Get in touch</span>
          <span aria-hidden="true">↗</span>
          <span className="sr-only">Contact</span>
        </a>
      </div>
    </header>
  );
}
