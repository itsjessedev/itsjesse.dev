"use client";

import Link from "next/link";
import { useState } from "react";
import { allProjects, Project } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";

type Category = "all" | Project["category"];

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const categories: { value: Category; label: string }[] = [
    { value: "all", label: "All Projects" },
    { value: "automation", label: "Automation" },
    { value: "integration", label: "Integration" },
    { value: "dashboard", label: "Dashboard" },
    { value: "migration", label: "Migration" },
    { value: "native-apps", label: "Native Apps" },
    { value: "ai-ml", label: "AI/ML" },
  ];

  const filteredProjects =
    activeCategory === "all"
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory);

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gradient">
            Jesse Eldridge
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/#projects"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Featured
            </Link>
            <Link
              href="/#services"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Services
            </Link>
            <Link
              href="/#about"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              About
            </Link>
            <a
              href="https://github.com/itsjessedev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
            <a
              href="/resume.pdf"
              className="text-sm px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Resume
            </a>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="pt-32 pb-12">
        <div className="container">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            All <span className="text-gradient">Projects</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl">
            {allProjects.length} automation and integration projects. Each one
            solves a real business problem with working code you can explore.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="pb-8 sticky top-16 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
                }`}
              >
                {cat.label}
                {cat.value !== "all" && (
                  <span className="ml-2 opacity-60">
                    ({allProjects.filter((p) => p.category === cat.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">
                No projects found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="glass-card p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Something Similar?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              These projects showcase what&apos;s possible. Let&apos;s build
              something custom for your business.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/#contact" className="btn-primary">
                Get a Free Quote
              </Link>
              <a
                href="https://github.com/itsjessedev"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-[var(--text-secondary)] text-sm">
          <p>&copy; {new Date().getFullYear()} Jesse Eldridge</p>
          <div className="flex gap-6">
            <a
              href="https://github.com/itsjessedev"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/jesseeldridge"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="mailto:jesse@itsjesse.dev"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
