import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, Clock, DollarSign, Loader2, Send, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function HandymanEarnings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: earningsData, isLoading } = trpc.payments.getHandymanEarnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: profile } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const requestPayout = trpc.payments.requestPayout.useMutation({
    onSuccess: async () => {
      toast.success("Payout request submitted.");
      setPayoutAmount("");
      setPayoutNotes("");
      await utils.payments.getHandymanEarnings.invalidate();
    },
    onError: (err) => toast.error(err.message),
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

  useEffect(() => {
    if (user?.email && !payoutEmail) {
      setPayoutEmail(user.email);
    }
  }, [user?.email, payoutEmail]);

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
  const payoutRequests = earningsData?.payoutRequests ?? [];

  const completedEarnings = parseFloat(earningsData?.completedEarnings ?? "0");
  const availableBalance = parseFloat(earningsData?.availableBalance ?? "0");
  const pendingPayouts = parseFloat(earningsData?.pendingPayouts ?? "0");
  const paidPayouts = parseFloat(earningsData?.paidPayouts ?? "0");

  const handleRequestPayout = () => {
    const amount = Number.parseFloat(payoutAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payout amount.");
      return;
    }

    if (amount > availableBalance) {
      toast.error(`You only have $${availableBalance.toFixed(2)} available to request.`);
      return;
    }

    if (!payoutEmail.trim()) {
      toast.error("Enter your payout email.");
      return;
    }

    requestPayout.mutate({
      amount,
      payoutEmail: payoutEmail.trim(),
      notes: payoutNotes.trim() || undefined,
    });
  };

  const fillAvailableBalance = () => {
    setPayoutAmount(availableBalance.toFixed(2));
  };

  return (
    <AppLayout title="Earnings">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary text-sm mb-1">Weekly Manual Payouts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit payout requests before the end of day Friday to be included in Saturday
                payouts. Approved payouts are processed manually by SaskHandy using your payout
                email or the details you provide.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${availableBalance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">ready to request</p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${completedEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedPayments.length} completed jobs
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${pendingPayouts.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">requested payouts</p>
          </div>

          <div className="bg-white rounded-xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Paid Out</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${paidPayouts.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">manual payouts paid</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-foreground">Request Payout</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Request all or part of your available balance. Pending requests are deducted from your
              available balance so the same earnings cannot be requested twice.
            </p>
          </div>

          {availableBalance <= 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  You do not have any available balance to request right now. Completed job payouts
                  will appear here once the homeowner marks the job complete.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payoutAmount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="payoutAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      max={availableBalance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="pl-7"
                      placeholder={availableBalance.toFixed(2)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fillAvailableBalance}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Use full available balance
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payoutEmail">Payout Email</Label>
                  <Input
                    id="payoutEmail"
                    type="email"
                    value={payoutEmail}
                    onChange={(e) => setPayoutEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the email you want SaskHandy to contact or pay through.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutNotes">Notes / E-transfer Details</Label>
                <Textarea
                  id="payoutNotes"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Add any payout instructions, preferred contact details, or e-transfer notes..."
                />
              </div>

              <Button
                onClick={handleRequestPayout}
                disabled={requestPayout.isPending}
                className="w-full sm:w-auto"
              >
                {requestPayout.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Payout Request
              </Button>
            </>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <h3 className="font-semibold text-primary text-sm mb-2">How Earnings Work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For every job, you receive <strong className="text-foreground">80%</strong> of the
            agreed bid amount. The remaining 20% is SaskHandy&apos;s platform fee. After the
            homeowner marks the job complete, your earnings become available to request. Payouts are
            reviewed weekly and processed manually on Saturday.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-foreground">Payout Requests</h3>
          </div>

          {payoutRequests.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No payout requests yet. Request a payout once you have available earnings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {payoutRequests.map((request) => (
                <div key={request.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">
                        Payout Request #{request.id}
                      </p>
                      <StatusBadge status={request.status} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Requested {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Payout email: {request.payoutEmail}
                    </p>

                    {request.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notes: {request.notes}
                      </p>
                    )}

                    {request.adminNotes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Admin notes: {request.adminNotes}
                      </p>
                    )}

                    {request.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid {format(new Date(request.paidAt), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ${parseFloat(request.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{request.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-foreground">Completed Job Earnings</h3>
          </div>

          {completedPayments.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No completed job earnings yet. Complete jobs to start earning.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {completedPayments.map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">Job #{payment.jobId}</p>
                      <StatusBadge status={payment.status} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Completed {format(new Date(payment.updatedAt), "MMM d, yyyy")}
                    </p>
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