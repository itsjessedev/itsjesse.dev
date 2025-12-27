"use client";

import Link from "next/link";
import Image from "next/image";
import { Project } from "@/data/projects";
import DownloadModal from "./DownloadModal";

interface ProjectCardProps {
  project: Project;
  size?: "normal" | "large";
}

export default function ProjectCard({ project, size = "normal" }: ProjectCardProps) {
  const isLarge = size === "large";

  return (
    <div className="glass-card overflow-hidden hover-glow group relative">
      {/* Main card link - covers whole card */}
      <Link
        href={`/projects/${project.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${project.title} project details`}
      />

      {/* Project image */}
      <div
        className={`${isLarge ? "h-48" : "h-40"} bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden`}
      >
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <span
            className={`${isLarge ? "text-2xl md:text-4xl" : "text-xl md:text-3xl"} font-bold text-[var(--text-secondary)]/30 text-center px-4 max-w-full`}
          >
            {project.title}
          </span>
        )}
        {/* Download button for native apps */}
        {project.downloadUrl && (
          <DownloadModal
            appName={project.title}
            downloadUrl={project.downloadUrl}
            isLarge={isLarge}
          />
        )}
        {/* Demo button - positioned above the card link */}
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute ${isLarge ? "top-4 right-4" : "top-3 right-3"} z-20 text-xs bg-[var(--accent)] text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg shadow-black/40 backdrop-blur-sm hover:bg-[var(--accent)]/90 hover:scale-105 transition-all duration-200`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Live Demo
          </a>
        )}
        {/* GitHub button - positioned above the card link */}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute ${isLarge ? (project.demoUrl ? "top-14 right-4" : "top-4 right-4") : (project.demoUrl ? "top-11 right-3" : "top-3 right-3")} z-20 text-xs bg-black/80 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg shadow-black/40 backdrop-blur-sm hover:bg-black/90 hover:scale-105 transition-all duration-200`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            View Code
          </a>
        )}
        {project.featured && (
          <div className={`absolute ${isLarge ? "top-4 left-4" : "top-3 left-3"}`}>
            <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-lg shadow-lg shadow-black/40 backdrop-blur-sm font-medium">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className={isLarge ? "p-6" : "p-5"}>
        <div className="flex items-center gap-2 mb-2">
          <span className="tag text-xs">{project.category}</span>
        </div>
        <h3
          className={`${isLarge ? "text-xl" : "text-lg"} font-semibold mb-2 group-hover:text-[var(--accent)] transition-colors`}
        >
          {project.title}
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">{project.tagline}</p>

        {/* Results preview */}
        <div className="mb-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
          <p className="text-xs text-[var(--accent)] mb-1">Key Result:</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {project.results[0]}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, isLarge ? 5 : 4).map((t) => (
            <span
              key={t}
              className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded"
            >
              {t}
            </span>
          ))}
          {project.tech.length > (isLarge ? 5 : 4) && (
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
              +{project.tech.length - (isLarge ? 5 : 4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
