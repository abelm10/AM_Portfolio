import { getToolkit } from "@/lib/content";

export default function Toolkit() {
  return (
    <section className="frame" id="toolkit" aria-labelledby="toolkit-title">
      <div className="sec-head">
        <div>
          <p className="kicker">pip freeze | head</p>
          <h2 className="sec-title" id="toolkit-title">
            toolkit/
          </h2>
        </div>
      </div>
      <div className="rows">
        {getToolkit().map((row) => (
          <div className="row" key={row.label}>
            <div className="row-label">
              <strong>{row.label}</strong>
              {row.note}
            </div>
            <div className="tk-items">
              {row.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
