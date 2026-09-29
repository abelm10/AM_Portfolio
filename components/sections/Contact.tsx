import { getSite } from "@/lib/content";

// "https://github.com/abelm10" → "github.com/abelm10"; pathOnly gives "abelm10"-style paths
function display(url: string, pathOnly = false): string {
  const { host, pathname } = new URL(url);
  const path = pathname.replace(/\/$/, "");
  return pathOnly ? path.replace(/^\//, "") : `${host.replace(/^www\./, "")}${path}`;
}

export default function Contact() {
  const site = getSite();
  const links = [
    { key: "linkedin/", handle: display(site.linkedin, true), href: site.linkedin, external: true },
    { key: "github/", handle: display(site.github), href: site.github, external: true },
    { key: "kaggle/", handle: "FakeWave audio dataset", href: site.kaggle, external: true },
    ...(site.email
      ? [{ key: "email/", handle: site.email, href: `mailto:${site.email}`, external: false }]
      : []),
  ];

  return (
    <section className="frame" id="contact" aria-labelledby="contact-title">
      <h2 className="contact-title" id="contact-title">
        let&apos;s-build-something/
        <span className="cursor" aria-hidden="true" />
      </h2>
      <p className="contact-sub">
        The quickest way to reach me is a message on LinkedIn. Code, datasets and half-finished
        experiments live on GitHub and Kaggle.
      </p>
      <div className="links">
        {links.map((link) => (
          <a
            key={link.key}
            className="link-row"
            href={link.href}
            {...(link.external ? { target: "_blank", rel: "noopener" } : {})}
          >
            <span className="mono">{link.key}</span>
            <span className="handle">{link.handle}</span>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
