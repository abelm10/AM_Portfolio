"use client";

import { useState, type ReactNode } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/projects";

type Props = {
  projects: Project[];
  tags: string[];
  /** The section heading, rendered beside the filter buttons. */
  children: ReactNode;
};

// Server-renders every card under "all", so the grid is complete before JS loads.
export default function ProjectFilters({ projects, tags, children }: Props) {
  const [active, setActive] = useState("all");

  const matching = (tag: string) =>
    tag === "all" ? projects : projects.filter((project) => project.tags.includes(tag));
  const shown = matching(active);

  return (
    <>
      <div className="sec-head">
        {children}
        <div className="seg" role="group" aria-label="Filter projects">
          {["all", ...tags].map((tag) => {
            const count = matching(tag).length;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={tag === active}
                onClick={() => setActive(tag)}
              >
                {tag}
                {/* The hidden space keeps the accessible name "ml 2" rather than "ml2". */}
                <span className="sr-only"> </span>
                <span className="n">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} of {projects.length} projects
      </p>
      <div className="cards">
        {shown.length > 0 ? (
          shown.map((project) => <ProjectCard key={project.slug} project={project} />)
        ) : (
          <div className="empty">{"// 0 rows returned. Try another filter."}</div>
        )}
      </div>
    </>
  );
}
