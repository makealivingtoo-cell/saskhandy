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
  Loader2,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: disputes, isLoading: disputesLoading, refetch } = trpc.disputes.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: users } = trpc.admin.getUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  const resolveDispute = trpc.disputes.resolve.useMutation({
    onSuccess: () => {
      toast.success("Dispute resolved.");
      setResolvingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!user || user.role !== "admin") {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
        </div>
      </AppLayout>
    );
  }

  const openDisputes = disputes?.filter((d) => d.status === "open") ?? [];
  const resolvedDisputes = disputes?.filter((d) => d.status !== "open") ?? [];

  return (
    <AppLayout title="Admin Panel">
      <div className="space-y-8">
        {/* Stats */}
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

        {/* Open Disputes */}
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
              <p className="text-sm text-muted-foreground">No open disputes. All clear!</p>
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
                    <Button
                      size="sm"
                      onClick={() => setResolvingId(dispute.id)}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Resolve Dispute
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Disputes */}
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

        {/* Users Table */}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users?.map((u) => (
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
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
