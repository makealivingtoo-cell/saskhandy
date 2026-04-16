import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, DollarSign, Loader2, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HandymanEarnings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: earningsData, isLoading } = trpc.payments.getHandymanEarnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: profile } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "handyman" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading || isLoading) {
    return (
      <AppLayout title="Earnings">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const completedPayments = earningsData?.payments.filter((p) => p.status === "completed") ?? [];
  const totalEarned = parseFloat(earningsData?.totalEarnings ?? "0");
  const stripeReady = !!profile?.stripePayoutsEnabled && !!profile?.stripeDetailsSubmitted;

  return (
    <AppLayout title="Earnings">
      <div className="max-w-3xl mx-auto space-y-6">
        {!stripeReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 text-sm mb-1">
                  Connect Stripe to receive payouts
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  You can complete jobs, but automatic payouts cannot be sent until your Stripe
                  payout account is connected and approved. Go to your profile to complete Stripe
                  onboarding.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedPayments.length} completed jobs
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground">Completed Jobs</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.totalJobs ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">completed jobs</p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Average per Job</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              $
              {completedPayments.length > 0
                ? (totalEarned / completedPayments.length).toFixed(2)
                : "0.00"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">completed work only</p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h3 className="font-semibold text-primary text-sm mb-2">How Earnings Work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For every job, you receive <strong className="text-foreground">80%</strong> of the
            agreed bid amount. The remaining 20% is SaskHandy&apos;s platform fee. After the
            homeowner marks the job complete, SaskHandy sends your payout through your connected
            Stripe account.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-foreground">Payment History</h3>
          </div>

          {!earningsData?.payments || earningsData.payments.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No payments yet. Complete jobs to start earning.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {earningsData.payments.map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">Job #{payment.jobId}</p>
                      <StatusBadge status={payment.status} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </p>

                    {payment.stripeTransferStatus && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Transfer status: {payment.stripeTransferStatus}
                      </p>
                    )}

                    {payment.stripeTransferId && (
                      <p className="text-[11px] text-muted-foreground mt-1 break-all">
                        Stripe transfer: {payment.stripeTransferId}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ${parseFloat(payment.handymanPayout).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of ${parseFloat(payment.amount).toFixed(2)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}