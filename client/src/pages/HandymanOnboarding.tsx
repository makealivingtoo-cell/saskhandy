import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { JOB_CATEGORIES } from "@shared/constants";
import { CheckCircle, Hammer, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function HandymanOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [bio, setBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");

  const createProfile = trpc.handymanProfiles.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("Profile created! Welcome to SaskHandy.");
      navigate("/handyman/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one service category.");
      return;
    }
    createProfile.mutate({
      bio: bio.trim() || undefined,
      categories: selectedCategories,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hammer className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif text-foreground mb-2">Set Up Your Profile</h1>
          <p className="text-muted-foreground">
            Tell homeowners about your skills and experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-8">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              About You <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="bio"
              placeholder="e.g., 15 years of plumbing experience. Licensed and insured. Available weekdays and weekends."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Service Categories <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Select all that apply to your skills.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {JOB_CATEGORIES.map((cat) => {
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
                        : "border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate" className="text-sm font-medium">
              Hourly Rate <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="relative">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/hr</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This is for reference only. Actual job prices are set in your bids.
            </p>
          </div>

          {/* Insurance Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-1">Insurance Verification</p>
            <p className="text-xs text-amber-700">
              You'll be able to upload your insurance certificate from your profile settings. Verified handymen get priority placement in search results.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createProfile.isPending || selectedCategories.length === 0}
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Create My Profile & Start Bidding"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can update your profile anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
