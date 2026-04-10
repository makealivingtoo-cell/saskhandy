import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";

export default function HandymanEarnings() {
  const { user, isAuthenticated } = useAuth();
  const { data: earningsData, isLoading } = trpc.payments.getHandymanEarnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: profile } = trpc.handymanProfiles.get.useQuery(undefined, { enabled: isAuthenticated });

  const completedPayments = earningsData?.payments.filter((p) => p.status === "completed") ?? [];
  const pendingPayments = earningsData?.payments.filter((p) => p.status === "pending") ?? [];

  if (isLoading) {
    return (
      <AppLayout title="Earnings">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const totalEarned = parseFloat(earningsData?.totalEarnings ?? "0");
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseFloat(p.handymanPayout), 0);

  return (
    <AppLayout title="Earnings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{completedPayments.length} completed jobs</p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground">Pending Release</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${pendingAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingPayments.length} jobs in progress</p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.totalJobs ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">completed jobs</p>
          </div>
        </div>

        {/* Fee Explanation */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h3 className="font-semibold text-primary text-sm mb-2">How Earnings Work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For every job, you receive <strong className="text-foreground">80%</strong> of the agreed bid amount.
            The remaining 20% is SaskHandy's platform fee. Payments are held in escrow and released to you
            once the homeowner confirms the job is complete.
          </p>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-foreground">Payment History</h3>
          </div>

          {!earningsData?.payments || earningsData.payments.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No payments yet. Complete jobs to start earning.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {earningsData.payments.map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">Job #{payment.jobId}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${parseFloat(payment.handymanPayout).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">of ${parseFloat(payment.amount).toFixed(2)} total</p>
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
