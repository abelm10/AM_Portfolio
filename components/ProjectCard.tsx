import type { Project, ProjectStatus } from "@/lib/projects";

// "live" is the solid green tag, "in development" the gold tint, the rest neutral.
function statusClass(status: ProjectStatus): string {
  if (status === "live") return "tag live";
  if (status === "in development") return "tag dev";
  return "tag";
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>{project.title}</h3>
        <span className={statusClass(project.status)}>{project.status}</span>
      </div>
      <p className="card-desc">{project.blurb}</p>
      {project.metric && (
        <div className="metric">
          <b>{project.metric.value}</b>
          <span>{project.metric.label}</span>
        </div>
      )}
      {project.points.length > 0 && (
        <ul className="pts">
          {project.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      <div className="card-foot">
        {project.stack.length > 0 && (
          <ul className="chips" aria-label="Stack">
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {project.links.length > 0 && (
          <div className="card-actions">
            {project.links.map((link) => (
              <a
                key={link.url}
                className={`btn ${link.primary ? "btn-primary" : "btn-ghost"}`}
                href={link.url}
                target="_blank"
                rel="noopener"
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
