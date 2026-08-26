import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  Hammer,
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
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
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

function postJobHref(idea: string) {
  return `/post-job?idea=${encodeURIComponent(idea)}`;
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
  const hasJobs = (jobs?.length ?? 0) > 0;

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            <p className="mt-0.5 text-sm text-muted-foreground">
              {hasJobs ? "Here’s what’s happening with your jobs." : "What can we help you get done?"}
            </p>
          </div>

          {hasJobs && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share SaskHandy
              </Button>

              <Button asChild>
                <Link href="/post-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Post a Job
                </Link>
              </Button>
            </div>
          )}
        </div>

        {!hasJobs ? (
          <>
            <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-emerald-50 shadow-sm">
              <div className="p-6 sm:p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Hammer className="h-6 w-6" />
                </div>

                <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Get one home task off your list today.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Pick a common job below or describe your own. Posting is free, and you review bids before choosing anyone.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {jobIdeas.map((idea) => (
                    <Link key={idea} href={postJobHref(idea)}>
                      <div className="cursor-pointer rounded-full border border-border/70 bg-white px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-md active:translate-y-0">
                        {idea}
                      </div>
                    </Link>
                  ))}
                </div>

                <Button asChild size="lg" className="mt-7 w-full sm:w-auto">
                  <Link href="/post-job">
                    Post a job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Plus,
                  title: "1. Describe the job",
                  text: "Tell us what you need in plain language. SaskHandy can help clean up the post.",
                },
                {
                  icon: Briefcase,
                  title: "2. Compare bids",
                  text: "Review price, profile, trust signals, availability and messages in one place.",
                },
                {
                  icon: ShieldCheck,
                  title: "3. Choose with confidence",
                  text: "Payment is held securely and released after you confirm the work is complete.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border/60 bg-white p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Today’s homeowner note</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dailyNote}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Open Jobs" value={openJobs.length} icon={Briefcase} color="bg-emerald-50 text-emerald-600" />
              <StatCard label="In Progress" value={activeJobs.length} icon={Clock} color="bg-blue-50 text-blue-600" />
              <StatCard label="Completed" value={completedJobs.length} icon={Star} color="bg-amber-50 text-amber-600" />
              <StatCard label="Total Jobs" value={jobs?.length ?? 0} icon={Briefcase} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Your Jobs</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open jobs are visible to handymen. Review bids when they come in.
                </p>
              </div>

              {jobs?.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="cursor-pointer rounded-xl border border-border/60 bg-white p-5 transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.995]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-foreground">{job.title}</h3>
                          <StatusBadge status={job.status} />
                        </div>

                        <p className="line-clamp-1 text-sm text-muted-foreground">{job.description}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5">{job.category}</span>
                          <span>{job.location}</span>
                          <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-foreground">${job.budgetMin}–${job.budgetMax}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">budget</div>

                        {job.status === "open" && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                            <CheckCircle className="h-3 w-3" />
                            Live
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
