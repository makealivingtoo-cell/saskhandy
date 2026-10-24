import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  CheckCircle,
  Copy,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Send,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-primary font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const bidTips = [
  "Bid on jobs that match your skills, tools, and schedule.",
  "Mention when you are available.",
  "Explain briefly how you would handle the job.",
  "Keep your price clear and realistic.",
  "Reply quickly if the homeowner messages you.",
];

function getProfileCategories(profile: any) {
  try {
    const parsed = JSON.parse(profile?.categories ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function getBidReadyItems(profile: any, fullName?: string | null) {
  const categories = getProfileCategories(profile);

  return [
    {
      label: "Full name",
      completed: Boolean(fullName && fullName.trim().length >= 2),
      required: true,
    },
    {
      label: "Profile photo",
      completed: Boolean(profile?.profileImageUrl),
      required: true,
    },
    {
      label: "Short bio",
      completed: Boolean(profile?.bio?.trim() && profile.bio.trim().length >= 25),
      required: true,
    },
    {
      label: "Skills/services",
      completed: categories.length > 0,
      required: true,
    },
    {
      label: "ID name matched",
      completed: profile?.identityVerificationStatus === "approved",
      required: true,
    },
  ];
}

function getTrustSignalItems(profile: any) {
  const hasExternalReviewLink = Boolean(
    profile?.externalGoogleReviewsUrl ||
      profile?.externalFacebookReviewsUrl ||
      profile?.externalWebsiteUrl
  );

  return [
    {
      label: "Service area",
      completed: Boolean(profile?.serviceArea?.trim()),
    },
    {
      label: "Hourly rate",
      completed: Boolean(profile?.hourlyRate),
    },
    {
      label: "External reviews",
      completed: hasExternalReviewLink,
    },
    {
      label: "Insurance reviewed",
      completed: Boolean(profile?.insuranceVerified),
    },
    {
      label: "Criminal check reviewed",
      completed: profile?.criminalRecordCheckStatus === "reviewed",
    },
    {
      label: "Trade licence verified",
      completed: profile?.tradeLicenseVerificationStatus === "approved",
    },
  ];
}

export default function HandymanDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.handymanProfiles.get.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const { data: myBids, isLoading: bidsLoading } = trpc.bids.getForHandyman.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const {
    data: referralJobs,
    isLoading: referralJobsLoading,
    refetch: refetchReferralJobs,
  } = trpc.referralJobs.getMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType === "handyman",
  });

  const {
    data: quotes,
    isLoading: quotesLoading,
    refetch: refetchQuotes,
  } = trpc.quotes.getMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType === "handyman",
  });

  const { data: earnings, refetch: refetchEarnings } = trpc.payments.getHandymanEarnings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [quoteForm, setQuoteForm] = useState({
    referralJobId: "",
    homeownerName: "",
    homeownerPhone: "",
    homeownerEmail: "",
    address: "",
    title: "",
    scope: "",
    subtotal: "",
    taxRate: "0",
    smsPermissionConfirmed: false,
  });
  const [sendingQuoteId, setSendingQuoteId] = useState<number | null>(null);
  const [completingQuoteId, setCompletingQuoteId] = useState<number | null>(null);

  const createQuote = trpc.quotes.create.useMutation();
  const sendQuote = trpc.quotes.send.useMutation();
  const completeQuote = trpc.quotes.complete.useMutation();

  const acceptedReferrals = referralJobs?.filter((job) => job.status === "accepted") ?? [];

  const handleCreateQuote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const referralJobId = quoteForm.referralJobId ? Number(quoteForm.referralJobId) : undefined;
    const selectedReferral = acceptedReferrals.find((job) => job.id === referralJobId);
    const subtotal = Number(quoteForm.subtotal);
    const taxRate = Number(quoteForm.taxRate || "0");

    if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(taxRate) || taxRate < 0) {
      toast.error("Enter a valid subtotal and tax rate.");
      return;
    }

    try {
      const draft = await createQuote.mutateAsync({
        ...(selectedReferral
          ? { referralJobId: selectedReferral.id }
          : {
              homeownerName: quoteForm.homeownerName.trim(),
              homeownerPhone: quoteForm.homeownerPhone.trim(),
              homeownerEmail: quoteForm.homeownerEmail.trim(),
              address: quoteForm.address.trim(),
            }),
        title: quoteForm.title.trim(),
        scope: quoteForm.scope.trim(),
        subtotal,
        taxRate,
      });

      if (quoteForm.smsPermissionConfirmed) {
        await sendQuote.mutateAsync({
          quoteId: draft.quoteId,
          confirmSmsPermission: true,
        });
        toast.success("Quote created and texted to the customer.");
      } else {
        toast.success("Quote saved as a draft. You can send it from the quote list after confirming text permission.");
      }

      setQuoteForm({
        referralJobId: "",
        homeownerName: "",
        homeownerPhone: "",
        homeownerEmail: "",
        address: "",
        title: "",
        scope: "",
        subtotal: "",
        taxRate: "0",
        smsPermissionConfirmed: false,
      });
      await refetchQuotes();
    } catch (error: any) {
      toast.error(error.message ?? "Could not create the quote.");
      await refetchQuotes();
    }
  };

  const handleSendQuote = async (quoteId: number) => {
    const confirmed = window.confirm(
      "Confirm that the customer agreed to receive this quote link by text. Send it now?"
    );
    if (!confirmed) return;

    setSendingQuoteId(quoteId);
    try {
      await sendQuote.mutateAsync({ quoteId, confirmSmsPermission: true });
      toast.success("Quote link sent by text.");
      await refetchQuotes();
    } catch (error: any) {
      toast.error(error.message ?? "Could not send the quote.");
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleCopyQuoteLink = async (publicToken: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/quote/${publicToken}`);
      toast.success("Quote link copied.");
    } catch {
      toast.error("Could not copy the quote link.");
    }
  };

  const handleCompleteQuote = async (quoteId: number) => {
    const confirmed = window.confirm(
      "Confirm that the quoted work is complete. This will make the handyman earnings available for payout."
    );
    if (!confirmed) return;

    setCompletingQuoteId(quoteId);
    try {
      await completeQuote.mutateAsync({ quoteId });
      toast.success("Quote marked complete. Earnings are now included in your payout balance.");
      await Promise.all([refetchQuotes(), refetchEarnings()]);
    } catch (error: any) {
      toast.error(error.message ?? "Could not mark the quote complete.");
    } finally {
      setCompletingQuoteId(null);
    }
  };

  const [referralActionId, setReferralActionId] = useState<number | null>(null);

  const acceptReferral = trpc.referralJobs.accept.useMutation({
    onSuccess: async () => {
      toast.success("Referral accepted. You can now contact the homeowner and prepare a quote.");
      setReferralActionId(null);
      await refetchReferralJobs();
    },
    onError: (error) => {
      toast.error(error.message);
      setReferralActionId(null);
    },
  });

  const declineReferral = trpc.referralJobs.decline.useMutation({
    onSuccess: async () => {
      toast.success("Referral declined.");
      setReferralActionId(null);
      await refetchReferralJobs();
    },
    onError: (error) => {
      toast.error(error.message);
      setReferralActionId(null);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "handyman" && user?.role !== "admin") {
      navigate("/role-select");
      return;
    }

    if (
      !loading &&
      isAuthenticated &&
      user?.userType === "handyman" &&
      !profileLoading &&
      !profile
    ) {
      navigate("/onboarding");
    }
  }, [loading, isAuthenticated, user, profileLoading, profile, navigate]);

  const pendingBids = myBids?.filter((b) => b.status === "pending") ?? [];
  const acceptedBids = myBids?.filter((b) => b.status === "accepted") ?? [];

  const bidReadyItems = useMemo(() => getBidReadyItems(profile, user?.name), [profile, user?.name]);
  const trustSignalItems = useMemo(() => getTrustSignalItems(profile), [profile]);

  const bidReadyCompletion = useMemo(() => {
    if (!profile) return 0;

    const completedItems = bidReadyItems.filter((item) => item.completed).length;
    return Math.round((completedItems / bidReadyItems.length) * 100);
  }, [profile, bidReadyItems]);

  const isBidReady = bidReadyItems.every((item) => item.completed);
  const completedTrustSignals = trustSignalItems.filter((item) => item.completed).length;

  const goldShieldVerified =
    profile?.identityVerificationStatus === "approved" &&
    profile?.criminalRecordCheckStatus === "reviewed";

  const hasExternalReviewLinks = Boolean(
    profile?.externalGoogleReviewsUrl ||
      profile?.externalFacebookReviewsUrl ||
      profile?.externalWebsiteUrl
  );

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-border/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Handyman dashboard</p>

              <h1 className="text-3xl font-serif text-foreground">
                Welcome back, {user?.name?.split(" ")[0]}
              </h1>

              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Find jobs that match your skills, send clear bids, and build a profile homeowners
                feel confident choosing.
              </p>

              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {profile?.rating && parseFloat(profile.rating) > 0 ? (
                  <StarRatingDisplay rating={parseFloat(profile.rating)} size="sm" showValue />
                ) : (
                  <span className="text-sm text-muted-foreground">No ratings yet</span>
                )}

                <span className="text-sm text-muted-foreground">
                  {profile?.totalJobs ?? 0} jobs completed
                </span>

                {goldShieldVerified && (
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Gold Shield
                  </span>
                )}

                {profile?.identityVerificationStatus === "approved" && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    ID Name Matched
                  </span>
                )}

                {profile?.serviceArea && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.serviceArea}
                  </span>
                )}
              </div>

              {hasExternalReviewLinks && (
                <div className="flex items-center gap-2 text-xs mt-3 flex-wrap">
                  <span className="text-muted-foreground">External reviews:</span>

                  {profile?.externalGoogleReviewsUrl && (
                    <a
                      href={profile.externalGoogleReviewsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Google <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {profile?.externalFacebookReviewsUrl && (
                    <a
                      href={profile.externalFacebookReviewsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Facebook <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {profile?.externalWebsiteUrl && (
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
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[180px]">
              <Button asChild>
                <Link href="/handyman/browse">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href="/handyman/profile">
                  <Shield className="w-4 h-4 mr-2" />
                  Improve Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* SaskHandy referrals */}
        <section className="bg-white rounded-2xl border border-border/60 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">SaskHandy referrals</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Leads personally matched and sent to you by SaskHandy.
              </p>
            </div>
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">
              {referralJobs?.filter((job) => job.status === "sent").length ?? 0} awaiting response
            </span>
          </div>

          {referralJobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !referralJobs?.length ? (
            <div className="rounded-xl border border-dashed border-border p-7 text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No referrals assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                SaskHandy referrals will appear here when one is matched to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralJobs.map((referral) => {
                const isPending = referral.status === "sent";
                const isActing = referralActionId === referral.id;
                return (
                  <article
                    key={referral.id}
                    className="rounded-xl border border-border/60 p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{referral.title}</h3>
                          <StatusBadge status={referral.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {referral.category} · Sent {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-foreground/90 mt-3 whitespace-pre-wrap">
                          {referral.description}
                        </p>
                        {referral.photos?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {referral.photos.map((photo, index) => (
                              <a
                                key={`${referral.id}-photo-${index}`}
                                href={photo}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View photo {index + 1} <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => {
                              setReferralActionId(referral.id);
                              acceptReferral.mutate({ referralJobId: referral.id });
                            }}
                            disabled={isActing}
                          >
                            {isActing && acceptReferral.isPending ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReferralActionId(referral.id);
                              declineReferral.mutate({ referralJobId: referral.id });
                            }}
                            disabled={isActing}
                          >
                            {isActing && declineReferral.isPending ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : null}
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>

                    {referral.status === "accepted" ? (
                      <div className="mt-4 pt-4 border-t border-border/50 grid gap-2 sm:grid-cols-2 text-sm">
                        <p><span className="text-muted-foreground">Homeowner:</span> {referral.homeownerName}</p>
                        {referral.homeownerPhone && (
                          <p><span className="text-muted-foreground">Phone:</span> {referral.homeownerPhone}</p>
                        )}
                        {referral.homeownerEmail && (
                          <p><span className="text-muted-foreground">Email:</span> {referral.homeownerEmail}</p>
                        )}
                        {referral.address && (
                          <p className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {referral.address}
                          </p>
                        )}
                        <p className="sm:col-span-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          This is a SaskHandy referral. The 20% commission is attached to this job and applies to the completed quote.
                        </p>
                      </div>
                    ) : referral.status === "sent" ? (
                      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                        Accept the referral to access the homeowner’s contact details. The 20% SaskHandy referral commission applies to this job.
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick quotes */}
        <section className="bg-white rounded-2xl border border-border/60 p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Quick quotes</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Create a quote for a SaskHandy referral or your own customer. The customer can review,
              approve, and pay from a link without creating an account.
            </p>
          </div>

          <form onSubmit={handleCreateQuote} className="rounded-xl border border-border/60 p-4 sm:p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Create a quote</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-referral">
                Customer source
              </label>
              <select
                id="quote-referral"
                value={quoteForm.referralJobId}
                onChange={(event) => {
                  const referralJobId = event.target.value;
                  const referral = acceptedReferrals.find((job) => String(job.id) === referralJobId);
                  setQuoteForm((current) => ({
                    ...current,
                    referralJobId,
                    title: referral ? referral.title : current.title,
                  }));
                }}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">My own customer</option>
                {acceptedReferrals.map((referral) => (
                  <option key={referral.id} value={referral.id}>
                    SaskHandy referral: {referral.title}
                  </option>
                ))}
              </select>
            </div>

            {!quoteForm.referralJobId && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-homeowner-name">
                    Customer name
                  </label>
                  <input
                    id="quote-homeowner-name"
                    required
                    maxLength={255}
                    value={quoteForm.homeownerName}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, homeownerName: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-homeowner-phone">
                    Customer phone
                  </label>
                  <input
                    id="quote-homeowner-phone"
                    required
                    type="tel"
                    maxLength={30}
                    value={quoteForm.homeownerPhone}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, homeownerPhone: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-homeowner-email">
                    Customer email (optional)
                  </label>
                  <input
                    id="quote-homeowner-email"
                    type="email"
                    maxLength={320}
                    value={quoteForm.homeownerEmail}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, homeownerEmail: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-address">
                    Work address (optional)
                  </label>
                  <input
                    id="quote-address"
                    maxLength={500}
                    value={quoteForm.address}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, address: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {quoteForm.referralJobId && (
              <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                SaskHandy supplies the customer details and applies the referral commission to this quote.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-title">
                  Quote title
                </label>
                <input
                  id="quote-title"
                  required
                  minLength={3}
                  maxLength={255}
                  value={quoteForm.title}
                  onChange={(event) => setQuoteForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="e.g. Bathroom faucet replacement"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-subtotal">
                    Subtotal (CAD)
                  </label>
                  <input
                    id="quote-subtotal"
                    required
                    type="number"
                    min="0.01"
                    max="999999.99"
                    step="0.01"
                    value={quoteForm.subtotal}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, subtotal: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-tax-rate">
                    Tax rate (%)
                  </label>
                  <input
                    id="quote-tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={quoteForm.taxRate}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, taxRate: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-scope">
                Work description
              </label>
              <textarea
                id="quote-scope"
                required
                maxLength={10000}
                rows={4}
                value={quoteForm.scope}
                onChange={(event) => setQuoteForm((current) => ({ ...current, scope: event.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Describe the work included in this quote."
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={quoteForm.smsPermissionConfirmed}
                onChange={(event) => setQuoteForm((current) => ({ ...current, smsPermissionConfirmed: event.target.checked }))}
                className="mt-0.5"
              />
              <span>I have the customer’s permission to text them this quote link.</span>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Quotes expire after 30 days. The customer can review and pay without signing in.
              </p>
              <Button type="submit" disabled={createQuote.isPending || sendQuote.isPending}>
                {createQuote.isPending || sendQuote.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : quoteForm.smsPermissionConfirmed ? (
                  <Send className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {quoteForm.smsPermissionConfirmed ? "Create and text quote" : "Save quote draft"}
              </Button>
            </div>
          </form>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-foreground">Your quotes</h3>
                <p className="text-xs text-muted-foreground mt-1">Track drafts, approvals, and customer payments.</p>
              </div>
              <span className="text-xs text-muted-foreground">{quotes?.length ?? 0} total</span>
            </div>

            {quotesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !quotes?.length ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Your quotes will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <article key={quote.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{quote.title}</h4>
                          <StatusBadge status={quote.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {quote.sourceType === "saskhandy_referral" ? "SaskHandy referral" : "Your customer"}
                          {quote.homeownerName ? ` · ${quote.homeownerName}` : ""}
                          {` · Updated ${formatDistanceToNow(new Date(quote.updatedAt), { addSuffix: true })}`}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground shrink-0">${Number(quote.totalAmount).toFixed(2)} CAD</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quote.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingQuoteId === quote.id}
                          onClick={() => void handleSendQuote(quote.id)}
                        >
                          {sendingQuoteId === quote.id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-1.5" />
                          )}
                          Text quote link
                        </Button>
                      )}
                      {quote.status === "paid" && (
                        <Button
                          size="sm"
                          disabled={completingQuoteId === quote.id}
                          onClick={() => void handleCompleteQuote(quote.id)}
                        >
                          {completingQuoteId === quote.id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                          )}
                          Mark work complete
                        </Button>
                      )}
                      {quote.status !== "draft" && quote.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleCopyQuoteLink(quote.publicToken)}
                        >
                          <Copy className="w-4 h-4 mr-1.5" />
                          Copy customer link
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Profile status */}
        <div className="bg-white rounded-2xl border border-border/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isBidReady ? "You’re ready to bid" : "Finish setup to unlock bidding"}
              </h2>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                {isBidReady
                  ? "You can bid on open jobs. Add more trust signals to help your profile stand out when homeowners compare bids."
                  : "Complete the required items so homeowners can review your profile and you can start sending bids."}
              </p>
            </div>

            <div className="text-left lg:text-right">
              <p className="text-2xl font-bold text-foreground">{bidReadyCompletion}%</p>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isBidReady ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isBidReady ? "Ready to bid" : "Required before bidding"}
              </p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden mb-5">
            <div
              className={`h-full rounded-full transition-all ${
                isBidReady ? "bg-emerald-600" : "bg-amber-500"
              }`}
              style={{ width: `${bidReadyCompletion}%` }}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Required to bid</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These unlock your ability to send bids.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {bidReadyItems.map((item) => (
                  <span
                    key={item.label}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      item.completed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.completed ? "✓ " : ""}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Trust signals</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These can help homeowners feel better about choosing you.
                  </p>
                </div>

                <p className="text-xs font-medium text-primary">
                  {completedTrustSignals}/{trustSignalItems.length} complete
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {trustSignalItems.map((item) => (
                  <span
                    key={item.label}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      item.completed
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-muted text-muted-foreground border-border/60"
                    }`}
                  >
                    {item.completed ? "✓ " : ""}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isBidReady
                ? "Want to win more work? Add your service area, reviews, insurance, licence, or other trust signals."
                : "Once your required setup is complete, you’ll be able to bid on open jobs."}
            </p>

            <Button asChild size="sm" variant="outline">
              <Link href="/handyman/profile">
                {isBidReady ? "Improve Trust Profile" : "Complete Profile"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Ready to withdraw"
            value={`$${parseFloat(earnings?.availableBalance ?? "0").toFixed(0)}`}
            icon={DollarSign}
            color="bg-emerald-50 text-emerald-600"
            sub="available balance"
          />

          <StatCard
            label="Open bids"
            value={pendingBids.length}
            icon={Briefcase}
            color="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Jobs won"
            value={acceptedBids.length}
            icon={TrendingUp}
            color="bg-amber-50 text-amber-600"
          />

          <StatCard
            label="Homeowner rating"
            value={profile?.rating ? parseFloat(profile.rating).toFixed(1) : "—"}
            icon={Star}
            color="bg-purple-50 text-purple-600"
            sub={profile?.totalJobs ? `${profile.totalJobs} jobs completed` : undefined}
          />
        </div>

        {/* Recent bids */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent bids</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track the jobs you’ve quoted and follow up when homeowners respond.
              </p>
            </div>

            <Link href="/handyman/bids">
              <span className="text-sm text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>

          {bidsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !myBids || myBids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-10 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />

              <h3 className="font-semibold text-foreground mb-2">No bids sent yet</h3>

              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
                Browse available jobs and send a clear bid with your price, availability, and a
                short note about how you can help.
              </p>

              <Button asChild>
                <Link href="/handyman/browse">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBids.slice(0, 5).map((bid) => (
                <Link key={bid.id} href={`/handyman/jobs/${bid.jobId}`}>
                  <div className="bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-foreground text-sm truncate">
                            {bid.jobTitle ?? "Job"}
                          </p>
                          <StatusBadge status={bid.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {bid.jobLocation && <span>{bid.jobLocation}</span>}
                          <span>
                            {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">${bid.bidAmount}</p>
                        <p className="text-xs text-muted-foreground">your bid</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl border border-border/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">How to win more jobs</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {bidTips.map((tip) => (
              <div key={tip} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
