import Link from "next/link";
import { featuredProjects, allProjects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gradient">
            Jesse Eldridge
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="#projects" className="hidden sm:block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm md:text-base">
              Projects
            </Link>
            <Link href="/services" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm md:text-base">
              Services
            </Link>
            <Link href="#about" className="hidden sm:block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm md:text-base">
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
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="/resume.pdf"
              className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Resume
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-[var(--accent)] font-medium mb-4 animate-fade-in">
              Full-Stack Developer & Automation Specialist
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight animate-fade-in animate-delay-1">
              I build systems that <span className="text-gradient">work for you</span>
            </h1>
            <p className="text-base md:text-xl text-[var(--text-secondary)] mb-6 md:mb-8 leading-relaxed animate-fade-in animate-delay-2">
              From business automation to native mobile apps and AI solutions —
              I create custom software that eliminates busywork and helps you scale.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4 animate-fade-in animate-delay-3">
              <Link href="#projects" className="btn-primary text-sm md:text-base">
                View My Work
              </Link>
              <Link href="/services" className="btn-secondary text-sm md:text-base">
                Services
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8 md:gap-12 mt-12 md:mt-16 animate-fade-in animate-delay-4">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-gradient">15+</p>
                <p className="text-[var(--text-secondary)] text-sm md:text-base">Projects built</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-gradient">50+</p>
                <p className="text-[var(--text-secondary)] text-sm md:text-base">Hours saved weekly</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-gradient">4</p>
                <p className="text-[var(--text-secondary)] text-sm md:text-base">Service areas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What I Do Section */}
      <section className="py-16 md:py-24 bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">What I Do</h2>
          <p className="text-[var(--text-secondary)] mb-12 max-w-2xl">
            Full-stack development with a focus on automation, integration, and intelligent solutions.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Workflow Automation */}
            <div className="glass-card p-8 hover-glow">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Automation</h3>
              <p className="text-[var(--text-secondary)]">
                Eliminate repetitive tasks with custom scripts and automated workflows.
              </p>
            </div>

            {/* API Integrations */}
            <div className="glass-card p-8 hover-glow">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Integration</h3>
              <p className="text-[var(--text-secondary)]">
                Connect your tools and platforms into unified, seamless workflows.
              </p>
            </div>

            {/* Native Mobile Apps */}
            <div className="glass-card p-8 hover-glow">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Native Apps</h3>
              <p className="text-[var(--text-secondary)]">
                True native mobile apps with Flutter & React Native — not webview wrappers.
              </p>
            </div>

            {/* AI & ML */}
            <div className="glass-card p-8 hover-glow">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI & ML</h3>
              <p className="text-[var(--text-secondary)]">
                Document intelligence, text classification, and custom ML solutions.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/services" className="btn-secondary">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Website-to-App Banner */}
      <section className="py-16">
        <div className="container">
          <div className="glass-card p-8 md:p-12 bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border-[var(--accent)]/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-sm font-medium mb-4">
                  Featured Service
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Website → Native App
                </h2>
                <p className="text-[var(--text-secondary)] text-lg mb-4">
                  Transform your existing website into a true native mobile app.
                  Real native UI, auto-sync content, push notifications.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    True Native
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Auto-Sync
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Not a Webview
                  </span>
                </div>
              </div>
              <div>
                <Link href="/services#site-to-app" className="btn-primary">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section id="projects" className="py-16 md:py-24 bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Featured Projects</h2>
          <p className="text-[var(--text-secondary)] mb-12 max-w-2xl">
            Real solutions with working demos. From automation to AI — each project solves a real problem.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} size="large" />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/projects" className="btn-secondary">
              View All {allProjects.length} Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Services & Pricing</h2>
          <p className="text-[var(--text-secondary)] mb-12 max-w-2xl">
            Transparent pricing for common projects. Every business is different — reach out for a custom quote.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Automation & Integration */}
            <div className="glass-card p-8 hover-glow">
              <h3 className="text-xl font-semibold mb-2">Automation</h3>
              <p className="text-3xl font-bold text-gradient mb-4">$300–4,000</p>
              <p className="text-[var(--text-secondary)] mb-6">
                Workflow automation, API integrations, data sync.
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Custom scripts & workflows
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Platform integrations
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Dashboards & reporting
                </li>
              </ul>
            </div>

            {/* Native Mobile Apps */}
            <div className="glass-card p-8 hover-glow border-[var(--accent)]/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[var(--accent)] text-white text-xs font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Native Apps</h3>
              <p className="text-3xl font-bold text-gradient mb-4">$2,000–8,000</p>
              <p className="text-[var(--text-secondary)] mb-6">
                True native mobile apps for iOS & Android.
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Flutter or React Native
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Website-to-App conversion
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  App store deployment
                </li>
              </ul>
            </div>

            {/* AI & ML */}
            <div className="glass-card p-8 hover-glow">
              <h3 className="text-xl font-semibold mb-2">AI Solutions</h3>
              <p className="text-3xl font-bold text-gradient mb-4">$1,500–6,000</p>
              <p className="text-[var(--text-secondary)] mb-6">
                Document intelligence, classification, custom ML.
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  RAG document search
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Text classification
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sentiment analysis
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/services" className="btn-primary">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              {/* Profile Photo */}
              <div className="mb-8">
                <img
                  src="/jesse.jpg"
                  alt="Jesse Eldridge"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[var(--accent)]/20"
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">About Me</h2>
              <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
                I&apos;m Jesse, a full-stack developer who builds things that make work easier.
                From automating tedious workflows to building native mobile apps and AI-powered tools —
                I focus on practical solutions that actually get used.
              </p>
              <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
                My approach: understand the problem, build something that fits, and make sure you own it.
                No vendor lock-in, no unnecessary complexity — just tools that work.
              </p>

              {/* For employers */}
              <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--accent)]">Open to opportunities:</span> Available for
                  full-time roles in full-stack development, automation, or developer tools.
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <a href="/resume.pdf" className="btn-primary">
                  Download Resume
                </a>
                <a
                  href="https://linkedin.com/in/jesseeldridge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Tech Stack</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {['Python', 'TypeScript', 'JavaScript', 'Dart', 'SQL'].map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Backend & APIs</p>
                  <div className="flex flex-wrap gap-2">
                    {['FastAPI', 'Node.js', 'PostgreSQL', 'REST APIs', 'GraphQL'].map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Frontend & Mobile</p>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Next.js', 'Flutter', 'React Native', 'Tailwind'].map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">AI & ML</p>
                  <div className="flex flex-wrap gap-2">
                    {['scikit-learn', 'Sentence Transformers', 'ChromaDB', 'RAG', 'NLP'].map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    {['Salesforce', 'Shopify', 'HubSpot', 'Stripe', 'Twilio', 'Google APIs'].map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section id="contact" className="py-16 md:py-24">
        <div className="container">
          <div className="glass-card p-6 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Let&apos;s Talk</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">
              Have a project in mind? Need help with automation or want to discuss a role? I&apos;d love to hear from you.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="mailto:jesse@itsjesse.dev" className="btn-primary">
                Email Me
              </a>
              <a
                href="https://github.com/itsjessedev"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/jesseeldridge"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                LinkedIn
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
            <Link href="/projects" className="hover:text-[var(--text-primary)] transition-colors">
              Projects
            </Link>
            <Link href="/services" className="hover:text-[var(--text-primary)] transition-colors">
              Services
            </Link>
            <a href="https://github.com/itsjessedev" className="hover:text-[var(--text-primary)] transition-colors">
              GitHub
            </a>
            <a href="mailto:jesse@itsjesse.dev" className="hover:text-[var(--text-primary)] transition-colors">
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
