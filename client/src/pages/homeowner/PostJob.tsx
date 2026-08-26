import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
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
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DRAFT_STORAGE_KEY = "saskhandy-post-job-draft-v1";

type SelectedPhoto = {
  file: File;
  previewUrl: string;
};

type Step = 1 | 2 | 3;

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
      message: "Clear and ready for handymen to bid on.",
    };
  }

  if (score >= 60) {
    return {
      score,
      label: "Good",
      message: "Almost there. A little more detail or a photo can help.",
    };
  }

  return {
    score,
    label: "Needs detail",
    message: "Add a few more details so handymen can bid accurately.",
  };
}

export default function PostJob() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoUrlsRef = useRef<Set<string>>(new Set());
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [step, setStep] = useState<Step>(1);
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
    try {
      const idea = new URLSearchParams(window.location.search).get("idea");
      if (idea) {
        setRoughIdea(`I need help with ${idea.toLowerCase()} at my home.`);
        setDraftHydrated(true);
        return;
      }

      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) {
        setDraftHydrated(true);
        return;
      }

      const draft = JSON.parse(saved) as Partial<{
        roughIdea: string;
        title: string;
        description: string;
        category: string;
        location: string;
        budgetMin: string;
        budgetMax: string;
      }>;

      setRoughIdea(draft.roughIdea ?? "");
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setCategory(draft.category ?? "");
      setLocation(draft.location ?? "");
      setBudgetMin(draft.budgetMin ?? "");
      setBudgetMax(draft.budgetMax ?? "");
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;

    const hasDraft =
      roughIdea.trim() ||
      title.trim() ||
      description.trim() ||
      category ||
      location.trim() ||
      budgetMin ||
      budgetMax;

    if (!hasDraft) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        roughIdea,
        title,
        description,
        category,
        location,
        budgetMin,
        budgetMax,
      })
    );
  }, [draftHydrated, roughIdea, title, description, category, location, budgetMin, budgetMax]);

  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      photoUrlsRef.current.clear();
    };
  }, []);

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

  const improveJobPost = trpc.system.improveJobPost.useMutation();

  const createJob = trpc.jobs.create.useMutation({
    onSuccess: () => {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Job posted. Local handymen can now review it and send bids.");
      navigate("/dashboard");
    },
  });

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const buildWithAi = async () => {
    if (roughIdea.trim().length < 10) {
      toast.error("Tell us a little more about the job first.");
      return;
    }

    if (location.trim().length < 2) {
      toast.error("Add the city or area where the job is located.");
      return;
    }

    try {
      const data = await improveJobPost.mutateAsync({
        roughIdea: roughIdea.trim(),
        location: location.trim(),
      });

      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setBudgetMin(data.budgetMin == null ? "" : String(data.budgetMin));
      setBudgetMax(data.budgetMax == null ? "" : String(data.budgetMax));
      setFollowUpQuestions(data.followUpQuestions ?? []);
      setStep(2);
      toast.success(
        data.budgetMin == null
          ? "Draft ready. We left anything you didn't provide blank."
          : "Draft ready. We only used the budget you provided."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI assistant failed. Please try again.");
    }
  };

  const handleUseExample = (example: string) => {
    setRoughIdea(`I need help with ${example.toLowerCase()} at my home.`);
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

    if (selectedFiles.length === 0) return;

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

      const previewUrl = URL.createObjectURL(file);
      photoUrlsRef.current.add(previewUrl);
      validPhotos.push({ file, previewUrl });
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
        photoUrlsRef.current.delete(removed.previewUrl);
      }

      next.splice(index, 1);
      return next;
    });
  };

  const validateDetails = () => {
    if (title.trim().length < 3) {
      toast.error("Add a short job title.");
      return false;
    }

    if (description.trim().length < 10) {
      toast.error("Add a little more detail about the job.");
      return false;
    }

    if (!category) {
      toast.error("Select a category.");
      return false;
    }

    if (location.trim().length < 2) {
      toast.error("Add the city or area where the job is located.");
      return false;
    }

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);

    if (Number.isNaN(min) || Number.isNaN(max) || min <= 0 || max <= 0) {
      toast.error("Enter a valid budget range.");
      return false;
    }

    if (min > max) {
      toast.error("Minimum budget cannot be higher than maximum.");
      return false;
    }

    return true;
  };

  const goToReview = () => {
    if (!validateDetails()) return;
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleSubmit = async () => {
    if (!validateDetails()) {
      setStep(2);
      return;
    }

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);

    try {
      setUploadingPhotos(true);

      const uploadedPhotoUrls =
        photos.length > 0 ? await Promise.all(photos.map((photo) => uploadPhoto(photo.file))) : [];

      await createJob.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        photos: uploadedPhotoUrls,
        budgetMin: min,
        budgetMax: max,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post the job. Please try again.");
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

  const isBusy = improveJobPost.isPending || createJob.isPending || uploadingPhotos;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href="/dashboard">
            <div className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </div>
          </Link>
          <span className="text-xs text-muted-foreground">Draft saves automatically</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-serif text-foreground">Post a job</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what you need. You can review everything before it goes live.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {[
            { number: 1, label: "Describe" },
            { number: 2, label: "Details" },
            { number: 3, label: "Review" },
          ].map((item) => {
            const active = step === item.number;
            const complete = step > item.number;

            return (
              <div key={item.number} className="min-w-0">
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      active || complete ? "w-full bg-primary" : "w-0 bg-primary"
                    )}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      active || complete
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : item.number}
                  </div>
                  <span
                    className={cn(
                      "truncate text-xs",
                      active ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">What do you need help with?</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Write it naturally. SaskHandy can turn your note into a clean job post.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  AI only cleans up what you provide. It won&apos;t guess your budget, timing, materials, or other missing details.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roughIdea">Describe the job</Label>
              <Textarea
                id="roughIdea"
                autoFocus
                placeholder="My kitchen sink is leaking under the cabinet. I need someone to check it and fix the leak this week."
                value={roughIdea}
                onChange={(e) => setRoughIdea(e.target.value)}
                rows={6}
                className="resize-none text-base"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {jobExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleUseExample(example)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="quick-location">City or area</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="quick-location"
                  placeholder="Saskatoon, SK"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              onClick={buildWithAi}
              disabled={improveJobPost.isPending}
            >
              {improveJobPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building your post...
                </>
              ) : (
                <>
                  Build my job post
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              I’ll fill in the details myself
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {followUpQuestions.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Helpful details, if you know them</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add any answers that matter to the description. You can skip what you don’t know.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {followUpQuestions.map((question) => (
                        <span
                          key={question}
                          className="rounded-lg border border-primary/15 bg-white px-2.5 py-1.5 text-xs text-muted-foreground"
                        >
                          {question}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">Job details</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Edit anything before you continue.</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {jobStrength.label}
                </span>
              </div>

              <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${jobStrength.score}%` }}
                />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Job title</Label>
                  <Input
                    id="title"
                    placeholder="Fix leaky kitchen faucet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what needs to be done and anything useful to know."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{jobStrength.message}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
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
                    <Label htmlFor="location">City or area</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="Saskatoon, SK"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Photos</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Optional, but photos usually help you get better bids.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{photos.length}/{MAX_PHOTOS}</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelection}
                  />

                  {photos.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/25 px-4 py-7 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      <ImagePlus className="h-5 w-5" />
                      Add job photos
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {photos.map((photo, index) => (
                          <div
                            key={`${photo.file.name}-${index}`}
                            className="relative overflow-hidden rounded-xl border border-border/60 bg-muted"
                          >
                            <img
                              src={photo.previewUrl}
                              alt={`Job upload ${index + 1}`}
                              className="h-28 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-transform active:scale-90"
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {photos.length < MAX_PHOTOS && (
                        <Button type="button" variant="outline" onClick={handleOpenFilePicker}>
                          <Upload className="mr-2 h-4 w-4" />
                          Add more photos
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Budget range</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="decimal"
                        placeholder="Min"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="decimal"
                        placeholder="Max"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Handymen can still send their own price.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="flex-[1.6]" onClick={goToReview}>
                Review job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">Ready to post?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Here’s exactly what local handymen will see.</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{category}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="mt-1 font-semibold text-foreground">${budgetMin}–${budgetMax}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Photos</p>
                    <p className="mt-1 font-semibold text-foreground">{photos.length || "None"}</p>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((photo, index) => (
                      <img
                        key={`review-${photo.previewUrl}`}
                        src={photo.previewUrl}
                        alt={`Job preview ${index + 1}`}
                        className="h-20 w-24 shrink-0 rounded-lg border border-border/60 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">Free to post. Pay only after choosing a bid.</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                    Compare profiles, bids and messages first. When you accept a bid, payment is held securely and released after you mark the job complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isBusy}>
                Edit
              </Button>
              <Button type="button" size="lg" className="flex-[1.7]" onClick={handleSubmit} disabled={isBusy}>
                {createJob.isPending || uploadingPhotos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingPhotos ? "Uploading..." : "Posting..."}
                  </>
                ) : (
                  "Post job & receive bids"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
