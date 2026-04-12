import { AppLayout } from "@/components/AppLayout";

export default function PrivacyPage() {
  return (
    <AppLayout title="Privacy Policy">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated: April 11, 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may collect information such as your name, email address, account details, job posts,
              bid content, support messages, chat messages, and payment-related records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use personal information to operate the platform, create and manage accounts, process
              payments, provide support, help resolve disputes, improve services, and maintain platform
              safety and integrity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Sharing of Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may share information with payment processors, service providers, legal authorities
              where required, and other users only to the extent needed for platform operation,
              payment handling, dispute resolution, or legal compliance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. User Communications</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Messages, support tickets, and job-related communications may be stored and reviewed for
              safety, fraud prevention, support, and dispute handling.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We take reasonable administrative and technical measures to protect your information,
              but no method of storage or transmission is completely secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Your Choices</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You may request account updates, support, or other privacy-related assistance through
              the platform support process. Some data may need to be retained for payment, dispute,
              legal, fraud-prevention, or recordkeeping purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Cookies and Technical Data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SaskHandy may use cookies, session tokens, and technical logs to keep you signed in,
              secure the platform, and understand platform usage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy questions or requests, please contact SaskHandy using the support tools
              provided on the platform.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}