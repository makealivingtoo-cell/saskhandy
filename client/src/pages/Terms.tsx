import { Button } from "@/components/ui/button";
import { ChevronRight, Hammer } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "overview", title: "Overview" },
  { id: "business", title: "Business Information" },
  { id: "definitions", title: "Definitions" },
  { id: "platform", title: "The Platform" },
  { id: "eligibility", title: "Eligibility and Accounts" },
  { id: "verification", title: "Verification and Trust Signals" },
  { id: "fees", title: "Fees and Payments" },
  { id: "sales", title: "Internet Sales Disclosures" },
  { id: "cancellation", title: "Cancellation and Refunds" },
  { id: "services", title: "Services and Tasks" },
  { id: "conduct", title: "User Conduct" },
  { id: "risk", title: "Assumption of Risk" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "dispute", title: "Dispute Resolution" },
  { id: "termination", title: "Termination" },
  { id: "privacy", title: "Privacy" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact Information" },
];

export default function TermsPage() {
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
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
              <p className="text-muted-foreground mb-4">Last updated: May 16, 2026</p>

              <div className="space-y-4 text-foreground">
                <p>
                  These Terms and Conditions (“Terms”) form a legally binding agreement between you
                  and SaskHandy regarding your access to and use of the SaskHandy website,
                  applications, messaging tools, payment flow, document upload features, support
                  tools, and related services (collectively, the “Platform”).
                </p>
                <p>
                  By creating an account, accessing, browsing, posting a job, sending a bid,
                  accepting a bid, paying through the Platform, uploading documents, or otherwise
                  using the Platform, you confirm that you have read, understood, and agree to be
                  bound by these Terms and our Privacy Policy. If you do not agree, you must not use
                  the Platform.
                </p>
                <p>
                  SaskHandy is intended for users in Saskatchewan, Canada. These Terms are written
                  for a Saskatchewan marketplace and should be reviewed by a qualified lawyer before
                  relying on them as legal advice.
                </p>
              </div>
            </section>

            <section id="business" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Business Information</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  SaskHandy is the marketplace operator. Before completing a paid transaction, users
                  should be shown the applicable job description, accepted bid amount, currency,
                  payment terms, platform fees if applicable, cancellation/refund information, and
                  contact information.
                </p>

                <div className="bg-muted p-6 rounded-lg space-y-2">
                  <p className="font-semibold">SaskHandy</p>
                  <p className="text-muted-foreground">Legal/business name: [add legal business name]</p>
                  <p className="text-muted-foreground">Mailing address: [add mailing address]</p>
                  <p className="text-muted-foreground">Business email: info@saskhandy.com</p>
                  <p className="text-muted-foreground">Phone: [add business phone, if available]</p>
                  <p className="text-muted-foreground">Jurisdiction: Saskatchewan, Canada</p>
                </div>
              </div>
            </section>

            <section id="definitions" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Definitions</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <p className="font-semibold mb-2">“Client” or “Homeowner”</p>
                  <p className="text-muted-foreground">
                    A person or business using the Platform to request, post, review, accept, or pay
                    for services.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">“Handyman” or “Service Provider”</p>
                  <p className="text-muted-foreground">
                    An independent contractor, individual, or business offering services through the
                    Platform.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">“Task” or “Job”</p>
                  <p className="text-muted-foreground">
                    Any service request, project, repair, installation, maintenance task, or
                    home-related work posted, bid on, accepted, paid for, or completed through the
                    Platform.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">“Platform”</p>
                  <p className="text-muted-foreground">
                    The SaskHandy site, user accounts, job posting tools, communications, support
                    tools, trust signals, payment flow, and related software and services.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">“Platform Fee”</p>
                  <p className="text-muted-foreground">
                    Any fee charged by SaskHandy for use of the Platform, payment facilitation,
                    dispute handling, marketplace access, or related services.
                  </p>
                </div>
              </div>
            </section>

            <section id="platform" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">The Platform</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Marketplace Role Only</h3>
                  <p className="text-muted-foreground">
                    SaskHandy is a technology platform and marketplace. We connect Homeowners and
                    Handymen, provide job-posting and communication tools, show certain profile and
                    trust-signal information, and may facilitate payment handling. SaskHandy does
                    not itself perform home services.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. No Employment Relationship</h3>
                  <p className="text-muted-foreground">
                    Handymen are independent contractors and not employees, workers, agents, joint
                    venturers, or partners of SaskHandy. SaskHandy does not supervise, direct, or
                    control how a Handyman performs any Job.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. No Guarantee of Quality or Suitability</h3>
                  <p className="text-muted-foreground">
                    SaskHandy does not guarantee the quality, legality, safety, timeliness,
                    licensing status, insurance status, suitability, availability, or outcome of any
                    User, Job, service, message, quote, bid, or result.
                  </p>
                </div>
              </div>
            </section>

            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Eligibility and Accounts</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Minimum Age</h3>
                  <p className="text-muted-foreground">
                    You must be at least 18 years old and legally capable of entering into a binding
                    agreement to use the Platform.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Accurate Information</h3>
                  <p className="text-muted-foreground">
                    You must provide accurate, current, and complete account, job, profile,
                    verification, payment, and support information and keep it updated.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Account Security</h3>
                  <p className="text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your login
                    credentials and for all activity that occurs under your account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Account Deletion</h3>
                  <p className="text-muted-foreground">
                    Users may request or initiate account deletion where available. SaskHandy may
                    block or delay deletion where there are open jobs, pending bids, accepted bids,
                    jobs awaiting payment, jobs in progress, disputes, pending payouts, unpaid
                    balances, fraud concerns, legal obligations, or records that must be retained.
                    SaskHandy may anonymize account information while retaining transaction, safety,
                    support, payment, and legal records as described in the Privacy Policy.
                  </p>
                </div>
              </div>
            </section>

            <section id="verification" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Verification and Trust Signals</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. ID Name Matched</h3>
                  <p className="text-muted-foreground">
                    ID Name Matched means SaskHandy has reviewed identification submitted by a
                    Handyman and checked whether the name on the document matches the name on the
                    Handyman’s profile. SaskHandy may require ID Name Matched before a Handyman can
                    send bids. ID Name Matched is a trust signal only and is not a guarantee of
                    safety, quality, reliability, or future conduct.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Gold Shield</h3>
                  <p className="text-muted-foreground">
                    Gold Shield means a Handyman has ID Name Matched and Criminal Record Check
                    Reviewed status. Criminal Record Check Reviewed means a document was submitted
                    and reviewed by SaskHandy admin. Gold Shield is a trust signal only and is not a
                    guarantee of safety, quality, reliability, legal compliance, or future conduct.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Insurance Reviewed and Licence Verified</h3>
                  <p className="text-muted-foreground">
                    Insurance Reviewed or Licence Verified means a document was submitted and
                    reviewed for platform trust-signal purposes. SaskHandy does not guarantee that
                    coverage or licensing is active, sufficient, valid for a specific job, or
                    enforceable. Homeowners remain responsible for deciding whether a Handyman is
                    appropriate for the job.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Name Changes After Verification</h3>
                  <p className="text-muted-foreground">
                    A Handyman’s profile name may be restricted after ID Name Matched approval to
                    preserve the meaning of the trust signal. Legal name correction requests may
                    require support review and additional documentation.
                  </p>
                </div>
              </div>
            </section>

            <section id="fees" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Fees and Payments</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Currency</h3>
                  <p className="text-muted-foreground">
                    Unless otherwise stated, all prices, bids, fees, refunds, and payouts shown on
                    the Platform are in Canadian dollars (CAD).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Platform Fees</h3>
                  <p className="text-muted-foreground">
                    SaskHandy may charge fees to Homeowners, Handymen, or both for use of the
                    Platform, payment processing, held-payment handling, dispute handling, or other
                    marketplace features. Any applicable fees should be shown before payment or
                    deducted from the Handyman payout where applicable.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Payment Facilitation</h3>
                  <p className="text-muted-foreground">
                    SaskHandy may use third-party payment processors to collect, hold, release,
                    refund, or route payments. By using the Platform, you authorize these payment
                    flows as applicable and agree to the payment processor’s applicable terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Held Payment and Release</h3>
                  <p className="text-muted-foreground">
                    Where held-payment handling is offered, funds may be collected when a Homeowner
                    accepts a bid and released after completion, dispute resolution, cancellation,
                    refund determination, or other status event. SaskHandy may act on the basis of
                    Platform records, payment records, messages, support tickets, and dispute
                    materials.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">E. No Circumvention</h3>
                  <p className="text-muted-foreground">
                    Users may not use the Platform to find each other and then move the transaction
                    off-platform to avoid fees, controls, payment flows, reviews, safety records, or
                    platform rules.
                  </p>
                </div>
              </div>
            </section>

            <section id="sales" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Internet Sales Disclosures</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  Before a Homeowner completes a paid transaction, SaskHandy should display or make
                  available the material terms of the transaction, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>the identity and contact information for SaskHandy;</li>
                  <li>the job title, description, location, and accepted bid details;</li>
                  <li>the Handyman’s available profile information and applicable trust signals;</li>
                  <li>the total price, currency, taxes if applicable, platform fees if applicable, and any additional charges shown through the Platform;</li>
                  <li>payment timing and held-payment release rules;</li>
                  <li>cancellation, refund, and dispute process information;</li>
                  <li>the date or expected timing of the service where provided by the parties.</li>
                </ul>
              </div>
            </section>

            <section id="cancellation" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Cancellation and Refunds</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Open Jobs</h3>
                  <p className="text-muted-foreground">
                    A Homeowner may cancel an open job before accepting a bid, subject to Platform
                    functionality and any applicable records retained by SaskHandy.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. After Bid Acceptance</h3>
                  <p className="text-muted-foreground">
                    After a bid is accepted, cancellation may be limited because payment, scheduling,
                    materials, and Handyman availability may already be affected. SaskHandy may
                    require users to use the support or dispute process before releasing, refunding,
                    or holding funds.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Refunds</h3>
                  <p className="text-muted-foreground">
                    Refunds are not automatic. Refund decisions may depend on payment processor
                    rules, job status, evidence from messages and support tickets, work performed,
                    cancellation timing, dispute outcome, and applicable law.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Saskatchewan Consumer Rights</h3>
                  <p className="text-muted-foreground">
                    Nothing in these Terms limits mandatory consumer rights that cannot be waived
                    under Saskatchewan or Canadian law. If applicable law gives you a cancellation or
                    refund right that cannot be excluded, that right continues to apply.
                  </p>
                </div>
              </div>
            </section>

            <section id="services" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Services and Tasks</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Task Descriptions</h3>
                  <p className="text-muted-foreground">
                    Homeowners are responsible for accurately describing the Job, worksite
                    conditions, risks, timing, materials, access conditions, pets, occupants,
                    parking, photos, and any legal or technical requirements.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Handyman Responsibility</h3>
                  <p className="text-muted-foreground">
                    Handymen are solely responsible for deciding whether they are qualified,
                    licensed, insured, experienced, equipped, and legally allowed to perform a Job.
                    SaskHandy does not verify that any User is legally authorized to perform
                    regulated work unless explicitly stated.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Regulated Work</h3>
                  <p className="text-muted-foreground">
                    Users must not use the Platform for illegal work or for regulated work that
                    requires licensing, certification, permits, inspections, or compliance unless
                    the Handyman is properly qualified and legally authorized to perform that work.
                  </p>
                </div>
              </div>
            </section>

            <section id="conduct" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">User Conduct</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>post false, misleading, fraudulent, or deceptive information;</li>
                  <li>harass, threaten, exploit, discriminate against, or abuse other users;</li>
                  <li>request or perform illegal, unsafe, or prohibited services;</li>
                  <li>misrepresent your identity, business, qualifications, insurance, licence, or criminal record check status;</li>
                  <li>attempt to bypass platform messages, support, payment flow, or fees;</li>
                  <li>share restricted contact details or off-platform payment instructions where prohibited by SaskHandy;</li>
                  <li>upload malware, scrape data, abuse APIs, or interfere with platform operations;</li>
                  <li>use the Platform in a way that creates legal, reputational, payment, or safety risk.</li>
                </ul>
              </div>
            </section>

            <section id="risk" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Assumption of Risk</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  By using the Platform, you understand that home services may involve physical
                  risk, property damage risk, financial loss risk, delays, poor workmanship, fraud,
                  disputes, and third-party misconduct. You are responsible for using judgment,
                  reviewing profiles, messaging before choosing, checking whether a job requires a
                  licensed or insured professional, and taking reasonable safety precautions.
                </p>
              </div>
            </section>

            <section id="liability" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Platform Provided “As Is”</h3>
                  <p className="text-muted-foreground">
                    The Platform is provided on an “as is” and “as available” basis without
                    warranties of any kind, whether express, implied, statutory, or otherwise.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. Excluded Damages</h3>
                  <p className="text-muted-foreground">
                    To the maximum extent permitted by law, SaskHandy will not be liable for
                    indirect, incidental, special, consequential, exemplary, punitive, or
                    loss-of-profit damages, or for property damage, personal injury, business
                    interruption, data loss, poor workmanship, failed services, or user misconduct
                    arising out of or related to Platform use.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. Maximum Liability Cap</h3>
                  <p className="text-muted-foreground">
                    To the fullest extent permitted by law, SaskHandy’s total aggregate liability
                    arising from or related to the Platform will not exceed the greater of: (i) the
                    platform fees paid to SaskHandy by you in the three months before the event
                    giving rise to the claim, or (ii) CAD $100.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Mandatory Rights</h3>
                  <p className="text-muted-foreground">
                    Some jurisdictions do not allow certain limitations or exclusions. In those
                    cases, SaskHandy’s liability is limited to the maximum extent permitted by law.
                  </p>
                </div>
              </div>
            </section>

            <section id="indemnity" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Indemnity</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  You agree to defend, indemnify, and hold harmless SaskHandy and its affiliates,
                  officers, directors, contractors, and representatives from and against claims,
                  liabilities, damages, losses, costs, and expenses arising out of or related to:
                  your Platform use, your Jobs, your services, your content, your conduct, your
                  violation of these Terms, your violation of any law, your off-platform
                  transactions, or your violation of any third-party rights.
                </p>
              </div>
            </section>

            <section id="dispute" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
              <div className="space-y-4 text-foreground">
                <div>
                  <h3 className="font-semibold mb-2">A. Platform Support First</h3>
                  <p className="text-muted-foreground">
                    Users agree to first attempt to resolve issues through the Platform’s support and
                    dispute process.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">B. SaskHandy Discretion</h3>
                  <p className="text-muted-foreground">
                    SaskHandy may review messages, timestamps, uploaded materials, payment records,
                    support tickets, job data, and other available evidence when handling disputes.
                    SaskHandy may decide to release funds, hold funds longer, refund, request more
                    evidence, restrict accounts, or take no action where evidence is insufficient.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">C. No Legal Representation</h3>
                  <p className="text-muted-foreground">
                    SaskHandy’s support or dispute process is not legal advice, arbitration, court,
                    or professional inspection. Users remain responsible for protecting their own
                    legal rights.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">D. Governing Law</h3>
                  <p className="text-muted-foreground">
                    These Terms are governed by the laws of Saskatchewan and the laws of Canada
                    applicable there, without regard to conflict of law principles.
                  </p>
                </div>
              </div>
            </section>

            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Termination</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  SaskHandy may suspend, restrict, or terminate any account or access at any time,
                  with or without notice, where reasonably necessary for fraud prevention, safety,
                  payment risk, abuse, repeated disputes, policy violations, legal exposure,
                  non-payment, off-platform transaction attempts, or platform integrity.
                </p>
              </div>
            </section>

            <section id="privacy" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Privacy</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  SaskHandy’s collection, use, storage, disclosure, and retention of personal
                  information is described in the Privacy Policy. By using the Platform, you
                  acknowledge that you have read and understood the Privacy Policy.
                </p>
              </div>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  SaskHandy may update these Terms from time to time. Updated Terms become
                  effective when posted unless a later date is stated. Continued use of the Platform
                  after an update means you accept the revised Terms.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4 text-foreground">
                <p className="text-muted-foreground">
                  For legal or Terms-related questions, use the support tools available on the
                  Platform or contact SaskHandy using the information below.
                </p>

                <div className="bg-muted p-6 rounded-lg space-y-2">
                  <p className="font-semibold">SaskHandy</p>
                  <p className="text-muted-foreground">Legal/business name: SaskHandy</p>
                  <p className="text-muted-foreground">Saskatchewan, Canada</p>
                  <p className="text-muted-foreground">Business email: info@saskhandy.com</p>
                  <p className="text-muted-foreground">Mailing address: Saskatoon, SK</p>
                  <p className="text-muted-foreground">Support available through the platform support center</p>
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-8 mt-12">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-muted-foreground">Last updated: May 16, 2026</p>
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
