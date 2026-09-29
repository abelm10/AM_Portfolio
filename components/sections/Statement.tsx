const PILLARS = [
  {
    name: "abel.clean()",
    text: "Bronze, silver, gold. Deduplicate, cast types, quarantine the bad rows and hash the PII before anyone draws a chart.",
  },
  {
    name: "abel.model()",
    text: "CNNs on spectrograms, classical ML on images, and a habit of checking what the model actually learned before trusting the score.",
  },
  {
    name: "abel.ship()",
    text: "Flask, Django, Gradio or plain JavaScript, deployed on Vercel. If it runs on my machine, it ships.",
  },
];

export default function Statement() {
  return (
    <section className="frame" aria-labelledby="statement">
      <h2 className="statement" id="statement">
        I like the whole path, from a messy spreadsheet to something people can click.
      </h2>
      <div className="pillars">
        {PILLARS.map((pillar) => (
          <div className="pillar" key={pillar.name}>
            <h3>{pillar.name}</h3>
            <p>{pillar.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
