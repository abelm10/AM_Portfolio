import Spectrogram from "@/components/Spectrogram";
import { getSite } from "@/lib/content";

export default function Hero() {
  const site = getSite();
  // "Abel M" → "ABEL" plus the cropped "M" at the bottom right.
  const [first, ...rest] = site.name.split(" ");
  const last = rest.join(" ");

  return (
    <section className="frame" id="top" data-trail style={{ borderTop: 0 }}>
      <h1 className="wm" aria-label={site.name}>
        <span className="word" aria-hidden="true">
          {first.toUpperCase()}
          <span className="px">
            <i />
            <i />
          </span>
        </span>
        <span className="m" aria-hidden="true">
          {last.toUpperCase()}
        </span>
      </h1>
      <div className="hero-grid">
        <div className="spec-cell">
          <Spectrogram />
          <p className="spec-caption">
            How FakeWave looks at a voice. Cloned speech tends to come out too clean: smooth pitch,
            perfectly even harmonics, no room noise. Illustration, not model output.
          </p>
        </div>
        <div className="hero-info">
          <div className="hero-meta">
            <p>msc data science / bangalore, IN</p>
            <p>
              currently: training fakewave<span className="cursor" aria-hidden="true" />
            </p>
          </div>
          <p className="hero-lede">
            I build models, data pipelines and the small web apps that put them to work.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              See projects <span aria-hidden="true">↓</span>
            </a>
            <a className="btn btn-ghost" href={site.github} target="_blank" rel="noopener">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
