import { Fragment } from "react";
import { getHobbies } from "@/lib/content";

// "FT  *2 – 1*   90+4'" → FT  <em>2 – 1</em>   90+4'
function boardLine(line: string) {
  return line
    .split(/(\*[^*]+\*)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

export default function OffTheClock() {
  return (
    <section className="frame" id="off-the-clock" aria-labelledby="otc-title">
      <div className="sec-head">
        <div>
          <p className="kicker">{"while (weekend) { watch(); }"}</p>
          <h2 className="sec-title" id="otc-title">
            off-the-clock/
          </h2>
          <p className="sec-sub">
            I follow enough sport that I built Fixtures just to keep track of it all.
          </p>
        </div>
      </div>
      <div className="tiles">
        {getHobbies().map((hobby) => (
          <div className="tile" key={hobby.title}>
            <div className="board" aria-hidden="true">
              {hobby.board.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && "\n"}
                  {boardLine(line)}
                </Fragment>
              ))}
            </div>
            <h3>{hobby.title}</h3>
            <p>{hobby.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
