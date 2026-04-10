import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { JOB_CATEGORIES } from "@shared/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function PostJob() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const createJob = trpc.jobs.create.useMutation({
    onSuccess: ({ jobId }) => {
      toast.success("Job posted! Handymen can now bid on your job.");
      navigate(`/jobs/${jobId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { toast.error("Please select a category."); return; }
    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) { toast.error("Please enter a valid budget range."); return; }
    if (min > max) { toast.error("Minimum budget cannot exceed maximum."); return; }

    createJob.mutate({ title, description, category, location, budgetMin: min, budgetMax: max });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back */}
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

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="e.g., Fix leaky kitchen faucet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
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

          {/* Category */}
          <div className="space-y-2">
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
            <Input
              id="location"
              placeholder="e.g., 123 Main St, Saskatoon, SK"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              minLength={2}
            />
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label>Budget Range <span className="text-destructive">*</span></Label>
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
            <p className="text-xs text-muted-foreground">
              Set a realistic range to attract quality bids. Handymen will bid within or near this range.
            </p>
          </div>

          {/* Escrow note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-primary mb-1">How Payment Works</p>
            <p className="text-xs text-muted-foreground">
              Payment is only charged when you accept a bid. Funds are held in escrow and released to the handyman only after you confirm the work is complete.
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
