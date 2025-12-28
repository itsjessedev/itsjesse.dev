import Link from "next/link";

export default function PrivacyPage() {
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
            <Link href="/services" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Services
            </Link>
            <Link href="/#about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
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
              href="/resume.html"
              className="text-sm px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Resume
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-24">
        <div className="container max-w-4xl">
          <p className="text-[var(--accent)] font-medium mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-[var(--text-secondary)] mb-12">
            Last updated: December 28, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Jesse Eldridge (&quot;I&quot;, &quot;me&quot;, or &quot;my&quot;) operates itsjesse.dev (the &quot;Website&quot;).
                This page informs you of my policies regarding the collection, use, and disclosure of personal
                information when you use my Website and the choices you have associated with that information.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                I am committed to protecting your privacy. By using this Website, you agree to the collection
                and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information Collection */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Information I Collect</h2>

              <h3 className="text-xl font-semibold mb-3 text-[var(--accent)]">Information You Provide</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                When you use the contact form on this Website, I collect:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mb-6">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your company name (if provided)</li>
                <li>The contents of your message</li>
                <li>Any files you choose to attach</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-[var(--accent)]">Automatically Collected Information</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                When you visit the Website, I may automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Your IP address (anonymized)</li>
                <li>Browser type and version</li>
                <li>Pages you visit and time spent</li>
                <li>Referring website</li>
                <li>Device type and operating system</li>
              </ul>
            </section>

            {/* How I Use Information */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">How I Use Your Information</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                I use the information I collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>To respond to your inquiries and provide requested services</li>
                <li>To send project proposals and related communications</li>
                <li>To improve the Website and user experience</li>
                <li>To analyze website traffic and usage patterns</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Data Sharing</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                I do not sell, trade, or rent your personal information to third parties. I may share your
                information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party services that help me operate my business (e.g., email hosting, cloud storage), who are bound by confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect my rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                This Website may use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li><strong>Cloudflare:</strong> For CDN, security, and performance optimization</li>
                <li><strong>Google Workspace:</strong> For email communication</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Each of these services has its own privacy policy governing how they handle your data.
              </p>
            </section>

            {/* Data Security */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                I take reasonable measures to protect your personal information from unauthorized access,
                alteration, disclosure, or destruction. This includes using HTTPS encryption for all data
                transmission and storing data on secure servers. However, no method of transmission over the
                Internet or electronic storage is 100% secure, and I cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                I retain your personal information only for as long as necessary to fulfill the purposes
                outlined in this policy, unless a longer retention period is required by law. Contact form
                submissions are retained for the duration of our business relationship and for a reasonable
                period thereafter for legal and business purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data I hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                To exercise any of these rights, please contact me at jesse@itsjesse.dev.
              </p>
            </section>

            {/* Cookies */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Cookies</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This Website uses minimal cookies necessary for functionality. I do not use tracking cookies
                or third-party advertising cookies. Essential cookies may be set by Cloudflare for security
                and performance purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Children&apos;s Privacy</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This Website is not intended for children under 13 years of age. I do not knowingly collect
                personal information from children under 13. If you are a parent or guardian and believe your
                child has provided me with personal information, please contact me so I can delete it.
              </p>
            </section>

            {/* Changes */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                I may update this Privacy Policy from time to time. I will notify you of any changes by
                posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Me</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact me:
              </p>
              <ul className="list-none text-[var(--text-secondary)] space-y-2 mt-4">
                <li><strong>Email:</strong> jesse@itsjesse.dev</li>
                <li><strong>Website:</strong> <Link href="/#contact" className="text-[var(--accent)] hover:underline">itsjesse.dev/contact</Link></li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} Jesse Eldridge
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
            <Link href="/projects" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Projects</Link>
            <Link href="/services" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Services</Link>
            <Link href="/privacy" className="text-[var(--accent)]">Privacy</Link>
            <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
