import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  formatJobTiming,
  JOB_TIMING_PREFERENCE_LABELS,
  JOB_TIMING_PREFERENCE_VALUES,
  type JobTimingPreference,
} from "@shared/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

function getTodayDateInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function EditJob() {
  const { isAuthenticated, user, loading } = useAuth();
  const { id } = useParams();
  const jobId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: job, isLoading: jobLoading } = trpc.jobs.getById.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const { data: categories = [] } = trpc.jobs.categories.useQuery();

  const { data: bids = [] } = trpc.bids.getForJob.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [timingPreference, setTimingPreference] = useState<JobTimingPreference | "">("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredEndDate, setPreferredEndDate] = useState("");

  useEffect(() => {
    if (job) {
      setTitle(job.title ?? "");
      setDescription(job.description ?? "");
      setCategory(job.category ?? "");
      setLocation(job.location ?? "");
      setBudgetMin(job.budgetMin?.toString() ?? "");
      setBudgetMax(job.budgetMax?.toString() ?? "");
      setTimingPreference((job.timingPreference as JobTimingPreference | null) ?? "");
      setPreferredStartDate(job.preferredStartDate ?? "");
      setPreferredEndDate(job.preferredEndDate ?? "");
    }
  }, [job]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "homeowner" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const canEdit = useMemo(() => {
    if (!job) return false;
    if (job.status !== "open") return false;
    if (job.selectedBidId || job.selectedHandymanId) return false;
    return true;
  }, [job]);

  const updateJob = trpc.jobs.update.useMutation({
    onSuccess: async () => {
      toast.success("Job updated successfully.");
      await utils.jobs.getById.invalidate({ jobId });
      await utils.jobs.getByHomeowner.invalidate();
      navigate(`/jobs/${jobId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error("This job can no longer be edited.");
      return;
    }

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

    if (timingPreference === "date_range") {
      if (!preferredStartDate || !preferredEndDate) {
        toast.error("Choose both dates for your preferred job window.");
        return;
      }

      if (preferredStartDate < getTodayDateInputValue()) {
        toast.error("The start date must be today or later.");
        return;
      }

      if (preferredEndDate < preferredStartDate) {
        toast.error("The end date must be the same as or later than the start date.");
        return;
      }
    }

    updateJob.mutate({
      jobId,
      title,
      description,
      category,
      location,
      budgetMin: min,
      budgetMax: max,
      timingPreference: timingPreference || null,
      preferredStartDate: timingPreference === "date_range" ? preferredStartDate : null,
      preferredEndDate: timingPreference === "date_range" ? preferredEndDate : null,
    });
  };

  if (loading || jobLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Job not found.</div>
      </AppLayout>
    );
  }

  if (!canEdit) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Link href={`/jobs/${jobId}`}>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
              <ArrowLeft className="w-4 h-4" />
              Back to Job
            </div>
          </Link>

          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">This job can’t be edited</h1>
            <p className="text-sm text-muted-foreground">
              Jobs can only be edited while they are open and before a bid has been accepted.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link href={`/jobs/${jobId}`}>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Job
          </div>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-serif text-foreground mb-1">Edit Job</h1>
          <p className="text-muted-foreground text-sm">
            Update your job details while it is still open.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Budget Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="1"
                  step="10"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <Label htmlFor="timing-preference">When would you like the job done?</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional. A rough timeframe helps handymen know if they can fit it in.
              </p>
            </div>
            <Select
              value={timingPreference}
              onValueChange={(value) => {
                const nextPreference = value as JobTimingPreference;
                setTimingPreference(nextPreference);
                if (nextPreference !== "date_range") {
                  setPreferredStartDate("");
                  setPreferredEndDate("");
                }
              }}
            >
              <SelectTrigger id="timing-preference" className="bg-white">
                <SelectValue placeholder="Choose a timeframe (optional)" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TIMING_PREFERENCE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {JOB_TIMING_PREFERENCE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {timingPreference && (
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setTimingPreference("");
                  setPreferredStartDate("");
                  setPreferredEndDate("");
                }}
              >
                Clear timing
              </button>
            )}

            {timingPreference === "date_range" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="preferred-start-date">From</Label>
                  <Input
                    id="preferred-start-date"
                    type="date"
                    min={getTodayDateInputValue()}
                    value={preferredStartDate}
                    onChange={(event) => setPreferredStartDate(event.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred-end-date">To</Label>
                  <Input
                    id="preferred-end-date"
                    type="date"
                    min={preferredStartDate || getTodayDateInputValue()}
                    value={preferredEndDate}
                    onChange={(event) => setPreferredEndDate(event.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={updateJob.isPending}>
            {updateJob.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
