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
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
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
    data: insuranceQueue,
    isLoading: insuranceLoading,
    refetch: refetchInsurance,
  } = trpc.admin.getInsuranceQueue.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const {
    data: flaggedUsers,
    isLoading: flaggedLoading,
  } = trpc.admin.getFlaggedUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

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
        variables.insuranceVerified ? "Insurance approved." : "Insurance verification removed."
      );
      refetchInsurance();
    },
    onError: (err) => toast.error(err.message),
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

  return (
    <AppLayout title="Admin Panel">
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-blue-50 text-blue-600" },
            { label: "Homeowners", value: stats?.homeowners ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
            { label: "Handymen", value: stats?.handymen ?? 0, icon: Briefcase, color: "bg-amber-50 text-amber-600" },
            { label: "Open Jobs", value: stats?.openJobs ?? 0, icon: Briefcase, color: "bg-emerald-50 text-emerald-600" },
            { label: "Open Disputes", value: stats?.openDisputes ?? 0, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border/60 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Insurance Review <span className="text-muted-foreground font-normal">({pendingInsurance.length})</span>
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
              {pendingInsurance.map((profile) => (
                <div key={profile.userId} className="bg-white rounded-xl border border-border/60 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {profile.userName ?? "Unnamed handyman"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.userEmail ?? "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {format(new Date(profile.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>

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
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {verifiedInsurance.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Verified Insurance <span className="text-muted-foreground font-normal">({verifiedInsurance.length})</span>
            </h2>

            <div className="space-y-3">
              {verifiedInsurance.map((profile) => (
                <div key={profile.userId} className="bg-white rounded-xl border border-emerald-200 p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile.userName ?? "Unnamed handyman"}
                      </p>
                      <p className="text-xs text-muted-foreground">{profile.userEmail ?? "No email"}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Verified
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
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">
            Flagged Users <span className="text-muted-foreground font-normal">({flaggedUsers?.length ?? 0})</span>
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
              Open Disputes <span className="text-muted-foreground font-normal">({openDisputes.length})</span>
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
              Resolved Disputes <span className="text-muted-foreground font-normal">({resolvedDisputes.length})</span>
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
                        Resolved on {format(new Date(dispute.updatedAt ?? dispute.createdAt), "MMM d, yyyy")}
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
          <h2 className="text-base font-semibold text-foreground mb-4">
            Users <span className="text-muted-foreground font-normal">({users?.length ?? 0})</span>
          </h2>
          <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
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