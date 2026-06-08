import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Camera,
  CheckCircle,
  ExternalLink,
  Info,
  Loader2,
  Link as LinkIcon,
  MapPin,
  Save,
  Shield,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const bioTips = [
  "Mention the types of jobs you are comfortable doing.",
  "Include your experience or trade background if you have one.",
  "Keep it friendly, clear, and professional.",
];

function getBidReadyItems({
  fullName,
  bio,
  selectedCategories,
  profileImageUrl,
  identityVerificationStatus,
}: {
  fullName?: string | null;
  bio: string;
  selectedCategories: string[];
  profileImageUrl?: string | null;
  identityVerificationStatus?: string | null;
}) {
  return [
    {
      label: "Full name",
      completed: Boolean(fullName && fullName.trim().length >= 2),
      required: true,
    },
    {
      label: "Profile photo",
      completed: Boolean(profileImageUrl),
      required: true,
    },
    {
      label: "Short bio",
      completed: bio.trim().length >= 25,
      required: true,
    },
    {
      label: "Skills",
      completed: selectedCategories.length > 0,
      required: true,
    },
    {
      label: "ID name match",
      completed: identityVerificationStatus === "approved",
      required: true,
    },
  ];
}

function getOptionalTrustItems({
  hourlyRate,
  insuranceCertUrl,
  insuranceVerified,
  identityVerificationStatus,
  criminalRecordCheckStatus,
  tradeLicenseVerificationStatus,
  serviceArea,
  externalGoogleReviewsUrl,
  externalFacebookReviewsUrl,
  externalWebsiteUrl,
}: {
  hourlyRate: string;
  insuranceCertUrl?: string | null;
  insuranceVerified?: boolean | null;
  identityVerificationStatus?: string | null;
  criminalRecordCheckStatus?: string | null;
  tradeLicenseVerificationStatus?: string | null;
  serviceArea?: string | null;
  externalGoogleReviewsUrl?: string | null;
  externalFacebookReviewsUrl?: string | null;
  externalWebsiteUrl?: string | null;
}) {
  const hasExternalReviewLink = Boolean(
    externalGoogleReviewsUrl || externalFacebookReviewsUrl || externalWebsiteUrl
  );

  return [
    {
      label: "Service area",
      completed: Boolean(serviceArea?.trim()),
    },
    {
      label: "Hourly rate",
      completed: Boolean(hourlyRate.trim()),
    },
    {
      label: "External reviews linked",
      completed: hasExternalReviewLink,
    },
    {
      label: "Insurance file",
      completed: Boolean(insuranceCertUrl),
    },
    {
      label: "Insurance verified",
      completed: Boolean(insuranceVerified),
    },
    {
      label: "ID name matched",
      completed: identityVerificationStatus === "approved",
    },
    {
      label: "Criminal check reviewed",
      completed: criminalRecordCheckStatus === "reviewed",
    },
    {
      label: "Trade licence verified",
      completed: tradeLicenseVerificationStatus === "approved",
    },
  ];
}

export default function HandymanProfile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const insuranceFileInputRef = useRef<HTMLInputElement | null>(null);
  const identityFileInputRef = useRef<HTMLInputElement | null>(null);
  const criminalRecordFileInputRef = useRef<HTMLInputElement | null>(null);
  const tradeLicenseFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  const { data: profile, isLoading } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: reviews } = trpc.reviews.getForUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const { data: categories = [] } = trpc.jobs.categories.useQuery();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [externalGoogleReviewsUrl, setExternalGoogleReviewsUrl] = useState("");
  const [externalFacebookReviewsUrl, setExternalFacebookReviewsUrl] = useState("");
  const [externalWebsiteUrl, setExternalWebsiteUrl] = useState("");
  const [tradeLicenseType, setTradeLicenseType] = useState("");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingCriminalRecord, setUploadingCriminalRecord] = useState(false);
  const [uploadingTradeLicense, setUploadingTradeLicense] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const updateProfile = trpc.handymanProfiles.createOrUpdate.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated.");
      await utils.handymanProfiles.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: accountDeletionStatus, refetch: refetchAccountDeletionStatus } =
    trpc.auth.getAccountDeletionStatus.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const deleteMyAccount = trpc.auth.deleteMyAccount.useMutation({
    onSuccess: () => {
      toast.success("Your account has been deleted.");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message);
      refetchAccountDeletionStatus();
    },
  });

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Type DELETE to confirm account deletion.");
      return;
    }

    const confirmed = window.confirm(
      "Delete your SaskHandy account? This removes your login access and anonymizes your account. This cannot be undone."
    );

    if (!confirmed) return;

    deleteMyAccount.mutate({ confirmation: "DELETE" });
  };

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
    if (profile) {
      setFullName(user?.name ?? profile.userName ?? "");
      setBio(profile.bio ?? "");

      try {
        const cats = JSON.parse(profile.categories ?? "[]");
        setSelectedCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setSelectedCategories([]);
      }

      setHourlyRate(profile.hourlyRate ? String(parseFloat(profile.hourlyRate)) : "");
      setServiceArea(profile.serviceArea ?? "");
      setExternalGoogleReviewsUrl(profile.externalGoogleReviewsUrl ?? "");
      setExternalFacebookReviewsUrl(profile.externalFacebookReviewsUrl ?? "");
      setExternalWebsiteUrl(profile.externalWebsiteUrl ?? "");
      setTradeLicenseType(profile.tradeLicenseType ?? "");
      setTradeLicenseNumber(profile.tradeLicenseNumber ?? "");
    }
  }, [profile, user?.name]);

  const bidReadyItems = useMemo(
    () =>
      getBidReadyItems({
        fullName,
        bio,
        selectedCategories,
        profileImageUrl: profile?.profileImageUrl,
        identityVerificationStatus: profile?.identityVerificationStatus,
      }),
    [fullName, bio, selectedCategories, profile?.profileImageUrl, profile?.identityVerificationStatus]
  );

  const optionalTrustItems = useMemo(
    () =>
      getOptionalTrustItems({
        hourlyRate,
        insuranceCertUrl: profile?.insuranceCertUrl,
        insuranceVerified: profile?.insuranceVerified,
        identityVerificationStatus: profile?.identityVerificationStatus,
        criminalRecordCheckStatus: profile?.criminalRecordCheckStatus,
        tradeLicenseVerificationStatus: profile?.tradeLicenseVerificationStatus,
        serviceArea,
        externalGoogleReviewsUrl,
        externalFacebookReviewsUrl,
        externalWebsiteUrl,
      }),
    [
      hourlyRate,
      serviceArea,
      externalGoogleReviewsUrl,
      externalFacebookReviewsUrl,
      externalWebsiteUrl,
      profile?.insuranceCertUrl,
      profile?.insuranceVerified,
      profile?.identityVerificationStatus,
      profile?.criminalRecordCheckStatus,
      profile?.tradeLicenseVerificationStatus,
    ]
  );

  const bidReadyCompletion = useMemo(() => {
    const completedItems = bidReadyItems.filter((item) => item.completed).length;
    return Math.round((completedItems / bidReadyItems.length) * 100);
  }, [bidReadyItems]);

  const isBidReady = bidReadyItems.every((item) => item.completed);
  const missingBidReadyItems = bidReadyItems.filter((item) => !item.completed);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    updateProfile.mutate({
      bio: bio.trim() || undefined,
      categories: selectedCategories,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      serviceArea: serviceArea.trim() || undefined,
      externalGoogleReviewsUrl: externalGoogleReviewsUrl.trim() || undefined,
      externalFacebookReviewsUrl: externalFacebookReviewsUrl.trim() || undefined,
      externalWebsiteUrl: externalWebsiteUrl.trim() || undefined,
      tradeLicenseType: tradeLicenseType.trim() || undefined,
      tradeLicenseNumber: tradeLicenseNumber.trim() || undefined,
    });
  };

  const resetInsuranceFileInput = () => {
    if (insuranceFileInputRef.current) {
      insuranceFileInputRef.current.value = "";
    }
  };

  const resetIdentityFileInput = () => {
    if (identityFileInputRef.current) {
      identityFileInputRef.current.value = "";
    }
  };

  const resetCriminalRecordFileInput = () => {
    if (criminalRecordFileInputRef.current) {
      criminalRecordFileInputRef.current.value = "";
    }
  };

  const resetTradeLicenseFileInput = () => {
    if (tradeLicenseFileInputRef.current) {
      tradeLicenseFileInputRef.current.value = "";
    }
  };

  const resetProfileImageInput = () => {
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Upload request failed");
    }

    const data = await res.json();

    if (!data?.url) {
      throw new Error("Upload response missing file URL");
    }

    return data.url as string;
  };

  const openProfileImagePicker = () => {
    if (uploadingProfileImage || updateProfile.isPending) return;
    profileImageInputRef.current?.click();
  };

  const openInsuranceFilePicker = () => {
    if (uploadingInsurance || updateProfile.isPending) return;
    insuranceFileInputRef.current?.click();
  };

  const openIdentityFilePicker = () => {
    if (uploadingIdentity || updateProfile.isPending) return;
    identityFileInputRef.current?.click();
  };

  const openCriminalRecordFilePicker = () => {
    if (uploadingCriminalRecord || updateProfile.isPending) return;
    criminalRecordFileInputRef.current?.click();
  };

  const openTradeLicenseFilePicker = () => {
    if (uploadingTradeLicense || updateProfile.isPending) return;
    tradeLicenseFileInputRef.current?.click();
  };

  const validateVerificationFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      return false;
    }

    return true;
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image.");
      resetProfileImageInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be under 5MB.");
      resetProfileImageInput();
      return;
    }

    setUploadingProfileImage(true);

    try {
      const url = await uploadFile(file);

      await updateProfile.mutateAsync({
        profileImageUrl: url,
      });

      await utils.handymanProfiles.get.invalidate();
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Profile photo upload failed. Please try again.");
    } finally {
      setUploadingProfileImage(false);
      resetProfileImageInput();
    }
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file.");
      resetInsuranceFileInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      resetInsuranceFileInput();
      return;
    }

    setUploadingInsurance(true);

    try {
      const url = await uploadFile(file);

      await updateProfile.mutateAsync({
        insuranceCertUrl: url,
      });

      await utils.handymanProfiles.get.invalidate();
      toast.success("Insurance certificate uploaded and submitted for review.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingInsurance(false);
      resetInsuranceFileInput();
    }
  };

  const handleIdentityUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateVerificationFile(file)) {
      resetIdentityFileInput();
      return;
    }

    setUploadingIdentity(true);

    try {
      const url = await uploadFile(file);

      await updateProfile.mutateAsync({
        identityDocumentUrl: url,
      });

      await utils.handymanProfiles.get.invalidate();
      toast.success("ID uploaded for name-match review.");
    } catch {
      toast.error("ID upload failed. Please try again.");
    } finally {
      setUploadingIdentity(false);
      resetIdentityFileInput();
    }
  };

  const handleCriminalRecordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateVerificationFile(file)) {
      resetCriminalRecordFileInput();
      return;
    }

    setUploadingCriminalRecord(true);

    try {
      const url = await uploadFile(file);

      await updateProfile.mutateAsync({
        criminalRecordCheckUrl: url,
      });

      await utils.handymanProfiles.get.invalidate();
      toast.success("Criminal record check uploaded for review.");
    } catch {
      toast.error("Criminal record check upload failed. Please try again.");
    } finally {
      setUploadingCriminalRecord(false);
      resetCriminalRecordFileInput();
    }
  };

  const handleTradeLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateVerificationFile(file)) {
      resetTradeLicenseFileInput();
      return;
    }

    if (!tradeLicenseType.trim()) {
      toast.error("Add the licence type before uploading.");
      resetTradeLicenseFileInput();
      return;
    }

    setUploadingTradeLicense(true);

    try {
      const url = await uploadFile(file);

      await updateProfile.mutateAsync({
        tradeLicenseDocumentUrl: url,
        tradeLicenseType: tradeLicenseType.trim(),
        tradeLicenseNumber: tradeLicenseNumber.trim() || undefined,
      });

      await utils.handymanProfiles.get.invalidate();
      toast.success("Trade licence uploaded for review.");
    } catch {
      toast.error("Trade licence upload failed. Please try again.");
    } finally {
      setUploadingTradeLicense(false);
      resetTradeLicenseFileInput();
    }
  };

  if (loading || isLoading) {
    return (
      <AppLayout title="My Profile">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const insuranceState = !profile?.insuranceCertUrl
    ? "not_uploaded"
    : profile.insuranceVerified
    ? "verified"
    : "pending";

  const identityState = profile?.identityVerificationStatus ?? "not_submitted";
  const nameLocked = identityState === "approved";
  const criminalState = profile?.criminalRecordCheckStatus ?? "not_submitted";
  const tradeLicenseState = profile?.tradeLicenseVerificationStatus ?? "not_submitted";
  const goldShieldVerified = identityState === "approved" && criminalState === "reviewed";
  const hasExternalReviewLinks = Boolean(
    profile?.externalGoogleReviewsUrl || profile?.externalFacebookReviewsUrl || profile?.externalWebsiteUrl
  );

  return (
    <AppLayout title="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border/60">
                  {profile?.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt={`${user?.name ?? "Handyman"} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>

                {profile?.serviceArea && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{profile.serviceArea}</span>
                  </div>
                )}

                {hasExternalReviewLinks && (
                  <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
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

                <button
                  type="button"
                  onClick={openProfileImagePicker}
                  disabled={uploadingProfileImage || updateProfile.isPending}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm border-2 border-white disabled:opacity-60"
                  aria-label="Upload profile photo"
                >
                  {uploadingProfileImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>

                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
              </div>

              <div>
                <h2 className="font-semibold text-foreground text-lg">
                  {user?.name || "Add your full name"}
                </h2>

                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {profile?.rating && parseFloat(profile.rating) > 0 ? (
                    <StarRatingDisplay rating={parseFloat(profile.rating)} size="sm" showValue />
                  ) : (
                    <span className="text-xs text-muted-foreground">No ratings yet</span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {profile?.totalJobs ?? 0} jobs completed
                  </span>

                  {goldShieldVerified && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Gold Shield
                    </span>
                  )}

                  {profile?.identityVerificationStatus === "approved" && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ID Name Matched
                    </span>
                  )}

                  {profile?.criminalRecordCheckStatus === "reviewed" && (
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Criminal Check Reviewed
                    </span>
                  )}

                  {profile?.tradeLicenseVerificationStatus === "approved" && (
                    <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Licence Verified
                    </span>
                  )}

                  {profile?.insuranceVerified && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Insurance Verified
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openProfileImagePicker}
                  disabled={uploadingProfileImage || updateProfile.isPending}
                  className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <Camera className="w-3 h-3" />
                  {profile?.profileImageUrl ? "Change profile photo" : "Add profile photo"}
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Profile progress</p>
              <p className="text-2xl font-bold text-foreground">{bidReadyCompletion}%</p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  isBidReady ? "text-emerald-700" : "text-amber-700"
                )}
              >
                {isBidReady ? "Ready to bid" : "A few steps left"}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isBidReady ? "bg-emerald-600" : "bg-amber-500"
                )}
                style={{ width: `${bidReadyCompletion}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {bidReadyItems.map((item) => (
                <span
                  key={item.label}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border",
                    item.completed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}
                >
                  {item.completed ? "✓ " : ""}
                  {item.label}
                </span>
              ))}
            </div>

            {optionalTrustItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {optionalTrustItems.map((item) => (
                  <span
                    key={item.label}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border",
                      item.completed
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-muted text-muted-foreground border-border/60"
                    )}
                  >
                    {item.completed ? "✓ " : ""}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!isBidReady && (
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Almost ready to start bidding
                  </p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Add a few more profile details so homeowners know who they’re reviewing before choosing.
                    Still needed: {missingBidReadyItems.map((item) => item.label.toLowerCase()).join(", ")}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20 mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  What homeowners see when you bid
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  When you bid, homeowners can review your photo, name, bio, skills, service area,
                  badges, review links, rating, job history, and message. A stronger profile can
                  help your bid feel more credible.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              insuranceState === "verified"
                ? "bg-emerald-50 border border-emerald-200"
                : insuranceState === "pending"
                ? "bg-amber-50 border border-amber-200"
                : "bg-muted/40 border border-border/60"
            }`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                {insuranceState === "verified" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                )}

                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      insuranceState === "verified"
                        ? "text-emerald-800"
                        : insuranceState === "pending"
                        ? "text-amber-800"
                        : "text-foreground"
                    }`}
                  >
                    {insuranceState === "verified"
                      ? "Insurance Verified"
                      : insuranceState === "pending"
                      ? "Insurance Submitted for Review"
                      : "Insurance Certificate"}
                  </p>

                  <p
                    className={`text-xs ${
                      insuranceState === "verified"
                        ? "text-emerald-700"
                        : insuranceState === "pending"
                        ? "text-amber-700"
                        : "text-muted-foreground"
                    }`}
                  >
                    {insuranceState === "verified"
                      ? "Your insurance has been approved by admin and can help build homeowner trust."
                      : insuranceState === "pending"
                      ? "Your uploaded file is waiting for admin review."
                      : "Upload a PDF, JPG, or PNG under 5MB to submit it for admin review."}
                  </p>

                  {profile?.insuranceCertUrl && (
                    <a
                      href={profile.insuranceCertUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      View uploaded file
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <input
                  ref={insuranceFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleInsuranceUpload}
                />

                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={openInsuranceFilePicker}
                  disabled={uploadingInsurance || updateProfile.isPending}
                >
                  {uploadingInsurance ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {profile?.insuranceCertUrl ? "Replace File" : "Upload"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 mt-4">
            <div
              className={cn(
                "rounded-xl p-4 border",
                identityState === "approved"
                  ? "bg-blue-50 border-blue-200"
                  : identityState === "pending"
                  ? "bg-amber-50 border-amber-200"
                  : identityState === "rejected"
                  ? "bg-red-50 border-red-200"
                  : "bg-muted/40 border-border/60"
              )}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">ID Name Match</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Upload government ID so SaskHandy can confirm your profile name matches your ID.
                    This unlocks bidding and shows homeowners an ID Name Matched badge.
                  </p>

                  {profile?.identityDocumentUrl && (
                    <a
                      href={profile.identityDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      View uploaded ID
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <p className="text-xs font-medium mt-2 capitalize">
                    Status: {identityState.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="shrink-0">
                  <input
                    ref={identityFileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleIdentityUpload}
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={openIdentityFilePicker}
                    disabled={uploadingIdentity || updateProfile.isPending}
                  >
                    {uploadingIdentity ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {profile?.identityDocumentUrl ? "Replace ID" : "Upload ID"}
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-xl p-4 border",
                criminalState === "reviewed"
                  ? "bg-purple-50 border-purple-200"
                  : criminalState === "pending"
                  ? "bg-amber-50 border-amber-200"
                  : criminalState === "rejected"
                  ? "bg-red-50 border-red-200"
                  : "bg-muted/40 border-border/60"
              )}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Criminal Record Check Review
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Upload an official criminal record check document for SaskHandy admin review.
                    We only show “Criminal Check Reviewed” after the document is reviewed.
                  </p>

                  {profile?.criminalRecordCheckUrl && (
                    <a
                      href={profile.criminalRecordCheckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      View uploaded check
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <p className="text-xs font-medium mt-2 capitalize">
                    Status: {criminalState.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="shrink-0">
                  <input
                    ref={criminalRecordFileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleCriminalRecordUpload}
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={openCriminalRecordFilePicker}
                    disabled={uploadingCriminalRecord || updateProfile.isPending}
                  >
                    {uploadingCriminalRecord ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {profile?.criminalRecordCheckUrl ? "Replace Check" : "Upload Check"}
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-xl p-4 border",
                tradeLicenseState === "approved"
                  ? "bg-sky-50 border-sky-200"
                  : tradeLicenseState === "pending"
                  ? "bg-amber-50 border-amber-200"
                  : tradeLicenseState === "rejected"
                  ? "bg-red-50 border-red-200"
                  : "bg-muted/40 border-border/60"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Trade Licence Verification</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Optional for general handyman work. Use this if you have a trade-specific
                      licence, such as electrical, gas, plumbing, or another regulated service.
                    </p>

                    {profile?.tradeLicenseDocumentUrl && (
                      <a
                        href={profile.tradeLicenseDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        View uploaded licence
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <p className="text-xs font-medium mt-2 capitalize">
                      Status: {tradeLicenseState.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tradeLicenseType">Licence Type</Label>
                    <Input
                      id="tradeLicenseType"
                      placeholder="e.g., Electrical contractor"
                      value={tradeLicenseType}
                      onChange={(e) => setTradeLicenseType(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tradeLicenseNumber">Licence Number</Label>
                    <Input
                      id="tradeLicenseNumber"
                      placeholder="Optional"
                      value={tradeLicenseNumber}
                      onChange={(e) => setTradeLicenseNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <input
                    ref={tradeLicenseFileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleTradeLicenseUpload}
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={openTradeLicenseFilePicker}
                    disabled={uploadingTradeLicense || updateProfile.isPending}
                  >
                    {uploadingTradeLicense ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {profile?.tradeLicenseDocumentUrl ? "Replace Licence" : "Upload Licence"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 mt-4 bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-primary">Manual payouts</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              SaskHandy currently processes handyman payouts manually. Submit payout requests from
              the Earnings page before end of day Friday. Approved payouts are processed on
              Saturday.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">Edit Profile</h3>
            <p className="text-xs text-muted-foreground mt-1">
              These details help homeowners understand your skills, work style, and local experience before choosing a bid.
              Full name, profile photo, short bio, skills, and ID Name Matched approval unlock bidding.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Legal / Profile Name</Label>
            <Input
              id="fullName"
              placeholder="Your full legal name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={nameLocked}
              minLength={2}
            />
            <p className="text-xs text-muted-foreground">
              {nameLocked
                ? "Your name is locked because ID Name Matched has been approved. Contact SaskHandy support if your legal name needs to be corrected."
                : "Use the same name shown on your government ID so your ID Name Matched review is easier."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                id="serviceArea"
                placeholder="Example: Serving Silverwood Heights, Lawson Heights & nearby Saskatoon areas"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="pl-9"
                maxLength={500}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This helps homeowners quickly see where you work and whether you’re close enough for their job.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="externalGoogleReviewsUrl">Google Reviews Link</Label>
              <Input
                id="externalGoogleReviewsUrl"
                type="url"
                placeholder="https://..."
                value={externalGoogleReviewsUrl}
                onChange={(e) => setExternalGoogleReviewsUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalFacebookReviewsUrl">Facebook Reviews Link</Label>
              <Input
                id="externalFacebookReviewsUrl"
                type="url"
                placeholder="https://..."
                value={externalFacebookReviewsUrl}
                onChange={(e) => setExternalFacebookReviewsUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalWebsiteUrl">Website / Portfolio Link</Label>
              <Input
                id="externalWebsiteUrl"
                type="url"
                placeholder="https://..."
                value={externalWebsiteUrl}
                onChange={(e) => setExternalWebsiteUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">External reviews</p>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Add Google, Facebook, or portfolio links if you already have reviews outside SaskHandy.
                  These will be labelled as external review sources until you build on-platform reviews.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              placeholder="Example: I help with small repairs, furniture assembly, yard work, and general home maintenance. I’m reliable, detail-oriented, and clear with communication."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="resize-none"
            />

            <div className="flex items-center justify-between gap-3 text-xs">
              <p className={cn(bio.trim().length >= 25 ? "text-emerald-700" : "text-amber-700")}>
                {bio.trim().length >= 25
                  ? "Bio looks good."
                  : "Write at least 25 characters so homeowners know what you do."}
              </p>
              <p className="text-muted-foreground">{bio.trim().length}/25 minimum</p>
            </div>

            <div className="bg-muted/40 border border-border/50 rounded-xl p-4">
              <p className="text-xs font-medium text-foreground mb-2">Bio tips</p>
              <div className="space-y-1.5">
                {bioTips.map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Service Categories</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose every type of job you are comfortable bidding on.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    )}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate</Label>
            <div className="relative max-w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="rate"
                type="number"
                min="0"
                step="5"
                placeholder="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="pl-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                /hr
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              This helps homeowners understand your typical rate, but you can still bid differently
              for each job.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={
              updateProfile.isPending ||
              uploadingInsurance ||
              uploadingIdentity ||
              uploadingCriminalRecord ||
              uploadingTradeLicense ||
              uploadingProfileImage
            }
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Profile
          </Button>
        </div>

        {reviews && reviews.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-foreground">Reviews ({reviews.length})</h3>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border/40 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {review.reviewerName ?? "User"}
                    </span>
                    <StarRatingDisplay rating={review.rating} size="sm" />
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 text-center">
            <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold text-foreground mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Reviews will appear here after completed jobs. Clear communication and reliable work
              can help you earn stronger reviews over time.
            </p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-destructive/30 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                You can delete your account only if you have no active jobs, pending bids, open
                disputes, pending payouts, pending payments, or available payout balance.
              </p>

              {accountDeletionStatus && !accountDeletionStatus.canDelete && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Account deletion is currently blocked
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-amber-800 space-y-1">
                    {accountDeletionStatus.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 space-y-2 max-w-md">
                <Label htmlFor="deleteConfirmation">Type DELETE to confirm</Label>
                <Input
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  disabled={deleteMyAccount.isPending}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteMyAccount.isPending ||
                    deleteConfirmation !== "DELETE" ||
                    accountDeletionStatus?.canDelete === false
                  }
                >
                  {deleteMyAccount.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete My Account
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetchAccountDeletionStatus()}
                  disabled={deleteMyAccount.isPending}
                >
                  Check Eligibility
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}