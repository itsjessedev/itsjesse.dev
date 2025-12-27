import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, Project } from "@/data/projects";
import ImageCarousel from "@/components/ImageCarousel";

// Generate static params for all projects
export function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}

// Generate metadata for each project page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} | Jesse Eldridge`,
    description: project.tagline,
  };
}

// Human-friendly descriptions for each project
const projectDetails: Record<
  string,
  {
    whatItDoes: string;
    howItHelps: string;
    keyFeatures: string[];
    demoUrl?: string;
    videoUrl?: string;
    screenshots: string[];
  }
> = {
  syncflow: {
    whatItDoes:
      "SyncFlow automatically connects your Salesforce CRM and Jira project management data, combining them into a single master spreadsheet that updates itself.",
    howItHelps:
      "Instead of spending hours every week copying and pasting data between systems, SyncFlow handles it all automatically. Your team gets real-time visibility into sales and project data without the manual work.",
    keyFeatures: [
      "Automatic daily sync between Salesforce and Jira",
      "Intelligent conflict resolution when data doesn't match",
      "Historical tracking so you can see changes over time",
      "Email alerts when something needs your attention",
    ],
    videoUrl: "/videos/syncflow-demo.webm",
    screenshots: [
      "/projects/syncflow/hero.png",
      "/projects/syncflow/dashboard.png",
      "/projects/syncflow/history.png",
      "/projects/syncflow/mapping.png",
      "/projects/syncflow/analytics.png",
      "/projects/syncflow/settings.png",
      "/projects/syncflow/alerts.png",
    ],
  },
  orderhub: {
    whatItDoes:
      "OrderHub brings all your e-commerce orders from Shopify, Amazon, eBay, and Etsy into one simple dashboard. No more checking four different seller accounts.",
    howItHelps:
      "When you sell on multiple platforms, keeping track of inventory and orders becomes a nightmare. OrderHub solves this by giving you one place to see everything, update stock levels, and manage fulfillment.",
    keyFeatures: [
      "Real-time order notifications from all platforms",
      "Unified inventory that syncs across all stores",
      "One-click order status updates that sync back to each platform",
      "Daily sales reports across all channels",
    ],
    demoUrl: "https://orderhub.itsjesse.dev",
    videoUrl: "/videos/orderhub-demo.webm",
    screenshots: [
      "/projects/orderhub/hero.png",
      "/projects/orderhub/dashboard.png",
      "/projects/orderhub/orders.png",
      "/projects/orderhub/inventory.png",
      "/projects/orderhub/integrations.png",
      "/projects/orderhub/analytics.png",
      "/projects/orderhub/settings.png",
    ],
  },
  invoicebot: {
    whatItDoes:
      "Snap a photo of any receipt, and InvoiceBot will read it, categorize the expense, and add it directly to your QuickBooks accounting software.",
    howItHelps:
      "No more shoebox full of receipts or hours of data entry at tax time. Just photograph receipts as you get them, and InvoiceBot handles the rest. Your books stay current automatically.",
    keyFeatures: [
      "Reads receipts in any format - paper, email, PDF",
      "Smart categorization learns your spending patterns",
      "Direct sync to QuickBooks Online",
      "Audit-ready expense reports on demand",
    ],
    videoUrl: "/videos/invoicebot-demo.webm",
    screenshots: [
      "/projects/invoicebot/hero.png",
      "/projects/invoicebot/dashboard.png",
      "/projects/invoicebot/upload.png",
      "/projects/invoicebot/processing.png",
      "/projects/invoicebot/review.png",
      "/projects/invoicebot/history.png",
      "/projects/invoicebot/settings.png",
    ],
  },
  leadscore: {
    whatItDoes:
      "LeadScore analyzes your leads based on their engagement - email opens, website visits, CRM activity - and tells your sales team exactly who to call first.",
    howItHelps:
      "Your salespeople waste time on cold leads while hot prospects go stale. LeadScore fixes this by automatically scoring every lead and alerting you the moment someone shows buying signals.",
    keyFeatures: [
      "Real-time lead scoring based on engagement",
      "Slack alerts when leads become 'hot'",
      "Priority call lists updated automatically",
      "Integration with HubSpot and major email platforms",
    ],
    videoUrl: "/videos/leadscore-demo.webm",
    screenshots: [
      "/projects/leadscore/hero.png",
      "/projects/leadscore/dashboard.png",
      "/projects/leadscore/leads.png",
      "/projects/leadscore/scoring.png",
      "/projects/leadscore/analytics.png",
      "/projects/leadscore/integrations.png",
      "/projects/leadscore/settings.png",
    ],
  },
  stockalert: {
    whatItDoes:
      "StockAlert monitors inventory levels across all your retail locations and sends alerts before you run out of popular items or overorder slow movers.",
    howItHelps:
      "Stockouts cost you sales. Overstock ties up cash. StockAlert finds the sweet spot by tracking what's selling, predicting when you'll run low, and suggesting reorder quantities based on actual sales velocity.",
    keyFeatures: [
      "Multi-location inventory visibility",
      "Smart reorder suggestions based on sales velocity",
      "Low stock alerts via SMS and Slack",
      "Overstock warnings to prevent cash tied in inventory",
    ],
    demoUrl: "https://stockalert.itsjesse.dev",
    videoUrl: "/videos/stockalert-demo.webm",
    screenshots: [
      "/projects/stockalert/hero.png",
      "/projects/stockalert/dashboard.png",
      "/projects/stockalert/inventory.png",
      "/projects/stockalert/locations.png",
      "/projects/stockalert/alerts.png",
      "/projects/stockalert/reorder.png",
      "/projects/stockalert/settings.png",
    ],
  },
  reportgen: {
    whatItDoes:
      "ReportGen automatically pulls data from your databases, spreadsheets, and business tools, then generates beautiful PDF reports and emails them on your schedule.",
    howItHelps:
      "That Monday morning report that takes 4 hours to compile? ReportGen does it overnight and has it in your inbox before you start your coffee. Consistent, accurate, and automatic.",
    keyFeatures: [
      "Connect to any data source - databases, APIs, spreadsheets",
      "Customizable report templates",
      "Scheduled delivery - daily, weekly, monthly",
      "Historical archive with search",
    ],
    videoUrl: "/videos/reportgen-demo.webm",
    screenshots: [
      "/projects/reportgen/hero.png",
      "/projects/reportgen/dashboard.png",
      "/projects/reportgen/templates.png",
      "/projects/reportgen/editor.png",
      "/projects/reportgen/sources.png",
      "/projects/reportgen/schedule.png",
      "/projects/reportgen/history.png",
    ],
  },
  feedbackpulse: {
    whatItDoes:
      "FeedbackPulse gathers customer feedback from Google Reviews, Yelp, surveys, and support tickets, then uses AI to spot trends and alert you to problems early.",
    howItHelps:
      "By the time you notice bad reviews piling up, the damage is done. FeedbackPulse catches negative sentiment early, so you can fix issues before they hurt your reputation.",
    keyFeatures: [
      "Unified view of all customer feedback",
      "AI-powered sentiment analysis",
      "Trend detection and early warning alerts",
      "Competitive comparison with local businesses",
    ],
    demoUrl: "https://feedbackpulse.itsjesse.dev",
    videoUrl: "/videos/feedbackpulse-demo.webm",
    screenshots: [
      "/projects/feedbackpulse/hero.png",
      "/projects/feedbackpulse/dashboard.png",
      "/projects/feedbackpulse/reviews.png",
      "/projects/feedbackpulse/surveys.png",
      "/projects/feedbackpulse/trends.png",
      "/projects/feedbackpulse/alerts.png",
      "/projects/feedbackpulse/sources.png",
    ],
  },
  bookingsync: {
    whatItDoes:
      "BookingSync provides online appointment booking for your customers, sends automatic reminders to reduce no-shows, and follows up after visits to request reviews.",
    howItHelps:
      "No-shows kill service businesses. BookingSync cuts them by 60% with SMS and email reminders. The automated review requests help build your online reputation without you lifting a finger.",
    keyFeatures: [
      "Online booking widget for your website",
      "Automatic SMS and email reminders",
      "No-show tracking and follow-up",
      "Post-appointment review request sequences",
    ],
    demoUrl: "https://bookingsync.itsjesse.dev",
    videoUrl: "/videos/bookingsync-demo.webm",
    screenshots: [
      "/projects/bookingsync/hero.png",
      "/projects/bookingsync/dashboard.png",
      "/projects/bookingsync/calendar.png",
      "/projects/bookingsync/bookings.png",
      "/projects/bookingsync/reminders.png",
      "/projects/bookingsync/widget.png",
      "/projects/bookingsync/settings.png",
    ],
  },
  databridge: {
    whatItDoes:
      "DataBridge migrates your data from legacy systems (old databases, Access, outdated CRMs) to modern platforms without losing relationships or history.",
    howItHelps:
      "Stuck on a 15-year-old system because you're afraid of losing data? DataBridge handles the migration with full validation, rollback capability, and zero data loss. Your history comes with you.",
    keyFeatures: [
      "Connect to legacy databases including Access, FoxPro, old SQL",
      "Intelligent field mapping with validation",
      "Incremental sync during transition period",
      "Full rollback capability if anything goes wrong",
    ],
    videoUrl: "/videos/databridge-demo.webm",
    screenshots: [
      "/projects/databridge/hero.png",
      "/projects/databridge/dashboard.png",
      "/projects/databridge/sources.png",
      "/projects/databridge/mapping.png",
      "/projects/databridge/validation.png",
      "/projects/databridge/progress.png",
      "/projects/databridge/history.png",
    ],
  },
  workflowbot: {
    whatItDoes:
      "WorkflowBot turns your internal processes - PTO requests, expense approvals, onboarding checklists - into Slack conversations with automatic routing and tracking.",
    howItHelps:
      "Internal requests get lost in email. WorkflowBot moves them to Slack where they're visible, trackable, and automatically routed to the right approver. Complete audit trail for compliance.",
    keyFeatures: [
      "Slack-native workflow management",
      "Automatic routing to approvers",
      "Status tracking and reminders",
      "Complete audit trail for compliance",
    ],
    videoUrl: "/videos/workflowbot-demo.webm",
    screenshots: [
      "/projects/workflowbot/hero.png",
      "/projects/workflowbot/dashboard.png",
      "/projects/workflowbot/workflows.png",
      "/projects/workflowbot/editor.png",
      "/projects/workflowbot/requests.png",
      "/projects/workflowbot/approvals.png",
      "/projects/workflowbot/settings.png",
    ],
  },
  dealscout: {
    whatItDoes:
      "DealScout monitors marketplace alerts, uses AI to classify items, fetches real-time eBay prices, and tracks the complete flip lifecycle from purchase to sale.",
    howItHelps:
      "Stop missing profitable deals and struggling to track profits. DealScout gives you instant profit calculations on new deals and helps you track ROI across all your flips.",
    keyFeatures: [
      "AI-powered item classification",
      "Real-time eBay market price lookups",
      "Push notifications for high-ROI opportunities",
      "Complete flip lifecycle tracking",
    ],
    demoUrl: "https://dealscout.itsjesse.dev",
    videoUrl: "/videos/dealscout-demo.webm",
    screenshots: [
      "/projects/dealscout/hero.png",
      "/projects/dealscout/deals.png",
      "/projects/dealscout/detail.png",
      "/projects/dealscout/flips.png",
      "/projects/dealscout/profits.png",
      "/projects/dealscout/notifications.png",
      "/projects/dealscout/settings.png",
    ],
  },
  documind: {
    whatItDoes:
      "DocuMind uses Retrieval Augmented Generation to search across your document collections and answer natural language questions with source citations.",
    howItHelps:
      "Finding information across hundreds of documents is time-consuming. DocuMind lets you ask questions in plain English and get accurate answers with links to the source.",
    keyFeatures: [
      "Semantic search across all documents",
      "Natural language Q&A interface",
      "Source attribution for every answer",
      "Multiple document format support",
    ],
    demoUrl: "https://documind.itsjesse.dev",
    videoUrl: "/videos/documind-demo.webm",
    screenshots: [
      "/projects/documind/hero.png",
      "/projects/documind/dashboard.png",
      "/projects/documind/documents.png",
      "/projects/documind/search.png",
      "/projects/documind/chat.png",
      "/projects/documind/analytics.png",
      "/projects/documind/settings.png",
    ],
  },
  smartclassify: {
    whatItDoes:
      "SmartClassify is an ML pipeline that categorizes text into categories, analyzes sentiment, and extracts keywords using trained machine learning models.",
    howItHelps:
      "Manual text review doesn't scale. SmartClassify processes thousands of documents automatically, categorizing and analyzing them with confidence scores.",
    keyFeatures: [
      "7-category text classification",
      "Sentiment analysis with confidence scores",
      "Batch processing for high volume",
      "RESTful API for integration",
    ],
    demoUrl: "https://smartclassify.itsjesse.dev",
    videoUrl: "/videos/smartclassify-demo.webm",
    screenshots: [
      "/projects/smartclassify/hero.png",
      "/projects/smartclassify/dashboard.png",
      "/projects/smartclassify/classify.png",
      "/projects/smartclassify/batch.png",
      "/projects/smartclassify/categories.png",
      "/projects/smartclassify/analytics.png",
      "/projects/smartclassify/api.png",
    ],
  },
  fieldops: {
    whatItDoes:
      "FieldOps is a native mobile app for field service teams to manage tasks, track locations, capture photos, and work offline in areas with poor connectivity.",
    howItHelps:
      "Paper-based field service leads to missed appointments and poor documentation. FieldOps digitizes the entire workflow with offline support.",
    keyFeatures: [
      "GPS tracking and route optimization",
      "Task management with priorities",
      "Photo documentation",
      "Offline-first architecture",
    ],
    videoUrl: "/videos/fieldops-demo.webm",
    screenshots: [
      "/projects/fieldops/hero.png",
      "/projects/fieldops/dashboard.png",
      "/projects/fieldops/tasks.png",
      "/projects/fieldops/task-detail.png",
      "/projects/fieldops/map.png",
      "/projects/fieldops/photos.png",
      "/projects/fieldops/schedule.png",
    ],
  },
  "itsjesse-mobile": {
    whatItDoes:
      "This portfolio website converted to a true native Flutter app that pulls from the same JSON API, demonstrating website-to-app conversion.",
    howItHelps:
      "Businesses want mobile presence without webview wrappers. This demonstrates how to build a true native app that syncs with website content.",
    keyFeatures: [
      "True native performance and feel",
      "Auto-sync with website content",
      "Offline caching of portfolio data",
      "Demonstrates Website-to-App service",
    ],
    videoUrl: "/videos/itsjesse-mobile-demo.webm",
    screenshots: [
      "/projects/itsjesse-mobile/hero.png",
      "/projects/itsjesse-mobile/dashboard.png",
      "/projects/itsjesse-mobile/projects.png",
      "/projects/itsjesse-mobile/project-detail.png",
      "/projects/itsjesse-mobile/services.png",
      "/projects/itsjesse-mobile/about.png",
      "/projects/itsjesse-mobile/contact.png",
    ],
  },
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  const details = projectDetails[project.id] || {
    whatItDoes: project.description,
    howItHelps: project.solution,
    keyFeatures: project.results,
    screenshots: [],
  };

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
              href="/projects"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              All Projects
            </Link>
            <Link
              href="/#services"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Services
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
              href="/resume.html"
              className="text-sm px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Resume
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-12">
        <div className="container">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
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
            All Projects
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="tag">{project.category}</span>
            {project.featured && (
              <span className="text-xs bg-[var(--accent)] text-white px-3 py-1 rounded-full">
                Featured Project
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {project.title}
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mb-8">
            {project.tagline}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {details.demoUrl && (
              <a
                href={details.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Launch Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 hover:scale-105 transition-transform duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                View Source Code
              </a>
            )}
            {project.downloadUrl && (
              <a
                href={project.downloadUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 hover:scale-105 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Demo APK
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Screenshot/Preview Section */}
      <section className="py-8">
        <div className="container">
          <div className="glass-card overflow-hidden">
            <ImageCarousel
              images={details.screenshots.length > 0 ? details.screenshots : (project.image ? [project.image] : [])}
              title={project.title}
            />
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What It Does</h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                {details.whatItDoes}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">How It Helps</h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                {details.howItHelps}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-12 bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">The Problem</h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {project.problem}
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {details.keyFeatures.map((feature, index) => (
              <div key={index} className="glass-card p-6 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--accent)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {project.results.map((result, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-gradient mb-2">
                  {result.split(" ")[0]}
                </div>
                <p className="text-[var(--text-secondary)]">
                  {result.split(" ").slice(1).join(" ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Built With</h2>
          <div className="flex flex-wrap gap-3">
            {project.tech.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">See It In Action</h2>
          <div className="glass-card overflow-hidden">
            {details.videoUrl ? (
              <video
                className="w-full aspect-video"
                controls
                autoPlay
                muted
                loop
                playsInline
              >
                <source src={details.videoUrl} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-[var(--accent)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    Demo video coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <div className="glass-card p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Something Like This?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {project.title} was built to solve a specific problem. I can build
              something custom for your business too.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/#contact" className="btn-primary">
                Get a Free Quote
              </Link>
              <Link href="/projects" className="btn-secondary">
                See More Projects
              </Link>
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
              href="/#contact"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
