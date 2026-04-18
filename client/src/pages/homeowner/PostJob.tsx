import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import MapView from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { JOB_CATEGORIES } from "@shared/constants";
import { ArrowLeft, Loader2, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function PostJob() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [roughIdea, setRoughIdea] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "homeowner" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

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
    onSuccess: ({ jobId }) => {
      toast.success("Job posted! Handymen can now bid on your job.");
      navigate(`/jobs/${jobId}`);
    },
    onError: (err) => toast.error(err.message),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
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

    createJob.mutate({
      title,
      description,
      category,
      location,
      budgetMin: min,
      budgetMax: max,
    });
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
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </div>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-serif text-foreground mb-1">Post a New Job</h1>
          <p className="text-muted-foreground text-sm">
            Describe your project and receive competitive bids from verified handymen.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">AI Job Post Assistant</h2>
          </div>

          <div className="space-y-2">
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

          <Button
            type="button"
            variant="outline"
            onClick={handleImprove}
            disabled={improveJobPost.isPending}
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

          {followUpQuestions.length > 0 && (
            <div className="bg-white rounded-xl border border-border/60 p-4">
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
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6"
        >
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
              placeholder="Describe the work needed in detail. Include any relevant information about the problem, materials needed, or access requirements."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={5}
              className="resize-none"
            />
          </div>

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
              placeholder="e.g., 123 Main St, Saskatoon, SK"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              minLength={2}
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              A live map preview will appear below so you can confirm the area.
            </div>
          </div>

          <MapView
            locationQuery={location}
            title="Location Preview"
            heightClassName="h-[260px]"
          />

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
                  min="10"
                  step="10"
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
                  step="10"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Set a realistic range to attract quality bids. Handymen will bid within or near this
              range.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-primary mb-1">How Payment Works</p>
            <p className="text-xs text-muted-foreground">
              Payment is only charged when you accept a bid. Funds are held in escrow and released
              to the handyman only after you confirm the work is complete.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={createJob.isPending}>
            {createJob.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting Job...
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