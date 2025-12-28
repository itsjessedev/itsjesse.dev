import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-[var(--text-secondary)] mb-12">
            Last updated: December 28, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                By accessing or using itsjesse.dev (the &quot;Website&quot;), you agree to be bound by these Terms
                of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access
                the Website.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                These Terms apply to all visitors, users, and others who access or use the Website. For services
                provided under a separate contract (e.g., development projects), that contract&apos;s terms take
                precedence over these Terms where they conflict.
              </p>
            </section>

            {/* Services Description */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Description of Services</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                This Website serves as a portfolio and professional presence for Jesse Eldridge, offering:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Information about my professional services (automation, integration, mobile development, AI/ML)</li>
                <li>Portfolio of past projects and demos</li>
                <li>A contact form to inquire about services</li>
                <li>Resume and professional background information</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Actual development services are governed by separate Service Agreements entered into between
                myself and clients.
              </p>
            </section>

            {/* Use of Website */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                You agree to use the Website only for lawful purposes. You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Use the Website in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to any part of the Website</li>
                <li>Interfere with or disrupt the Website or servers</li>
                <li>Transmit viruses, malware, or other malicious code</li>
                <li>Scrape, crawl, or collect data without permission</li>
                <li>Impersonate another person or entity</li>
                <li>Submit false or misleading information through the contact form</li>
                <li>Use the Website for spam or unsolicited commercial communications</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                The Website and its original content, features, and functionality are owned by Jesse Eldridge
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <h3 className="text-xl font-semibold mb-3 text-[var(--accent)]">You May:</h3>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mb-4">
                <li>View and browse the Website for personal, non-commercial use</li>
                <li>Share links to the Website</li>
                <li>Reference my work when attributing the source</li>
              </ul>
              <h3 className="text-xl font-semibold mb-3 text-[var(--accent)]">You May Not:</h3>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Copy, modify, or distribute the Website content without permission</li>
                <li>Use the Website content for commercial purposes without authorization</li>
                <li>Remove any copyright or proprietary notices</li>
                <li>Use demo applications in ways not intended (e.g., as production systems)</li>
              </ul>
            </section>

            {/* Demo Applications */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Demo Applications</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                The portfolio includes live demo applications for demonstration purposes. These demos:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Are provided &quot;as-is&quot; for demonstration purposes only</li>
                <li>Should not be used for production or business-critical purposes</li>
                <li>May use simulated or sample data</li>
                <li>May be modified or removed at any time without notice</li>
                <li>Do not store or persist user-submitted data beyond the session</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Do not submit real, sensitive, or personal data to demo applications.
              </p>
            </section>

            {/* Contact Form */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Form Submissions</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                When you submit information through the contact form:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>You represent that the information provided is accurate and not misleading</li>
                <li>You consent to receive a response via the email address provided</li>
                <li>You agree not to submit spam, solicitations, or inappropriate content</li>
                <li>Uploaded files must not contain malware or malicious content</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                I reserve the right to ignore or delete submissions that violate these terms.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Third-Party Links</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                The Website may contain links to third-party websites (e.g., GitHub, LinkedIn). I have no
                control over, and assume no responsibility for, the content, privacy policies, or practices
                of any third-party sites. You access third-party links at your own risk.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Disclaimer of Warranties</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                THE WEBSITE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED. I DO NOT WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, SECURE,
                OR ERROR-FREE.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                I make no warranties or representations about the accuracy or completeness of the Website&apos;s
                content or the content of any sites linked to this Website.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                TO THE FULLEST EXTENT PERMITTED BY LAW, JESSE ELDRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
                INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mt-4">
                <li>Your access to or use of or inability to access or use the Website</li>
                <li>Any conduct or content of any third party on the Website</li>
                <li>Any content obtained from the Website</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                You agree to defend, indemnify, and hold harmless Jesse Eldridge from and against any claims,
                damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your
                use of and access to the Website, or your violation of these Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States,
                without regard to its conflict of law provisions. Any disputes arising from these Terms or use
                of the Website shall be resolved in the courts of competent jurisdiction.
              </p>
            </section>

            {/* Changes */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                I reserve the right to modify or replace these Terms at any time. Material changes will be
                indicated by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of
                the Website after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Severability */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Severability</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions
                will continue in full force and effect. The invalid or unenforceable provision will be modified
                to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            {/* Contact */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-4">Contact</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                If you have any questions about these Terms, please contact me:
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
            <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/terms" className="text-[var(--accent)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
