import { Button } from "@/components/ui/button";
import { ChevronRight, Hammer } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "overview", title: "Overview" },
  { id: "collection", title: "Information We Collect" },
  { id: "use", title: "How We Use Information" },
  { id: "sharing", title: "How We Share Information" },
  { id: "communications", title: "Messages and Support" },
  { id: "payments", title: "Payments and Processors" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "choices", title: "Your Choices and Rights" },
  { id: "cookies", title: "Cookies and Technical Data" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this Policy" },
  { id: "contact", title: "Contact Information" },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hammer className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">SaskHandy</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </a>
          </nav>
        </div>
      </header>

      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">Contents</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="md:col-span-3 space-y-12">
            <section id="overview" className="scroll-mt-24">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground mb-4">Last updated: April 11, 2026</p>

              <div className="space-y-4 text-foreground">
                <p>
                  This Privacy Policy explains how SaskHandy collects, uses, stores, shares, and
                  otherwise processes personal information when you access or use the SaskHandy
                  website, applications, support tools, messaging features, payment-related
                  features, and related services (collectively, the “Platform”).
                </p>
                <p>
                  By creating an account or using the Platform, you acknowledge that you have read
                  and understood this Privacy Policy. If you do not agree, you should not use the
                  Platform.
                </p>
              </div>
            </section>

            <section id="collection" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Information You Provide</h3>
                  <p className="text-muted-foreground">
                    We may collect information you provide directly, including your name, email
                    address, account credentials, profile details, job posts, bid details, support
                    requests, messages, uploaded files, insurance-related documents, reviews, and
                    dispute submissions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Transaction and Payment Information</h3>
                  <p className="text-muted-foreground">
                    We may collect payment-related metadata, transaction status, payout details,
                    refund status, escrow status, and processor identifiers. Full card details are
                    typically handled by third-party payment processors rather than stored directly
                    by SaskHandy.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Technical and Usage Information</h3>
                  <p className="text-muted-foreground">
                    We may automatically collect technical information such as IP address, browser
                    type, device information, operating system, page views, timestamps, login
                    events, session identifiers, and diagnostic or error logs.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Communications and Content</h3>
                  <p className="text-muted-foreground">
                    We may collect the content of messages, support tickets, reviews, and other
                    communications sent through the Platform, along with related timestamps and
                    account identifiers.
                  </p>
                </div>
              </div>
            </section>

            <section id="use" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">How We Use Information</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">We may use personal information to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>create and manage accounts;</li>
                  <li>operate and improve the Platform;</li>
                  <li>match homeowners and handymen;</li>
                  <li>facilitate job posts, bids, messaging, and support;</li>
                  <li>process and administer payments, payouts, refunds, and disputes;</li>
                  <li>review uploaded documents and verification-related information;</li>
                  <li>detect, investigate, prevent, or respond to fraud, abuse, or safety issues;</li>
                  <li>enforce our Terms, policies, and platform rules;</li>
                  <li>comply with legal obligations and protect legal rights;</li>
                  <li>send operational, transactional, security, and service-related communications.</li>
                </ul>
              </div>
            </section>

            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">How We Share Information</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. With Other Users</h3>
                  <p className="text-muted-foreground">
                    Certain information may be shared with other users where necessary for
                    marketplace functionality, such as profile information, job details, bid
                    content, reviews, ratings, and communications relevant to a Task.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. With Service Providers</h3>
                  <p className="text-muted-foreground">
                    We may share information with vendors and service providers that help us operate
                    the Platform, including hosting, analytics, support tooling, document storage,
                    authentication, and payment processing providers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. For Legal and Safety Reasons</h3>
                  <p className="text-muted-foreground">
                    We may disclose information where reasonably necessary to comply with law,
                    respond to legal process, investigate fraud, enforce our agreements, or protect
                    the rights, property, safety, or security of SaskHandy, users, or the public.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Business Transfers</h3>
                  <p className="text-muted-foreground">
                    If SaskHandy is involved in a merger, acquisition, financing, restructuring,
                    sale of assets, or similar transaction, personal information may be disclosed as
                    part of that process, subject to applicable law.
                  </p>
                </div>
              </div>
            </section>

            <section id="communications" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Messages and Support</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  Messages, support tickets, dispute submissions, and related communications may be
                  stored, reviewed, and used for customer support, fraud prevention, quality
                  control, account review, payment handling, dispute resolution, legal compliance,
                  and platform safety.
                </p>
              </div>
            </section>

            <section id="payments" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Payments and Processors</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  Payment functionality may be provided by third-party processors. Those processors
                  may collect, store, and process personal and financial information under their own
                  terms and privacy policies. SaskHandy may receive transaction confirmations,
                  status updates, customer identifiers, refund information, and payout-related data
                  from those providers.
                </p>
              </div>
            </section>

            <section id="retention" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  We retain personal information for as long as reasonably necessary to operate the
                  Platform, provide services, maintain business records, resolve disputes, enforce
                  our agreements, prevent fraud, comply with legal obligations, and protect our
                  rights. Retention periods may vary depending on the type of information and the
                  purpose for which it was collected.
                </p>
              </div>
            </section>

            <section id="security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Security</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  We use reasonable administrative, technical, and organizational safeguards to help
                  protect personal information. However, no method of transmission, storage, or
                  system security is completely guaranteed, and we cannot promise absolute security.
                </p>
              </div>
            </section>

            <section id="choices" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Your Choices and Rights</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  Depending on applicable law, you may have rights relating to access, correction,
                  deletion, withdrawal of optional consent, or other privacy-related requests. Some
                  information may still be retained where necessary for legal compliance, fraud
                  prevention, transaction records, active disputes, account security, or legitimate
                  business purposes.
                </p>
              </div>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Cookies and Technical Data</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  SaskHandy may use cookies, session tokens, local storage, and similar technical
                  tools to authenticate users, maintain sessions, remember preferences, improve user
                  experience, secure the Platform, and understand usage patterns.
                </p>
              </div>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Children</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  The Platform is not intended for individuals under 18. We do not knowingly collect
                  personal information from children for account use of the Platform.
                </p>
              </div>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Changes to this Policy</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. The updated version becomes
                  effective when posted unless a later date is stated. Continued use of the Platform
                  after an update means you acknowledge the revised Policy.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  For privacy-related questions or requests, use the support tools available on the
                  Platform.
                </p>

                <div className="bg-muted p-6 rounded-lg space-y-2">
                  <p className="font-semibold">SaskHandy</p>
                  <p className="text-muted-foreground">Saskatchewan, Canada</p>
                  <p className="text-muted-foreground">
                    Privacy requests available through the platform support center
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-8 mt-12">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-muted-foreground">Last updated: April 11, 2026</p>
                <Button asChild variant="outline">
                  <a href="/">
                    Back to Home
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}