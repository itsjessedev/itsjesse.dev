import Link from "next/link";

interface ProjectExample {
  id: string;
  title: string;
  tagline: string;
  demoUrl?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  badge?: string;
  highlight?: boolean;
  projects: ProjectExample[];
  comparison?: {
    native: string[];
    webview: string[];
  };
}

const services: Service[] = [
  {
    id: "automation",
    title: "Business Automation",
    description: "Eliminate repetitive tasks and streamline your workflows",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    features: [
      "Data sync between platforms",
      "Automated reporting & alerts",
      "Email & notification triggers",
      "Spreadsheet & document automation",
    ],
    color: "from-blue-500 to-cyan-500",
    projects: [
      { id: "syncflow", title: "SyncFlow", tagline: "Salesforce + Jira sync" },
      { id: "invoicebot", title: "InvoiceBot", tagline: "Receipt OCR automation" },
      { id: "reportgen", title: "ReportGen", tagline: "Automated PDF reports" },
    ],
  },
  {
    id: "integration",
    title: "API Integration",
    description: "Connect your tools and make them work together seamlessly",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    features: [
      "REST & GraphQL APIs",
      "Third-party platform connectors",
      "Custom middleware & webhooks",
      "Real-time data pipelines",
    ],
    color: "from-purple-500 to-pink-500",
    projects: [
      { id: "orderhub", title: "OrderHub", tagline: "Multi-platform e-commerce" },
      { id: "leadscore", title: "LeadScore", tagline: "CRM + email integration" },
    ],
  },
  {
    id: "native-apps",
    title: "Native Mobile Apps",
    description: "True native apps with real performance and platform features",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    features: [
      "Flutter & React Native development",
      "Native UI components & performance",
      "Offline support & local storage",
      "Push notifications & deep linking",
    ],
    color: "from-green-500 to-emerald-500",
    badge: "Popular",
    projects: [
      { id: "fieldops", title: "FieldOps", tagline: "Field service management" },
      { id: "itsjesse-mobile", title: "itsjesse.dev Mobile", tagline: "Website-to-app demo" },
    ],
  },
  {
    id: "site-to-app",
    title: "Website to Native App",
    description: "Transform your existing website into a true native mobile app",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    features: [
      "True native UI — not a webview wrapper",
      "Auto-sync: update website, app updates",
      "Push notifications & offline access",
      "Biometric authentication support",
    ],
    color: "from-[var(--accent)] to-purple-500",
    badge: "Featured",
    highlight: true,
    projects: [
      { id: "itsjesse-mobile", title: "itsjesse.dev Mobile", tagline: "This site as a native app" },
    ],
    comparison: {
      native: ["Native performance", "App store approval", "Platform features", "Offline capable", "Push notifications"],
      webview: ["Sluggish scrolling", "May be rejected", "Limited access", "Requires connection", "Basic support"],
    },
  },
  {
    id: "ai-ml",
    title: "AI & Machine Learning",
    description: "Intelligent solutions that learn and adapt to your needs",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    features: [
      "Document intelligence (RAG)",
      "Text classification & sentiment",
      "Custom ML model training",
      "Chatbot & LLM integration",
    ],
    color: "from-orange-500 to-yellow-500",
    projects: [
      { id: "documind", title: "DocuMind", tagline: "RAG document search", demoUrl: "https://documind.itsjesse.dev" },
      { id: "smartclassify", title: "SmartClassify", tagline: "ML text classification", demoUrl: "https://smartclassify.itsjesse.dev" },
      { id: "feedbackpulse", title: "FeedbackPulse", tagline: "Sentiment analysis" },
    ],
  },
  {
    id: "dashboards",
    title: "Real-time Dashboards",
    description: "Get instant visibility into your business metrics and operations",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    features: [
      "Live data visualization",
      "Multi-source aggregation",
      "Custom metrics & KPIs",
      "Alert thresholds & notifications",
    ],
    color: "from-teal-500 to-cyan-500",
    projects: [
      { id: "stockalert", title: "StockAlert", tagline: "Inventory monitoring" },
      { id: "feedbackpulse", title: "FeedbackPulse", tagline: "Review analytics" },
    ],
  },
  {
    id: "migration",
    title: "Data Migration",
    description: "Safely migrate from legacy systems to modern platforms",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    features: [
      "Legacy system extraction",
      "Data profiling & validation",
      "Incremental sync with rollback",
      "Relationship preservation",
    ],
    color: "from-slate-500 to-gray-600",
    projects: [
      { id: "databridge", title: "DataBridge", tagline: "Access to HubSpot migration" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gradient">
            Jesse Eldridge
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/#projects" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Projects
            </Link>
            <Link href="/services" className="text-[var(--accent)] transition-colors">
              Services
            </Link>
            <Link href="/#about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-[var(--accent)] font-medium mb-4">Services</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Solutions that <span className="text-gradient">scale with you</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              From simple automations to complex AI systems, I build custom solutions
              tailored to your specific needs. Each service below includes real project examples.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container">
          <div className="space-y-16">
            {services.map((service) => (
              <div
                key={service.id}
                id={service.id}
                className={`glass-card p-8 md:p-10 scroll-mt-24 ${service.highlight ? 'border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5' : ''}`}
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Service Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white flex-shrink-0`}>
                        {service.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold">{service.title}</h2>
                          {service.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              service.badge === 'Featured'
                                ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {service.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-secondary)]">{service.description}</p>
                      </div>
                    </div>

                    <ul className="grid sm:grid-cols-2 gap-3 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[var(--text-secondary)]">
                          <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Native vs Webview comparison for site-to-app */}
                    {service.comparison && (
                      <div className="mt-6 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-[var(--text-secondary)]">
                          Native App vs Webview Wrapper
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-green-400 mb-2">True Native</p>
                            {service.comparison.native.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {item}
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="font-medium text-red-400 mb-2">Webview</p>
                            {service.comparison.webview.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Project Examples */}
                  <div className="lg:w-80 flex-shrink-0">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                      Project Examples
                    </h3>
                    <div className="space-y-3">
                      {service.projects.map((project) => (
                        <Link
                          key={project.id}
                          href={project.demoUrl || `/projects#${project.id}`}
                          target={project.demoUrl ? "_blank" : undefined}
                          className="block p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium group-hover:text-[var(--accent)] transition-colors">
                                {project.title}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)]">{project.tagline}</p>
                            </div>
                            <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          {project.demoUrl && (
                            <p className="text-xs text-[var(--accent)] mt-2">Live Demo</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">How I Work</h2>
          <p className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto">
            A straightforward process that gets you from idea to working solution.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Discovery", desc: "We discuss your needs and identify the right solution" },
              { step: "02", title: "Design", desc: "I create a detailed plan and architecture" },
              { step: "03", title: "Build", desc: "Rapid development with regular check-ins" },
              { step: "04", title: "Launch", desc: "Deployment, testing, and training" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-bold text-gradient mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to streamline your business?
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how I can help you automate, integrate, and scale.
          </p>
          <a
            href="mailto:jesse@itsjesse.dev"
            className="btn-primary text-lg"
          >
            Get in Touch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} Jesse Eldridge. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
            <Link href="/#projects" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Projects</Link>
            <Link href="/services" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Services</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
