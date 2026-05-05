import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Lightbulb,
  Loader2,
  Plus,
  Share2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border/60 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const homeownerNotes = [
  "Small jobs are easier to handle before they turn into bigger repairs.",
  "Clear job details and photos can help you get better bids from local handymen.",
  "You stay in control — compare bids, review profiles, and choose who feels right.",
  "A quick post today can move one home task off your list this week.",
  "Local help works best when the job is clear, specific, and easy to understand.",
];

const jobIdeas = [
  "TV mounting",
  "Furniture assembly",
  "Yard cleanup",
  "Small plumbing fixes",
  "Drywall patching",
  "Painting touch-ups",
  "Door or cabinet repairs",
  "General home help",
];

function getDailyNote(name?: string | null) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const seed = `${todayKey}-${name ?? "homeowner"}`;

  let total = 0;
  for (let i = 0; i < seed.length; i += 1) {
    total += seed.charCodeAt(i);
  }

  return homeownerNotes[total % homeownerNotes.length];
}

export default function HomeownerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: jobs, isLoading } = trpc.jobs.getByHomeowner.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "homeowner" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const openJobs = jobs?.filter((j) => j.status === "open") ?? [];
  const activeJobs = jobs?.filter((j) => j.status === "in_progress") ?? [];
  const completedJobs = jobs?.filter((j) => j.status === "completed") ?? [];

  const dailyNote = useMemo(() => getDailyNote(user?.name), [user?.name]);

  const handleShare = async () => {
    const shareData = {
      title: "SaskHandy",
      text: "Need help with a small home job? Post it on SaskHandy and get bids from local handymen.",
      url: "https://saskhandy.com",
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("SaskHandy link copied.");
        return;
      }

      toast.info("Share this link: https://saskhandy.com");
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (loading || isLoading) {
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
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-foreground">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 17
                ? "afternoon"
                : "evening"}
              , {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Here's an overview of your jobs.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share SaskHandy
            </Button>

            <Button asChild>
              <Link href="/post-job">
                <Plus className="w-4 h-4 mr-2" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Today’s homeowner note</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{dailyNote}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Open Jobs"
            value={openJobs.length}
            icon={Briefcase}
            color="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="In Progress"
            value={activeJobs.length}
            icon={Clock}
            color="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Completed"
            value={completedJobs.length}
            icon={Star}
            color="bg-amber-50 text-amber-600"
          />

          <StatCard
            label="Total Jobs"
            value={jobs?.length ?? 0}
            icon={Briefcase}
            color="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">What happens next?</h2>
            </div>

            <div className="space-y-3">
              {[
                "Post your job with clear details and location.",
                "Local handymen review the job and send bids.",
                "You compare price, message, profile, and availability.",
                "Payment is held securely until you mark the job complete.",
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">What can you post?</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Small home jobs are perfect for SaskHandy. Here are a few examples:
            </p>

            <div className="flex flex-wrap gap-2">
              {jobIdeas.map((idea) => (
                <span
                  key={idea}
                  className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                >
                  {idea}
                </span>
              ))}
            </div>
          </div>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>

            <h3 className="font-semibold text-foreground mb-2">No jobs posted yet</h3>

            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
              Post your first small home job and let local handymen send you bids. Clear details and
              photos can help you get better responses.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {jobIdeas.slice(0, 5).map((idea) => (
                <span
                  key={`empty-${idea}`}
                  className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full"
                >
                  {idea}
                </span>
              ))}
            </div>

            <Button asChild>
              <Link href="/post-job">
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Your Jobs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Open jobs are visible to handymen. Review bids when they come in.
                </p>
              </div>
            </div>

            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                        <StatusBadge status={job.status} />
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="bg-secondary px-2 py-0.5 rounded-full">
                          {job.category}
                        </span>
                        <span>{job.location}</span>
                        <span>
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-foreground">
                        ${job.budgetMin}–${job.budgetMax}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">budget</div>

                      {job.status === "open" && (
                        <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Live
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}