import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingDisplay } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2, Save, Shield, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function HandymanProfile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.handymanProfiles.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: reviews } = trpc.reviews.getForUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const { data: categories = [] } = trpc.jobs.categories.useQuery();

  const [bio, setBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setBio(profile.bio ?? "");
      try {
        const cats = JSON.parse(profile.categories ?? "[]");
        setSelectedCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setSelectedCategories([]);
      }
      setHourlyRate(profile.hourlyRate ? String(parseFloat(profile.hourlyRate)) : "");
    }
  }, [profile]);

  const updateProfile = trpc.handymanProfiles.createOrUpdate.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated.");
      await utils.handymanProfiles.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

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
    });
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      await updateProfile.mutateAsync({ insuranceCertUrl: url });
      toast.success("Insurance certificate uploaded.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
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

  return (
    <AppLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg">{user?.name}</h2>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {profile?.rating && parseFloat(profile.rating) > 0 ? (
                  <StarRatingDisplay rating={parseFloat(profile.rating)} size="sm" showValue />
                ) : (
                  <span className="text-xs text-muted-foreground">No ratings yet</span>
                )}
                <span className="text-xs text-muted-foreground">{profile?.totalJobs ?? 0} jobs</span>
                {profile?.verified && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg p-4 ${
              profile?.insuranceCertUrl
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {profile?.insuranceCertUrl ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Shield className="w-4 h-4 text-amber-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      profile?.insuranceCertUrl ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {profile?.insuranceCertUrl ? "Insurance Uploaded" : "Insurance Certificate"}
                  </p>
                  <p
                    className={`text-xs ${
                      profile?.insuranceCertUrl ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {profile?.insuranceCertUrl
                      ? "Your certificate is on file."
                      : "Upload to strengthen trust with homeowners."}
                  </p>
                </div>
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleInsuranceUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className={profile?.insuranceCertUrl ? "border-emerald-300" : "border-amber-300"}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {profile?.insuranceCertUrl ? "Replace" : "Upload"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-foreground">Edit Profile</h3>

          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              placeholder="Describe your experience, skills, and what makes you a strong choice..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label>Service Categories</Label>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
          </div>

          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {reviews && reviews.length > 0 && (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-4">Reviews ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border/40 last:border-0 pb-4 last:pb-0">
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
        )}
      </div>
    </AppLayout>
  );
}