import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Lightbulb,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "highest_budget" | "lowest_budget";

const bidTips = [
  "Bid early when a job looks like a good fit.",
  "Mention your availability so homeowners can decide faster.",
  "Use a short message that shows you understand the job.",
];

function isRecentlyPosted(createdAt: string | Date) {
  return differenceInHours(new Date(), new Date(createdAt)) <= 48;
}

export default function BrowseJobs() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [category, setCategory] = useState("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: categories = [] } = trpc.jobs.categories.useQuery();

  const { data: jobs, isLoading } = trpc.jobs.getOpen.useQuery(
    { limit: 100, offset: 0, category: undefined },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (!loading && isAuthenticated && user?.userType !== "handyman" && user?.role !== "admin") {
      navigate("/role-select");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const hasActiveFilters =
    search.trim() ||
    locationFilter.trim() ||
    category !== "all" ||
    budgetMin.trim() ||
    budgetMax.trim();

  const filtered = useMemo(() => {
    const minBudget = budgetMin ? parseFloat(budgetMin) : null;
    const maxBudget = budgetMax ? parseFloat(budgetMax) : null;

    let list = (jobs ?? []).filter((job) => {
      const searchText = search.trim().toLowerCase();
      const locationText = locationFilter.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        job.title.toLowerCase().includes(searchText) ||
        job.description.toLowerCase().includes(searchText) ||
        job.location.toLowerCase().includes(searchText);

      const matchesLocation =
        !locationText || job.location.toLowerCase().includes(locationText);

      const matchesCategory = category === "all" || job.category === category;

      const jobMin = parseFloat(job.budgetMin);
      const jobMax = parseFloat(job.budgetMax);

      const matchesBudgetMin = minBudget === null || jobMax >= minBudget;
      const matchesBudgetMax = maxBudget === null || jobMin <= maxBudget;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesBudgetMin &&
        matchesBudgetMax
      );
    });

    list = list.sort((a, b) => {
      if (sortBy === "highest_budget") {
        return parseFloat(b.budgetMax) - parseFloat(a.budgetMax);
      }

      if (sortBy === "lowest_budget") {
        return parseFloat(a.budgetMin) - parseFloat(b.budgetMin);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [jobs, search, locationFilter, category, budgetMin, budgetMax, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setLocationFilter("");
    setCategory("all");
    setBudgetMin("");
    setBudgetMax("");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <AppLayout title="Browse Jobs">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Browse Jobs">
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">How to win jobs</p>
              <div className="mt-2 grid sm:grid-cols-3 gap-2">
                {bidTips.map((tip) => (
                  <div key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Find jobs that fit you</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, description, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Input
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full sm:w-52"
              />

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="highest_budget">Highest Budget</SelectItem>
                  <SelectItem value="lowest_budget">Lowest Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Min budget"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="pl-7"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Max budget"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline sm:px-2"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  category === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    category === cat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isLoading && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {filtered.length} {filtered.length === 1 ? "job" : "jobs"} available
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open jobs are updated as homeowners post new tasks.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />

            <h3 className="font-semibold text-foreground mb-2">
              {jobs && jobs.length > 0 ? "No jobs match your filters" : "No open jobs right now"}
            </h3>

            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
              {jobs && jobs.length > 0
                ? "Try clearing your filters or searching a broader location/category."
                : "Homeowners are still posting jobs. Check back soon, and make sure your profile is complete so you are ready when the right job appears."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((job) => {
              const recent = isRecentlyPosted(job.createdAt);

              return (
                <Link key={job.id} href={`/handyman/jobs/${job.id}`}>
                  <div className="bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {recent && (
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          New
                        </span>
                      )}

                      <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                        {job.category}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Budget</p>
                          <span className="text-sm font-bold text-foreground">
                            ${job.budgetMin}–${job.budgetMax}
                          </span>
                        </div>

                        <span className="text-xs text-primary font-medium">View & Bid</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground gap-3 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>

                        <span className="shrink-0">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}