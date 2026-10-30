import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  ChevronDown,
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
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    isError: referralJobsError,
    refetch: refetchReferralJobs,
  } = trpc.referralJobs.getMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType === "handyman",
  });

  const {
    data: quotes,
    isLoading: quotesLoading,
    isError: quotesError,
    refetch: refetchQuotes,
  } = trpc.quotes.getMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.userType === "handyman",
    retry: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
    gstRate: "5",
    pstRate: "6",
    chargeGst: false,
    smsPermissionConfirmed: false,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState("all");
  const [createdDraftId, setCreatedDraftId] = useState<number | null>(null);
  const submissionLock = useRef(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const editorRef = useRef<HTMLFormElement>(null);
  const openEditor = () => setEditorOpen(true);
  useEffect(() => {
    if (editorOpen) {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorRef.current?.querySelector<HTMLSelectElement>("select")?.focus({ preventScroll: true });
    }
  }, [editorOpen]);
  const safeError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : "";
    return message && message.length < 180 && !/query|sql|params:|twilio|stripe|\{/.test(message.toLowerCase()) ? message : fallback;
  };
  const [sendingQuoteId, setSendingQuoteId] = useState<number | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<number | null>(null);
  const [cancellingQuoteId, setCancellingQuoteId] = useState<number | null>(null);
  const [completingQuoteId, setCompletingQuoteId] = useState<number | null>(null);

  const createQuote = trpc.quotes.create.useMutation();
  const sendQuote = trpc.quotes.send.useMutation();
  const deleteDraftQuote = trpc.quotes.deleteDraft.useMutation();
  const cancelSentQuote = trpc.quotes.cancelSent.useMutation();
  const completeQuote = trpc.quotes.complete.useMutation();

  const acceptedReferrals = referralJobs?.filter((job) => job.status === "accepted") ?? [];

  const handleCreateQuote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLock.current) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldSend = submitter?.value === "send";
    if (shouldSend && !quoteForm.smsPermissionConfirmed) {
      toast.error("Confirm the customer's permission before sending a text.");
      return;
    }

    const referralJobId = quoteForm.referralJobId ? Number(quoteForm.referralJobId) : undefined;
    const selectedReferral = acceptedReferrals.find((job) => job.id === referralJobId);
    if (referralJobId && !selectedReferral && !createdDraftId) {
      toast.error("This referral is no longer available. Refresh the referrals before quoting.");
      return;
    }
    const subtotal = Number(quoteForm.subtotal);
    const gstRate = quoteForm.chargeGst ? Number(quoteForm.gstRate || "0") : 0;
    const pstRate = Number(quoteForm.pstRate || "0");

    if (
      !Number.isFinite(subtotal) || subtotal <= 0 ||
      !Number.isFinite(gstRate) || gstRate < 0 ||
      !Number.isFinite(pstRate) || pstRate < 0
    ) {
      toast.error("Enter a valid subtotal, GST rate, and PST rate.");
      return;
    }

    submissionLock.current = true;
    setSubmitBusy(true);
    let savedId = createdDraftId;
    try {
      const draft = savedId ? { quoteId: savedId } : await createQuote.mutateAsync({
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
        gstRate,
        pstRate,
      });

      savedId = draft.quoteId;
      setCreatedDraftId(savedId);
      if (shouldSend) {
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
        gstRate: "5",
        pstRate: "6",
        chargeGst: false,
        smsPermissionConfirmed: false,
      });
      setCreatedDraftId(null);
      setEditorOpen(false);
      setQuoteFilter("all");
      await Promise.all([refetchQuotes(), refetchReferralJobs()]);
    } catch (error: any) {
      toast.error(savedId
        ? "Your draft is saved, but the text could not be sent. Retry sending below or find it in your drafts."
        : safeError(error, "Could not save your quote. Your details are still here; please try again."));
      await refetchQuotes();
    } finally {
      submissionLock.current = false;
      setSubmitBusy(false);
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
      toast.error(safeError(error, "Could not send the quote."));
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleDeleteDraftQuote = async (quoteId: number) => {
    const confirmed = window.confirm("Delete this unsent draft quote? This cannot be undone.");
    if (!confirmed) return;

    setDeletingQuoteId(quoteId);
    try {
      await deleteDraftQuote.mutateAsync({ quoteId });
      toast.success("Draft quote deleted.");
      await refetchQuotes();
    } catch (error: any) {
      toast.error(safeError(error, "Could not delete the draft quote."));
    } finally {
      setDeletingQuoteId(null);
    }
  };

  const handleCancelSentQuote = async (quoteId: number) => {
    const confirmed = window.confirm(
      "Withdraw this quote? The customer link will stop working. The quote record will remain in your history."
    );
    if (!confirmed) return;

    setCancellingQuoteId(quoteId);
    try {
      await cancelSentQuote.mutateAsync({ quoteId });
      toast.success("Quote withdrawn. The customer link is no longer active.");
      await Promise.all([refetchQuotes(), refetchReferralJobs()]);
    } catch (error: any) {
      toast.error(safeError(error, "Could not withdraw the quote."));
    } finally {
      setCancellingQuoteId(null);
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
      toast.error(safeError(error, "Could not mark the quote complete."));
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
      toast.error(safeError(error, "Could not update this referral. Please try again."));
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
      toast.error(safeError(error, "Could not update this referral. Please try again."));
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

  const filteredQuotes = (quotes ?? []).filter((quote) =>
    quoteFilter === "all" ||
    (quoteFilter === "draft" && quote.status === "draft") ||
    (quoteFilter === "sent" && ["sent", "viewed", "approved", "payment_pending"].includes(quote.status)) ||
    (quoteFilter === "paid" && ["paid", "completed"].includes(quote.status))
  );
  const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
  const amount = Math.max(0, Number(quoteForm.subtotal) || 0);
  const gst = Math.round(amount * (quoteForm.chargeGst ? Number(quoteForm.gstRate) || 0 : 0)) / 100;
  const pst = Math.round(amount * (Number(quoteForm.pstRate) || 0)) / 100;
  const chosenReferral = acceptedReferrals.find(job => String(job.id) === quoteForm.referralJobId);

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div aria-busy="true" aria-label="Loading dashboard" className="mx-auto max-w-6xl space-y-5"><div className="h-32 rounded-2xl bg-muted animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0,1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div><div className="h-40 rounded-2xl bg-muted animate-pulse" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-border/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Handyman dashboard</p>

              <h1 className="text-3xl font-serif text-foreground">
                Welcome back, {user?.name?.split(" ")[0]}
              </h1>

              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Your jobs, referrals, and customer quotes in one place.
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
              <Button asChild variant="outline">
                <Link href="/handyman/browse">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Link>
              </Button>

              <Button onClick={openEditor}><Plus className="w-4 h-4 mr-2" />New quote</Button>
            </div>
          </div>
        </div>

        {!isBidReady && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold">Finish your profile to start bidding</h2>
                <p className="text-sm text-muted-foreground mt-1">{bidReadyItems.filter(item => item.completed).length} of {bidReadyItems.length} required items complete</p></div>
              <Button asChild size="sm"><Link href="/handyman/profile">Complete profile</Link></Button>
            </div>
            <div role="progressbar" aria-label="Profile completion" aria-valuenow={bidReadyCompletion} aria-valuemin={0} aria-valuemax={100} className="mt-4 h-1.5 rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${bidReadyCompletion}%` }} /></div>
            <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium">What’s left?</summary>
              <div className="flex flex-wrap gap-2 mt-3">{bidReadyItems.filter(item => !item.completed).map(item => <Link key={item.label} href="/handyman/profile" className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs hover:underline">{item.label}</Link>)}</div>
            </details>
          </section>
        )}
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
            value={Number(profile?.rating) > 0 ? Number(profile?.rating).toFixed(1) : "—"}
            icon={Star}
            color="bg-purple-50 text-purple-600"
            sub={Number(profile?.rating) > 0 ? `${profile?.totalJobs ?? 0} jobs completed` : "No reviews yet"}
          />
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

          {referralJobsError ? (<p role="alert" className="text-sm">Could not load referrals. <Button size="sm" variant="outline" onClick={() => void refetchReferralJobs()}>Try again</Button></p>) : referralJobsLoading ? (
            <div aria-busy="true" aria-label="Loading" className="h-20 rounded-xl bg-muted animate-pulse" />
          ) : !referralJobs?.length ? (
            <div className="rounded-xl bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium text-foreground">No referrals assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                SaskHandy referrals will appear here when one is matched to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...referralJobs].sort((a, b) => (a.status === "sent" ? 0 : a.status === "accepted" ? 1 : 2) - (b.status === "sent" ? 0 : b.status === "accepted" ? 1 : 2)).map((referral) => {
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
                        <details className="mt-3 text-sm"><summary className="cursor-pointer text-primary">View job details</summary><p className="mt-2 whitespace-pre-wrap">{referral.description}</p></details>
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
                        <Button size="sm" className="sm:col-span-2 justify-self-start" onClick={() => {
                          if (createdDraftId || Object.values(quoteForm).some((value, index) => index < 8 && Boolean(value))) {
                            if (!window.confirm("Replace the current editor details with this referral? Saved drafts remain in your list.")) return;
                          }
                          setCreatedDraftId(null);
                          setQuoteForm(current => ({ ...current, referralJobId: String(referral.id), title: referral.title, scope: referral.description, subtotal: "", smsPermissionConfirmed: false }));
                          openEditor();
                        }}><Plus className="w-4 h-4 mr-2" />Create quote</Button>
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

        {editorOpen && (
          <form ref={editorRef} id="quote-editor" onSubmit={handleCreateQuote} className="scroll-mt-24 rounded-2xl border border-primary/20 bg-white p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">New quote</h2><p className="mt-1 text-sm text-muted-foreground">Add the work and price, then save or send.</p></div><Button type="button" variant="ghost" disabled={submitBusy} onClick={() => { setEditorOpen(false); if (createdDraftId) {       setQuoteForm({
        referralJobId: "",
        homeownerName: "",
        homeownerPhone: "",
        homeownerEmail: "",
        address: "",
        title: "",
        scope: "",
        subtotal: "",
        gstRate: "5",
        pstRate: "6",
        chargeGst: false,
        smsPermissionConfirmed: false,
      });
setCreatedDraftId(null); } }}>Close</Button></div>
            {createdDraftId && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm">Draft saved. Retry sending, or close this editor and use the draft in your quote list.</p>}
            <fieldset disabled={submitBusy || createdDraftId !== null} className="space-y-5 disabled:opacity-70">
            <legend className="text-sm font-semibold mb-3">1. Customer</legend>

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
                    scope: referral ? referral.description : current.scope,
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
                {chosenReferral?.homeownerName} · {chosenReferral?.homeownerPhone}<br />{chosenReferral?.address}<br />Customer details are linked to this referral.
              </p>
            )}

            <h3 className="border-t pt-5 text-sm font-semibold">2. Work details</h3>
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

            <h3 className="border-t pt-5 text-sm font-semibold">3. Pricing</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-gst-rate">
                    GST rate (%)
                  </label>
                  <input
                    id="quote-gst-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={quoteForm.gstRate}
                    disabled={!quoteForm.chargeGst}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, gstRate: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-muted"
                  />
                  <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={quoteForm.chargeGst}
                      onChange={(event) => setQuoteForm((current) => ({ ...current, chargeGst: event.target.checked }))}
                      className="mt-0.5"
                    />
                    I’m registered or required to collect GST.
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="quote-pst-rate">
                    PST rate (%)
                  </label>
                  <input
                    id="quote-pst-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={quoteForm.pstRate}
                    onChange={(event) => setQuoteForm((current) => ({ ...current, pstRate: event.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Set to 0 if PST does not apply.</p>
                </div>
              </div>
            </fieldset>
            <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-2" aria-live="polite">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(amount)}</span></div>
              <div className="flex justify-between"><span>GST {quoteForm.chargeGst ? `(${quoteForm.gstRate}%)` : "(not charged)"}</span><span>{money(gst)}</span></div>
              <div className="flex justify-between"><span>PST ({quoteForm.pstRate || 0}%)</span><span>{money(pst)}</span></div>
              <div className="flex justify-between border-t pt-3 text-lg font-semibold"><span>Customer total</span><span>{money(amount + gst + pst)} CAD</span></div>
              <p className="text-xs text-muted-foreground">Your platform fee and estimated payout appear on the saved quote below. They are not shown to the customer.</p>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" name="intent" value="draft" variant="outline" disabled={submitBusy}>Save draft</Button>
                <Button type="submit" name="intent" value="send" disabled={submitBusy || !quoteForm.smsPermissionConfirmed}>
                  {submitBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {createdDraftId ? "Retry sending" : "Send quote"}
                </Button>
              </div>
            </div>
          </form>
        )}
        {/* Quick quotes */}
        <section className="bg-white rounded-2xl border border-border/60 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Quotes</h2><p className="text-sm text-muted-foreground mt-1">Send a price. Track the response. Get paid.</p></div>
            <Button onClick={openEditor}><Plus className="w-4 h-4 mr-2" />New quote</Button>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter quotes">
            {[["all", "All"], ["draft", "Drafts"], ["sent", "Sent / awaiting payment"], ["paid", "Paid"]].map(([value, label]) => <Button key={value} size="sm" variant={quoteFilter === value ? "default" : "outline"} aria-pressed={quoteFilter === value} onClick={() => setQuoteFilter(value)}>{label}</Button>)}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-foreground">Your quotes</h3>
                <p className="text-xs text-muted-foreground mt-1">Track drafts, approvals, and customer payments.</p>
              </div>
              <span className="text-xs text-muted-foreground">{quotes?.length ?? 0} total</span>
            </div>

            {quotesError ? (<div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">Could not load your quotes. <Button variant="outline" size="sm" onClick={() => void refetchQuotes()}>Try again</Button></div>) : quotesLoading ? (
              <div className="space-y-3" aria-label="Loading quotes" aria-busy="true">
                {[0, 1].map((item) => (
                  <div key={item} className="rounded-xl border border-border/60 p-4">
                    <div className="h-4 w-2/3 rounded bg-muted/70 animate-pulse" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
                    <div className="mt-4 h-4 w-24 rounded bg-muted/70 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : !filteredQuotes.length ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {quoteFilter === "all" ? "No quotes yet. Create your first quote when you’re ready." : "No quotes in this category."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuotes.map((quote) => (
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
                    <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Your fee &amp; estimated payout</summary><div className="mt-2 space-y-1"><p>Platform fee: {money(Number(quote.platformFeeAmount))} ({quote.platformFeeRate}%)</p><p>Estimated payout: {money(Number(quote.totalAmount) - Number(quote.platformFeeAmount))}, including collected taxes.</p></div></details>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quote.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingQuoteId === quote.id || deletingQuoteId === quote.id || createdDraftId === quote.id}
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
                      {quote.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deletingQuoteId === quote.id || sendingQuoteId === quote.id || createdDraftId === quote.id}
                          onClick={() => void handleDeleteDraftQuote(quote.id)}
                        >
                          {deletingQuoteId === quote.id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1.5" />
                          )}
                          Delete draft
                        </Button>
                      )}
                      {["sent", "viewed"].includes(quote.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cancellingQuoteId === quote.id}
                          onClick={() => void handleCancelSentQuote(quote.id)}
                        >
                          {cancellingQuoteId === quote.id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1.5" />
                          )}
                          Withdraw quote
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
            <div aria-busy="true" aria-label="Loading" className="h-20 rounded-xl bg-muted animate-pulse" />
          ) : !myBids || myBids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/60 p-5 text-center">
              <Briefcase className="w-6 h-6 text-muted-foreground mx-auto mb-3" />

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

        <details className="rounded-2xl border border-border/60 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">Strengthen your profile <span className="text-muted-foreground font-normal">· {completedTrustSignals}/{trustSignalItems.length} complete</span></summary><div className="mt-3 flex flex-wrap gap-2">{trustSignalItems.map(item => <span key={item.label} className="rounded-full bg-muted px-3 py-1 text-xs">{item.completed ? "✓ " : ""}{item.label}</span>)}</div><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/handyman/profile">Edit profile</Link></Button></details>
        {/* Tips */}
        <details className="bg-white rounded-2xl border border-border/60 p-5">
          <summary className="flex items-center gap-2 cursor-pointer font-semibold">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Tips for winning jobs</span><ChevronDown className="w-4 h-4 ml-auto" />
          </summary>

          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {bidTips.map((tip) => (
              <div key={tip} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </AppLayout>
  );
}
