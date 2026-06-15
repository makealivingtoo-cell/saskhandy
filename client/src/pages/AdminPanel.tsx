import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  DollarSign,
  ExternalLink,
  FileCheck,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function parseCategories(categories?: string | null): string[] {
  if (!categories) return [];

  try {
    const parsed = JSON.parse(categories);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: disputes,
    isLoading: disputesLoading,
    refetch,
  } = trpc.disputes.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: users,
    refetch: refetchUsers,
  } = trpc.admin.getUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: jobs,
    refetch: refetchJobs,
    isLoading: jobsLoading,
  } = trpc.admin.getJobs.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: insuranceQueue,
    isLoading: insuranceLoading,
    refetch: refetchInsurance,
  } = trpc.admin.getInsuranceQueue.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: payoutRequests,
    isLoading: payoutRequestsLoading,
    refetch: refetchPayoutRequests,
  } = trpc.admin.getPayoutRequests.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: flaggedUsers,
    isLoading: flaggedLoading,
  } = trpc.admin.getFlaggedUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: reports,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = trpc.reports.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [payoutAdminNotes, setPayoutAdminNotes] = useState<Record<number, string>>({});
  const [reportAdminNotes, setReportAdminNotes] = useState<Record<number, string>>({});
  const [identityRejectReasons, setIdentityRejectReasons] = useState<Record<number, string>>({});
  const [criminalRejectReasons, setCriminalRejectReasons] = useState<Record<number, string>>({});
  const [tradeLicenseRejectReasons, setTradeLicenseRejectReasons] = useState<Record<number, string>>({});
  const [insuranceRejectReasons, setInsuranceRejectReasons] = useState<Record<number, string>>({});
  const [updatingPayoutId, setUpdatingPayoutId] = useState<number | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  const resolveDispute = trpc.disputes.resolve.useMutation({
    onSuccess: () => {
      toast.success("Dispute resolved.");
      setResolvingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const setInsuranceVerification = trpc.admin.setInsuranceVerification.useMutation({
    onSuccess: (_, variables) => {
      toast.success(
        variables.insuranceVerified ? "Insurance reviewed." : "Insurance review removed."
      );
      refetchInsurance();
    },
    onError: (err) => toast.error(err.message),
  });

  const setIdentityVerification = trpc.admin.setIdentityVerification.useMutation({
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "approved"
          ? "ID Name Matched approved."
          : variables.status === "rejected"
          ? "Identity verification rejected."
          : "Identity status updated."
      );
      refetchInsurance();
    },
    onError: (err) => toast.error(err.message),
  });

  const setCriminalRecordCheckStatus = trpc.admin.setCriminalRecordCheckStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "reviewed"
          ? "Criminal record check marked as reviewed."
          : "Criminal record check status updated."
      );
      refetchInsurance();
    },
    onError: (err) => toast.error(err.message),
  });

  const setTradeLicenseVerification = trpc.admin.setTradeLicenseVerification.useMutation({
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "approved"
          ? "Trade licence marked as verified."
          : "Trade licence status updated."
      );
      refetchInsurance();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateReportStatus = trpc.reports.updateStatus.useMutation({
    onSuccess: async (_, variables) => {
      toast.success(`Report marked ${variables.status}.`);
      setUpdatingReportId(null);
      await refetchReports();
    },
    onError: (err) => {
      toast.error(err.message);
      setUpdatingReportId(null);
    },
  });

  const updatePayoutRequestStatus = trpc.admin.updatePayoutRequestStatus.useMutation({
    onSuccess: async (_, variables) => {
      toast.success(
        variables.status === "paid" ? "Payout marked as paid." : "Payout request rejected."
      );
      setUpdatingPayoutId(null);
      await refetchPayoutRequests();
      await refetchStats();
    },
    onError: (err) => {
      toast.error(err.message);
      setUpdatingPayoutId(null);
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted.");
      setDeletingUserId(null);
      refetchUsers();
    },
    onError: (err) => {
      toast.error(err.message);
      setDeletingUserId(null);
    },
  });

  const deleteJob = trpc.admin.deleteJob.useMutation({
    onSuccess: async () => {
      toast.success("Job deleted.");
      setDeletingJobId(null);
      await refetchJobs();
      await refetchStats();
    },
    onError: (err) => {
      toast.error(err.message);
      setDeletingJobId(null);
    },
  });

  const allHandymen = useMemo(
    () => insuranceQueue?.filter((p) => p.userEmail || p.userName || p.categories || p.bio) ?? [],
    [insuranceQueue]
  );

  if (!user || user.role !== "admin") {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You do not have admin privileges.</p>
        </div>
      </AppLayout>
    );
  }

  const openDisputes = disputes?.filter((d) => d.status === "open") ?? [];
  const resolvedDisputes = disputes?.filter((d) => d.status !== "open") ?? [];

  const pendingInsurance =
    insuranceQueue?.filter((p) => p.insuranceCertUrl && !p.insuranceVerified) ?? [];

  const verifiedInsurance =
    insuranceQueue?.filter((p) => p.insuranceCertUrl && p.insuranceVerified) ?? [];

  const pendingPayoutRequests = payoutRequests?.filter((p) => p.status === "pending") ?? [];
  const resolvedPayoutRequests = payoutRequests?.filter((p) => p.status !== "pending") ?? [];

  const openReports = reports?.filter((report) => report.status === "open") ?? [];
  const resolvedReports = reports?.filter((report) => report.status !== "open") ?? [];

  const pendingIdentityReviews =
    insuranceQueue?.filter((p) => p.identityVerificationStatus === "pending") ?? [];

  const approvedIdentityReviews =
    insuranceQueue?.filter((p) => p.identityVerificationStatus === "approved") ?? [];

  const pendingCriminalChecks =
    insuranceQueue?.filter((p) => p.criminalRecordCheckStatus === "pending") ?? [];

  const reviewedCriminalChecks =
    insuranceQueue?.filter((p) => p.criminalRecordCheckStatus === "reviewed") ?? [];

  const pendingTradeLicenses =
    insuranceQueue?.filter((p) => p.tradeLicenseVerificationStatus === "pending") ?? [];

  const approvedTradeLicenses =
    insuranceQueue?.filter((p) => p.tradeLicenseVerificationStatus === "approved") ?? [];

  return (
    <AppLayout title="Admin Panel">
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {[
            {
              label: "Total Users",
              value: stats?.totalUsers ?? 0,
              icon: Users,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Homeowners",
              value: stats?.homeowners ?? 0,
              icon: Users,
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "Handymen",
              value: stats?.handymen ?? 0,
              icon: Briefcase,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Open Jobs",
              value: stats?.openJobs ?? 0,
              icon: Briefcase,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Open Disputes",
              value: stats?.openDisputes ?? 0,
              icon: AlertTriangle,
              color: "bg-red-50 text-red-600",
            },
            {
              label: "Open Reports",
              value: openReports.length,
              icon: Shield,
              color: "bg-orange-50 text-orange-600",
            },
            {
              label: "Payout Requests",
              value: stats?.pendingPayoutRequests ?? pendingPayoutRequests.length,
              icon: DollarSign,
              color: "bg-primary/10 text-primary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-border/60 p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}
              >
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Safety First admin note</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Use careful language: ID Name Matched, Criminal Record Check Reviewed, Insurance
                Reviewed, and Licence Verified. Avoid implying SaskHandy guarantees safety.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Safety Reports{" "}
              <span className="text-muted-foreground font-normal">({openReports.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchReports()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : openReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No open safety reports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-orange-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <p className="font-semibold text-foreground text-sm">
                          Report #{report.id}
                        </p>
                        <StatusBadge status={report.status} />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Reason: <span className="font-medium text-foreground">{report.reason}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reporter user #{report.reporterUserId}
                        {report.reportedUserId ? ` · Reported user #${report.reportedUserId}` : ""}
                        {report.jobId ? ` · Job #${report.jobId}` : ""}
                        {report.bidId ? ` · Bid #${report.bidId}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(report.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {report.jobId && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/jobs/${report.jobId}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Job
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {report.details && (
                    <div className="bg-orange-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-orange-800 mb-1">Details:</p>
                      <p className="text-sm text-orange-700">{report.details}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Textarea
                      placeholder="Admin notes about this report..."
                      value={reportAdminNotes[report.id] ?? ""}
                      onChange={(e) =>
                        setReportAdminNotes((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="resize-none"
                    />

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUpdatingReportId(report.id);
                          updateReportStatus.mutate({
                            reportId: report.id,
                            status: "reviewing",
                            adminNotes: reportAdminNotes[report.id] ?? "",
                          });
                        }}
                        disabled={updateReportStatus.isPending}
                      >
                        {updateReportStatus.isPending && updatingReportId === report.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Mark Reviewing
                      </Button>

                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setUpdatingReportId(report.id);
                          updateReportStatus.mutate({
                            reportId: report.id,
                            status: "resolved",
                            adminNotes: reportAdminNotes[report.id] ?? "",
                          });
                        }}
                        disabled={updateReportStatus.isPending}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Resolve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-muted-foreground/30"
                        onClick={() => {
                          setUpdatingReportId(report.id);
                          updateReportStatus.mutate({
                            reportId: report.id,
                            status: "dismissed",
                            adminNotes: reportAdminNotes[report.id] ?? "",
                          });
                        }}
                        disabled={updateReportStatus.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">
            Handymen Overview{" "}
            <span className="text-muted-foreground font-normal">({allHandymen.length})</span>
          </h2>

          {insuranceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : allHandymen.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No handyman profiles found yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allHandymen.map((profile) => {
                const categories = parseCategories(profile.categories);

                return (
                  <div
                    key={`overview-${profile.userId}`}
                    className="bg-white rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {profile.userName ?? "Unnamed handyman"}
                          </p>
                          {profile.identityVerificationStatus === "approved" &&
                            profile.criminalRecordCheckStatus === "reviewed" && (
                              <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                Gold Shield
                              </span>
                            )}

                          {profile.identityVerificationStatus === "approved" && (
                            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                              ID Name Matched
                            </span>
                          )}

                          {profile.criminalRecordCheckStatus === "reviewed" && (
                            <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                              Criminal Check Reviewed
                            </span>
                          )}

                          {profile.tradeLicenseVerificationStatus === "approved" && (
                            <span className="text-[11px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
                              Trade Licence Verified
                            </span>
                          )}

                          {profile.insuranceVerified && (
                            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
Insurance Reviewed
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile.userEmail ?? "No email"}
                        </p>

                        {profile.serviceArea && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Service area: {profile.serviceArea}</span>
                          </p>
                        )}

                        {(profile.externalGoogleReviewsUrl ||
                          profile.externalFacebookReviewsUrl ||
                          profile.externalWebsiteUrl) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="text-muted-foreground">External links:</span>

                            {profile.externalGoogleReviewsUrl && (
                              <a
                                href={profile.externalGoogleReviewsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Google <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {profile.externalFacebookReviewsUrl && (
                              <a
                                href={profile.externalFacebookReviewsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Facebook <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {profile.externalWebsiteUrl && (
                              <a
                                href={profile.externalWebsiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Website <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {profile.hourlyRate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Hourly Rate:{" "}
                            <span className="text-foreground font-medium">
                              ${profile.hourlyRate}/hr
                            </span>
                          </p>
                        )}

                        {categories.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <span
                                key={`${profile.userId}-${category}`}
                                className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {profile.bio && (
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            Bio: {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Payout Requests{" "}
              <span className="text-muted-foreground font-normal">
                ({pendingPayoutRequests.length})
              </span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchPayoutRequests()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {payoutRequestsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingPayoutRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending payout requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayoutRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border border-primary/20 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <p className="font-semibold text-foreground text-sm">
                          Payout Request #{request.id}
                        </p>
                        <StatusBadge status={request.status} />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Requested by {request.handymanName ?? "Unnamed handyman"} on{" "}
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Account email: {request.handymanEmail ?? "No email"}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Payout email: {request.payoutEmail}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        ${parseFloat(request.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">requested payout</p>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-foreground mb-1">
                        Handyman Notes / Details:
                      </p>
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Textarea
                      placeholder="Admin notes, payout reference, e-transfer confirmation, or rejection reason..."
                      value={payoutAdminNotes[request.id] ?? ""}
                      onChange={(e) =>
                        setPayoutAdminNotes((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="resize-none"
                    />

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Mark payout request #${request.id} as paid? Make sure the manual payment has already been sent.`
                          );

                          if (!confirmed) return;

                          setUpdatingPayoutId(request.id);
                          updatePayoutRequestStatus.mutate({
                            payoutRequestId: request.id,
                            status: "paid",
                            adminNotes: payoutAdminNotes[request.id] ?? "",
                          });
                        }}
                        disabled={updatePayoutRequestStatus.isPending}
                      >
                        {updatePayoutRequestStatus.isPending && updatingPayoutId === request.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Mark Paid
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const confirmed = window.confirm(`Reject payout request #${request.id}?`);

                          if (!confirmed) return;

                          setUpdatingPayoutId(request.id);
                          updatePayoutRequestStatus.mutate({
                            payoutRequestId: request.id,
                            status: "rejected",
                            adminNotes: payoutAdminNotes[request.id] ?? "",
                          });
                        }}
                        disabled={updatePayoutRequestStatus.isPending}
                      >
                        {updatePayoutRequestStatus.isPending && updatingPayoutId === request.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {resolvedPayoutRequests.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Past Payout Requests{" "}
              <span className="text-muted-foreground font-normal">
                ({resolvedPayoutRequests.length})
              </span>
            </h2>

            <div className="space-y-3">
              {resolvedPayoutRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground">
                          Payout Request #{request.id} — {request.handymanName ?? "Unnamed handyman"}
                        </p>
                        <StatusBadge status={request.status} />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Requested {format(new Date(request.createdAt), "MMM d, yyyy")}
                        {request.paidAt
                          ? ` · Paid ${format(new Date(request.paidAt), "MMM d, yyyy")}`
                          : ""}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Payout email: {request.payoutEmail}
                      </p>

                      {request.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-3 py-2">
                          {request.adminNotes}
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
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Identity Verification{" "}
              <span className="text-muted-foreground font-normal">({pendingIdentityReviews.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchInsurance()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {insuranceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingIdentityReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending identity reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingIdentityReviews.map((profile) => (
                <div key={`identity-${profile.userId}`} className="bg-white rounded-xl border border-blue-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <p className="font-semibold text-foreground text-sm">
                        {profile.userName ?? "Unnamed handyman"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.userEmail ?? "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {profile.identityVerificationStatus}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        placeholder="Reject reason, shown to handyman if rejected..."
                        value={identityRejectReasons[profile.userId] ?? ""}
                        onChange={(e) =>
                          setIdentityRejectReasons((prev) => ({
                            ...prev,
                            [profile.userId]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="resize-none min-w-[260px]"
                      />

                      <div className="flex gap-2 flex-wrap">
                        {profile.identityDocumentUrl && (
                        <Button asChild variant="outline" size="sm">
                          <a href={profile.identityDocumentUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View ID
                          </a>
                        </Button>
                      )}

                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() =>
                            setIdentityVerification.mutate({
                              userId: profile.userId,
                              status: "approved",
                            })
                          }
                          disabled={setIdentityVerification.isPending}
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                          Mark ID Name Matched
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={() =>
                            setIdentityVerification.mutate({
                              userId: profile.userId,
                              status: "rejected",
                              rejectionReason:
                                identityRejectReasons[profile.userId]?.trim() ||
                                "ID name did not match the profile, or the document was unclear.",
                            })
                          }
                          disabled={setIdentityVerification.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Reject ID
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approvedIdentityReviews.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                ID Name Matched ({approvedIdentityReviews.length})
              </h3>

              <div className="space-y-3">
                {approvedIdentityReviews.map((profile) => (
                  <div key={`identity-approved-${profile.userId}`} className="bg-white rounded-xl border border-blue-200 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {profile.userName ?? "Unnamed handyman"}
                        </p>
                        <p className="text-xs text-muted-foreground">{profile.userEmail ?? "No email"}</p>
                      </div>

                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                        ID Name Matched
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Criminal Record Checks{" "}
              <span className="text-muted-foreground font-normal">({pendingCriminalChecks.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchInsurance()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {insuranceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingCriminalChecks.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending criminal record checks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCriminalChecks.map((profile) => (
                <div key={`criminal-${profile.userId}`} className="bg-white rounded-xl border border-purple-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <p className="font-semibold text-foreground text-sm">
                        {profile.userName ?? "Unnamed handyman"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.userEmail ?? "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {profile.criminalRecordCheckStatus}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        placeholder="Reject reason, shown to handyman if rejected..."
                        value={criminalRejectReasons[profile.userId] ?? ""}
                        onChange={(e) =>
                          setCriminalRejectReasons((prev) => ({
                            ...prev,
                            [profile.userId]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="resize-none min-w-[260px]"
                      />

                      <div className="flex gap-2 flex-wrap">
                        {profile.criminalRecordCheckUrl && (
                        <Button asChild variant="outline" size="sm">
                          <a href={profile.criminalRecordCheckUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Check
                          </a>
                        </Button>
                      )}

                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() =>
                            setCriminalRecordCheckStatus.mutate({
                              userId: profile.userId,
                              status: "reviewed",
                            })
                          }
                          disabled={setCriminalRecordCheckStatus.isPending}
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                          Mark Reviewed
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={() =>
                            setCriminalRecordCheckStatus.mutate({
                              userId: profile.userId,
                              status: "rejected",
                              notes:
                                criminalRejectReasons[profile.userId]?.trim() ||
                                "Document was unclear, expired, or did not match the profile.",
                            })
                          }
                          disabled={setCriminalRecordCheckStatus.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Reject Check
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviewedCriminalChecks.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Criminal Checks Reviewed ({reviewedCriminalChecks.length})
              </h3>

              <div className="space-y-3">
                {reviewedCriminalChecks.map((profile) => (
                  <div key={`criminal-reviewed-${profile.userId}`} className="bg-white rounded-xl border border-purple-200 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {profile.userName ?? "Unnamed handyman"}
                        </p>
                        <p className="text-xs text-muted-foreground">{profile.userEmail ?? "No email"}</p>
                      </div>

                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                        Criminal Record Check Reviewed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Trade Licence Verification{" "}
              <span className="text-muted-foreground font-normal">({pendingTradeLicenses.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchInsurance()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {insuranceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingTradeLicenses.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending trade licence reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTradeLicenses.map((profile) => (
                <div key={`trade-license-${profile.userId}`} className="bg-white rounded-xl border border-sky-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <p className="font-semibold text-foreground text-sm">
                        {profile.userName ?? "Unnamed handyman"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.userEmail ?? "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Licence type: {profile.tradeLicenseType ?? "Not provided"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Licence #: {profile.tradeLicenseNumber ?? "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        placeholder="Reject reason, shown to handyman if rejected..."
                        value={tradeLicenseRejectReasons[profile.userId] ?? ""}
                        onChange={(e) =>
                          setTradeLicenseRejectReasons((prev) => ({
                            ...prev,
                            [profile.userId]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="resize-none min-w-[260px]"
                      />

                      <div className="flex gap-2 flex-wrap">
                        {profile.tradeLicenseDocumentUrl && (
                        <Button asChild variant="outline" size="sm">
                          <a href={profile.tradeLicenseDocumentUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View Licence
                          </a>
                        </Button>
                      )}

                        <Button
                          size="sm"
                          className="bg-sky-600 hover:bg-sky-700"
                          onClick={() =>
                            setTradeLicenseVerification.mutate({
                              userId: profile.userId,
                              status: "approved",
                            })
                          }
                          disabled={setTradeLicenseVerification.isPending}
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                          Mark Licence Verified
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={() =>
                            setTradeLicenseVerification.mutate({
                              userId: profile.userId,
                              status: "rejected",
                              rejectionReason:
                                tradeLicenseRejectReasons[profile.userId]?.trim() ||
                                "Licence document was unclear, expired, or did not match the profile.",
                            })
                          }
                          disabled={setTradeLicenseVerification.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Reject Licence
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approvedTradeLicenses.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Trade Licences Verified ({approvedTradeLicenses.length})
              </h3>

              <div className="space-y-3">
                {approvedTradeLicenses.map((profile) => (
                  <div key={`trade-license-approved-${profile.userId}`} className="bg-white rounded-xl border border-sky-200 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {profile.userName ?? "Unnamed handyman"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.userEmail ?? "No email"}
                          {profile.tradeLicenseType ? ` · ${profile.tradeLicenseType}` : ""}
                        </p>
                      </div>

                      <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
                        Trade Licence Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Insurance Review{" "}
              <span className="text-muted-foreground font-normal">({pendingInsurance.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchInsurance()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {insuranceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingInsurance.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending insurance reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInsurance.map((profile) => {
                const categories = parseCategories(profile.categories);

                return (
                  <div key={profile.userId} className="bg-white rounded-xl border border-border/60 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <p className="font-semibold text-foreground text-sm">
                          {profile.userName ?? "Unnamed handyman"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile.userEmail ?? "No email"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {format(new Date(profile.updatedAt), "MMM d, yyyy")}
                        </p>

                        {profile.hourlyRate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Hourly Rate:{" "}
                            <span className="text-foreground font-medium">
                              ${profile.hourlyRate}/hr
                            </span>
                          </p>
                        )}

                        {categories.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <span
                                key={`${profile.userId}-pending-${category}`}
                                className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {profile.bio && (
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            Bio: {profile.bio}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Reject reason, shown to handyman if rejected..."
                          value={insuranceRejectReasons[profile.userId] ?? ""}
                          onChange={(e) =>
                            setInsuranceRejectReasons((prev) => ({
                              ...prev,
                              [profile.userId]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="resize-none min-w-[260px]"
                        />

                        <div className="flex gap-2 flex-wrap">
                          {profile.insuranceCertUrl && (
                          <Button asChild variant="outline" size="sm">
                            <a href={profile.insuranceCertUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View File
                            </a>
                          </Button>
                        )}

                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() =>
                              setInsuranceVerification.mutate({
                                userId: profile.userId,
                                insuranceVerified: true,
                              })
                            }
                            disabled={setInsuranceVerification.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mark Reviewed
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/5"
                            onClick={() =>
                              setInsuranceVerification.mutate({
                                userId: profile.userId,
                                insuranceVerified: false,
                                rejectionReason:
                                  insuranceRejectReasons[profile.userId]?.trim() ||
                                  "Insurance document was unclear, expired, or did not match the profile.",
                              } as any)
                            }
                            disabled={setInsuranceVerification.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Reject Insurance
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {verifiedInsurance.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Reviewed Insurance{" "}
              <span className="text-muted-foreground font-normal">({verifiedInsurance.length})</span>
            </h2>

            <div className="space-y-3">
              {verifiedInsurance.map((profile) => {
                const categories = parseCategories(profile.categories);

                return (
                  <div key={profile.userId} className="bg-white rounded-xl border border-emerald-200 p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-sm font-medium text-foreground">
                          {profile.userName ?? "Unnamed handyman"}
                        </p>
                        <p className="text-xs text-muted-foreground">{profile.userEmail ?? "No email"}</p>

                        {profile.hourlyRate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Hourly Rate:{" "}
                            <span className="text-foreground font-medium">
                              ${profile.hourlyRate}/hr
                            </span>
                          </p>
                        )}

                        {categories.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <span
                                key={`${profile.userId}-verified-${category}`}
                                className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {profile.bio && (
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            Bio: {profile.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          Reviewed
                        </span>

                        {profile.insuranceCertUrl && (
                          <Button asChild variant="outline" size="sm">
                            <a href={profile.insuranceCertUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View File
                            </a>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={() =>
                            setInsuranceVerification.mutate({
                              userId: profile.userId,
                              insuranceVerified: false,
                            })
                          }
                          disabled={setInsuranceVerification.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {resolvedReports.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Past Safety Reports{" "}
              <span className="text-muted-foreground font-normal">({resolvedReports.length})</span>
            </h2>

            <div className="space-y-3">
              {resolvedReports.map((report) => (
                <div key={`past-report-${report.id}`} className="bg-white rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground">
                          Report #{report.id}
                        </p>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reason: {report.reason}
                        {report.jobId ? ` · Job #${report.jobId}` : ""}
                        {report.reportedUserId ? ` · Reported user #${report.reportedUserId}` : ""}
                      </p>
                      {report.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-3 py-2">
                          {report.adminNotes}
                        </p>
                      )}
                    </div>

                    {report.jobId && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`/jobs/${report.jobId}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View Job
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">
            Flagged Users{" "}
            <span className="text-muted-foreground font-normal">({flaggedUsers?.length ?? 0})</span>
          </h2>

          {flaggedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !flaggedUsers || flaggedUsers.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No flagged users right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedUsers.map((flagged) => (
                <div key={flagged.userId} className="bg-white rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {flagged.name ?? "Unnamed user"}
                      </p>
                      <p className="text-xs text-muted-foreground">{flagged.email ?? "No email"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {flagged.reasons.map((reason: string) => (
                          <span
                            key={reason}
                            className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Open Disputes{" "}
              <span className="text-muted-foreground font-normal">({openDisputes.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {disputesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : openDisputes.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No open disputes. All clear.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-xl border border-red-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="font-semibold text-foreground text-sm">
                          Dispute #{dispute.id} — {dispute.jobTitle ?? `Job #${dispute.jobId}`}
                        </p>
                        <StatusBadge status={dispute.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Opened by {dispute.initiatorName ?? "User"} on{" "}
                        {format(new Date(dispute.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-red-800 mb-1">Reason:</p>
                    <p className="text-sm text-red-700">{dispute.reason}</p>
                  </div>

                  {resolvingId === dispute.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Admin resolution notes (required)..."
                        value={adminNotes[dispute.id] ?? ""}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                        }
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() =>
                            resolveDispute.mutate({
                              disputeId: dispute.id,
                              resolution: "resolved_release",
                              adminNotes: adminNotes[dispute.id] ?? "",
                            })
                          }
                          disabled={!adminNotes[dispute.id] || resolveDispute.isPending}
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                          Release to Handyman
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            resolveDispute.mutate({
                              disputeId: dispute.id,
                              resolution: "resolved_refund",
                              adminNotes: adminNotes[dispute.id] ?? "",
                            })
                          }
                          disabled={!adminNotes[dispute.id] || resolveDispute.isPending}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Refund Homeowner
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setResolvingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setResolvingId(dispute.id)}>
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Resolve Dispute
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {resolvedDisputes.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Resolved Disputes{" "}
              <span className="text-muted-foreground font-normal">({resolvedDisputes.length})</span>
            </h2>
            <div className="space-y-3">
              {resolvedDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground">
                          Dispute #{dispute.id} — {dispute.jobTitle ?? `Job #${dispute.jobId}`}
                        </p>
                        <StatusBadge status={dispute.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Resolved on{" "}
                        {format(new Date(dispute.updatedAt ?? dispute.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {dispute.adminNotes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-3 py-2">
                      {dispute.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Jobs <span className="text-muted-foreground font-normal">({jobs?.length ?? 0})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchJobs()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-border/60 p-10 text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No jobs found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Homeowner
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Bids
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{job.title}</p>
                            <p className="text-xs text-muted-foreground">{job.location}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-foreground text-sm">{job.homeownerName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.homeownerEmail ?? "—"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{job.category}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(job.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium border ${
                                ((job as any).bidCount ?? 0) > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {(job as any).bidCount ?? 0} bid
                              {((job as any).bidCount ?? 0) === 1 ? "" : "s"}
                            </span>

                            {((job as any).pendingBidCount ?? 0) > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                {(job as any).pendingBidCount} pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button asChild size="sm" variant="outline">
                              <a href={`/jobs/${job.id}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                View
                              </a>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/5"
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Delete job "${job.title}"? This will permanently remove the job and related records.`
                                );

                                if (!confirmed) return;

                                setDeletingJobId(job.id);
                                deleteJob.mutate({ jobId: job.id });
                              }}
                              disabled={deleteJob.isPending}
                            >
                              {deleteJob.isPending && deletingJobId === job.id ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">
            Users <span className="text-muted-foreground font-normal">({users?.length ?? 0})</span>
          </h2>
          <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Last Login
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users?.map((u) => {
                    const isSelf = u.id === user.id;
                    const isAdminUser = u.role === "admin";

                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            {u.userType ?? "unset"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === "admin" ? (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              Admin
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">User</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {u.lastSignedIn
                            ? format(new Date(u.lastSignedIn), "MMM d, yyyy h:mm a")
                            : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              const confirmed = window.confirm(
                                `Delete ${u.name ?? u.email ?? "this user"}? This cannot be undone.`
                              );

                              if (!confirmed) return;

                              setDeletingUserId(u.id);
                              deleteUser.mutate({ userId: u.id });
                            }}
                            disabled={isSelf || isAdminUser || deleteUser.isPending}
                          >
                            {deleteUser.isPending && deletingUserId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}