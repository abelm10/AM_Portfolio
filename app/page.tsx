import Footer from "@/components/sections/Footer";
import Nav from "@/components/sections/Nav";
import {
  getAbout,
  getHobbies,
  getLearning,
  getLog,
  getSite,
  getToolkit,
} from "@/lib/content";
import { getAllProjects, getAllTags } from "@/lib/projects";

// Phase 2 placeholder: the frame, nav and footer are final; the sections land in phase 3.
// Every loader runs here so an invalid content file already fails the build.
export default function Home() {
  const site = getSite();
  const projects = getAllProjects();
  const loaded = [
    `site: ${site.name} (@${site.handle})`,
    `projects: ${projects.map((p) => p.title).join(" ")}`,
    `tags: ${getAllTags().join(", ")}`,
    `learning-log: ${getLearning().length} repos`,
    `commit-log: ${getLog().map((g) => g.month).join(" ")}`,
    `toolkit: ${getToolkit().map((r) => r.label).join(", ")}`,
    `off-the-clock: ${getHobbies().map((h) => h.title).join(" ")}`,
    `about: ${getAbout().facts.length} facts`,
  ];

  return (
    <>
      <Nav />
      <main>
        <section className="frame" id="top" style={{ borderTop: 0 }}>
          <div className="sec-head">
            <div>
              <p className="kicker">phase 2 / foundation</p>
              <h1 className="sec-title">sections/</h1>
              <p className="sec-sub">
                Tokens, fonts, theme, frame, nav and footer are in. The sections land in phase 3.
              </p>
            </div>
          </div>
          <ul className="rows log-list">
            {loaded.map((line) => (
              <li key={line} className="mono">
                <time>ok</time>
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
