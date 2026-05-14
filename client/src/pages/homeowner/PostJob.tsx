import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import MapView from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { JOB_CATEGORIES } from "@shared/constants";
import {
  ArrowLeft,
  CheckCircle,
  Lightbulb,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type SelectedPhoto = {
  file: File;
  previewUrl: string;
};

const jobExamples = [
  "Mount a TV",
  "Fix a leaky faucet",
  "Assemble furniture",
  "Patch drywall",
  "Yard cleanup",
  "Paint touch-ups",
];

function getJobStrength({
  title,
  description,
  category,
  location,
  budgetMin,
  budgetMax,
  photosCount,
}: {
  title: string;
  description: string;
  category: string;
  location: string;
  budgetMin: string;
  budgetMax: string;
  photosCount: number;
}) {
  let score = 0;

  if (title.trim().length >= 3) score += 15;
  if (description.trim().length >= 40) score += 25;
  if (category) score += 15;
  if (location.trim().length >= 2) score += 15;
  if (budgetMin && budgetMax) score += 15;
  if (photosCount > 0) score += 15;

  if (score >= 85) {
    return {
      score,
      label: "Strong",
      message: "This looks clear and ready for handymen to bid on.",
    };
  }

  if (score >= 60) {
    return {
      score,
      label: "Good",
      message: "This is good. Adding more detail or photos could help you get better bids.",
    };
  }

  return {
    score,
    label: "Needs detail",
    message: "Add more details so handymen can understand the job and bid accurately.",
  };
}

export default function PostJob() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [roughIdea, setRoughIdea] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "homeowner" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  const jobStrength = useMemo(
    () =>
      getJobStrength({
        title,
        description,
        category,
        location,
        budgetMin,
        budgetMax,
        photosCount: photos.length,
      }),
    [title, description, category, location, budgetMin, budgetMax, photos.length]
  );

  const improveJobPost = trpc.system.improveJobPost.useMutation({
    onSuccess: (data) => {
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setBudgetMin(String(data.budgetMin));
      setBudgetMax(String(data.budgetMax));
      setFollowUpQuestions(data.followUpQuestions ?? []);
      toast.success("Job post improved with AI.");
    },
    onError: (err) => {
      toast.error(err.message || "AI assistant failed. Please try again.");
    },
  });

  const createJob = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job posted. ID-matched handymen can now review it and send bids.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImprove = () => {
    if (!roughIdea.trim() || roughIdea.trim().length < 10) {
      toast.error("Please describe the job in a bit more detail first.");
      return;
    }

    improveJobPost.mutate({
      roughIdea: roughIdea.trim(),
      location: location.trim() || undefined,
    });
  };

  const handleUseExample = (example: string) => {
    setRoughIdea((prev) => {
      if (prev.trim()) return prev;
      return `I need help with ${example.toLowerCase()} at my home.`;
    });
  };

  const handleOpenFilePicker = () => {
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    fileInputRef.current?.click();
  };

  const handlePhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_PHOTOS - photos.length;

    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`);
      resetFileInput();
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const validPhotos: SelectedPhoto[] = [];

    for (const file of filesToAdd) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, or WEBP images are allowed.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: file must be under ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      validPhotos.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added.`);
    }

    if (validPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...validPhotos]);
    }

    resetFileInput();
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const removed = next[index];

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      next.splice(index, 1);
      return next;
    });
  };

  const uploadPhoto = async (file: File) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      toast.error("Please enter a valid budget range.");
      return;
    }

    if (min > max) {
      toast.error("Minimum budget cannot exceed maximum.");
      return;
    }

    try {
      setUploadingPhotos(true);

      let uploadedPhotoUrls: string[] = [];

      if (photos.length > 0) {
        uploadedPhotoUrls = await Promise.all(photos.map((photo) => uploadPhoto(photo.file)));
      }

      createJob.mutate({
        title,
        description,
        category,
        location,
        photos: uploadedPhotoUrls,
        budgetMin: min,
        budgetMax: max,
      });
    } catch (error) {
      toast.error("Photo upload failed. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  if (loading) {
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
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </div>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-serif text-foreground mb-1">Post a New Job</h1>
          <p className="text-muted-foreground text-sm">
            Share the details once, then compare bids, profiles, trust badges, and messages from local handymen.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-6">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-semibold text-foreground text-sm">AI Job Post Assistant</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Start with a rough idea. The assistant can turn it into a clearer title,
                  description, category, and budget range.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="roughIdea">Describe the job in your own words</Label>
              <Textarea
                id="roughIdea"
                placeholder="e.g., My kitchen sink has been leaking under the cabinet for two days and I need someone this week to check it and fix it."
                value={roughIdea}
                onChange={(e) => setRoughIdea(e.target.value)}
                rows={4}
                className="resize-none bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {jobExamples.slice(0, 4).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleUseExample(example)}
                  className="text-xs bg-white border border-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/5 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleImprove}
              disabled={improveJobPost.isPending}
              className="mt-4"
            >
              {improveJobPost.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Improve with AI
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">A strong job post includes</h2>
            </div>

            <div className="space-y-3">
              {[
                "What needs to be done",
                "Where the job is located",
                "Photos of the issue or area",
                "A realistic budget range",
                "Any timing or access details",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-emerald-950 text-sm">
                SaskHandy Safety & Payment Protection
              </h2>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                After your job is posted, review each handyman’s profile photo, service area, bio,
                skills, reviews, external review links, and verification badges before choosing.
                You can message handymen first if you are unsure.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 mt-4">
                <div className="rounded-xl bg-white border border-emerald-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <p className="text-xs font-semibold text-emerald-950">ID Name Matched</p>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Handymen need approved ID Name Matched status before bidding.
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-emerald-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <p className="text-xs font-semibold text-emerald-950">Payment held securely</p>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Payment is held through SaskHandy and released only after you mark the job complete.
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-emerald-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <p className="text-xs font-semibold text-emerald-950">Message first</p>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Ask about experience, availability, materials, and past work before choosing.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-emerald-700 mt-3 leading-relaxed">
                Verification badges help you review trust signals, but they do not guarantee safety
                or replace your own judgment.
              </p>
            </div>
          </div>
        </div>

        {followUpQuestions.length > 0 && (
          <div className="bg-white rounded-xl border border-border/60 p-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-2">
              Add these details if you know them
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              You can include any of these answers in the description below to help handymen
              understand the job better and give more accurate bids.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {followUpQuestions.map((question, index) => (
                <li key={`${question}-${index}`} className="leading-relaxed">
                  {index + 1}. {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="bg-muted/40 border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Job post strength</p>
                <p className="text-xs text-muted-foreground mt-0.5">{jobStrength.message}</p>
              </div>

              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {jobStrength.label}
              </span>
            </div>

            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${jobStrength.score}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Fix leaky kitchen faucet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the work needed in detail. Include what is happening, when it started, access details, and anything the handyman should know."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              More detail helps handymen send better bids.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Saskatoon, SK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            A live map preview will appear below so you can confirm the area.
          </div>

          <MapView locationQuery={location} title="Location Preview" heightClassName="h-[260px]" />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Photos</Label>
              <span className="text-xs text-muted-foreground">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoSelection}
            />

            <div className="border border-dashed border-border rounded-xl p-4 bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Add photos if you can</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Photos help handymen understand the job and bid more accurately.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenFilePicker}
                  disabled={photos.length >= MAX_PHOTOS || createJob.isPending || uploadingPhotos}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={`${photo.file.name}-${index}`}
                    className="relative rounded-xl overflow-hidden border border-border/60 bg-muted"
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Job upload ${index + 1}`}
                      className="w-full h-28 object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Budget Range <span className="text-destructive">*</span>
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Set a realistic range to attract quality bids. Handymen can still submit their own
              price.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">How payment protection works</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Payment is only charged when you accept a bid. Funds are held securely through
                  SaskHandy and released to the handyman only after you confirm the work is complete.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createJob.isPending || uploadingPhotos}
          >
            {createJob.isPending || uploadingPhotos ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadingPhotos ? "Uploading Photos..." : "Posting Job..."}
              </>
            ) : (
              "Post Job & Receive Bids"
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}