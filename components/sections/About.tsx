import { getAbout, type TimelineItem } from "@/lib/content";

// { title, org, period } → "title, org · period"
function formatItem(item: TimelineItem): string {
  const main = [item.title, item.org].filter(Boolean).join(", ");
  return item.period ? `${main} · ${item.period}` : main;
}

export default function About() {
  const about = getAbout();

  return (
    <section className="frame" id="about" aria-labelledby="about-title">
      <div className="sec-head">
        <div>
          <p className="kicker">cat README.md</p>
          <h2 className="sec-title" id="about-title">
            about/
          </h2>
        </div>
      </div>
      <div className="about-grid">
        <div className="about-main">
          <p>{about.bio}</p>
          <div className="motto">
            <span className="mono">motto:</span>
            <blockquote>{about.motto}</blockquote>
          </div>
        </div>
        <dl className="kv">
          {about.facts.map((fact) => (
            <div key={fact.key}>
              <dt>{fact.key}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
          {about.experience.map((item) => (
            <div key={`experience-${formatItem(item)}`}>
              <dt>experience</dt>
              <dd>{formatItem(item)}</dd>
            </div>
          ))}
          {about.experience.length === 0 && about.experiencePending && (
            <div>
              <dt>experience</dt>
              <dd className="pending">
                {about.experiencePending}
                <span className="cursor" aria-hidden="true" />
              </dd>
            </div>
          )}
          {about.education.map((item) => (
            <div key={`education-${formatItem(item)}`}>
              <dt>education</dt>
              <dd>{formatItem(item)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
