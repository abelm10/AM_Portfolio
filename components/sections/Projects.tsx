import ProjectFilters from "@/components/ProjectFilters";
import { getLearning, repoUrl } from "@/lib/content";
import { getAllProjects, getAllTags } from "@/lib/projects";

export default function Projects() {
  const learning = getLearning();

  return (
    <section className="frame" id="projects" aria-labelledby="projects-title">
      <ProjectFilters projects={getAllProjects()} tags={getAllTags()}>
        <div>
          <p className="kicker">ls ./work</p>
          <h2 className="sec-title" id="projects-title">
            projects/
          </h2>
        </div>
      </ProjectFilters>
      {learning.length > 0 && (
        <details className="learn">
          <summary>
            <span>
              learning-log/ &nbsp;<span>({learning.length} repos)</span>
            </span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <ul className="learn-list">
            {learning.map((repo) => (
              <li key={repo.name}>
                <a href={repoUrl(repo.name)} target="_blank" rel="noopener">
                  {repo.name}
                </a>
                <span>{repo.note}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
