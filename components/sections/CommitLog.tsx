import { getLog, repoUrl } from "@/lib/content";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** ("sep26_", "22 sep") → "2026-09-22", or undefined if either doesn't parse. */
function isoDate(month: string, date: string): string | undefined {
  const year = month.match(/(\d{2})_?$/)?.[1];
  const [day = "", mon = ""] = date.trim().split(/\s+/);
  const index = MONTHS.indexOf(mon.toLowerCase());
  if (!year || index < 0 || !/^\d{1,2}$/.test(day)) return undefined;
  return `20${year}-${String(index + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export default function CommitLog() {
  const log = getLog();
  const oldestGroup = log.at(-1);
  const oldestItem = oldestGroup?.items.at(-1);
  const since = oldestGroup && oldestItem && isoDate(oldestGroup.month, oldestItem.date);

  return (
    <section className="frame" id="log" aria-labelledby="log-title">
      <div className="sec-head">
        <div>
          <p className="kicker">git log --all{since ? ` --since=${since.slice(0, 7)}` : ""}</p>
          <h2 className="sec-title" id="log-title">
            commit-log/
          </h2>
          <p className="sec-sub">The last push on each of my repos, newest first.</p>
        </div>
      </div>
      <div className="rows">
        {log.map((group) => (
          <div className="row" key={group.month}>
            <div className="row-label">
              <strong>{group.month}</strong>
              {group.note}
            </div>
            <ul className="log-list">
              {group.items.map((item) => (
                <li key={`${item.date}-${item.repo}`}>
                  <time dateTime={isoDate(group.month, item.date)}>{item.date}</time>
                  <div>
                    <a href={repoUrl(item.repo)} target="_blank" rel="noopener">
                      {item.repo}
                    </a>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
