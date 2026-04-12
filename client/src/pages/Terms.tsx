import { AppLayout } from "@/components/AppLayout";

export default function TermsPage() {
  return (
    <AppLayout title="Terms and Conditions">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated: April 11, 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. About SaskHandy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SaskHandy is a marketplace that connects homeowners with independent handymen and
              service providers. SaskHandy is not the employer of handymen and does not directly
              perform the services listed on the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You must provide accurate account information and keep your login credentials secure.
              You are responsible for activities that occur under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Homeowner Responsibilities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Homeowners are responsible for providing accurate job descriptions, confirming payment,
              and reviewing the qualifications of any handyman they choose to hire through the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Handyman Responsibilities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Handymen are solely responsible for ensuring they are legally permitted, properly
              licensed, insured, and qualified to perform any services they offer. Handymen must not
              accept work they are not legally or professionally qualified to complete.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Payments and Escrow</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Payments may be collected through the platform and held until a job is marked complete
              or otherwise resolved. Platform fees may apply. Refunds, disputes, and releases may be
              handled according to SaskHandy’s dispute process.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Disputes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If a job results in a dispute, SaskHandy may review messages, payment records, and
              other platform activity to help resolve the issue. SaskHandy may release funds, refund
              payments, or take other reasonable actions under platform rules.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Platform Role and Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SaskHandy acts as an intermediary platform. Except where required by law, SaskHandy
              does not guarantee the quality, legality, safety, or suitability of any service provider
              or job posting. Users are responsible for their own decisions and arrangements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Prohibited Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users must not use SaskHandy for illegal work, fraudulent conduct, unlicensed regulated
              work, harassment, unsafe activity, or misuse of payment systems or personal information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Suspension or Removal</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SaskHandy may suspend, restrict, or remove accounts for suspected fraud, abuse, repeated
              disputes, policy violations, or legal risk.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For legal, privacy, or support questions, please use the platform support tools or the
              contact details published by SaskHandy.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}