import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type SortOption = "newest" | "highest_budget" | "lowest_budget";

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
  const [showFilters, setShowFilters] = useState(false);

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

  const hasActiveFilters = Boolean(
    search.trim() ||
      locationFilter.trim() ||
      category !== "all" ||
      budgetMin.trim() ||
      budgetMax.trim()
  );

  const activeFilterCount = [
    locationFilter.trim(),
    category !== "all" ? category : "",
    budgetMin.trim() || budgetMax.trim() ? "budget" : "",
  ].filter(Boolean).length;

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

    return list.sort((a, b) => {
      if (sortBy === "highest_budget") {
        return parseFloat(b.budgetMax) - parseFloat(a.budgetMax);
      }

      if (sortBy === "lowest_budget") {
        return parseFloat(a.budgetMin) - parseFloat(b.budgetMin);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Jobs ready for a bid</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open a job, check the details, and send your price.
            </p>
          </div>

          {!isLoading && (
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-foreground leading-none">{filtered.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {filtered.length === 1 ? "job" : "jobs"}
              </p>
            </div>
          )}
        </div>

        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent">
          <div className="bg-white rounded-2xl border border-border/60 p-3 sm:p-4 shadow-sm">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or location"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>

              <Button
                type="button"
                variant={showFilters || activeFilterCount > 0 ? "secondary" : "outline"}
                className="h-11 px-3 sm:px-4 relative"
                onClick={() => setShowFilters((value) => !value)}
              >
                <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="hidden sm:flex w-44 h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="highest_budget">Highest budget</SelectItem>
                  <SelectItem value="lowest_budget">Lowest budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 overflow-x-auto pt-3 pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  category === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                All jobs
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    category === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border/50 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  placeholder="Location, e.g. Saskatoon"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Min $"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Max $"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>

                <div className="sm:hidden">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="highest_budget">Highest budget</SelectItem>
                      <SelectItem value="lowest_budget">Lowest budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center sm:justify-end lg:col-start-4">
                  {hasActiveFilters && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">
              {jobs && jobs.length > 0 ? "No jobs match those filters" : "No open jobs right now"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {jobs && jobs.length > 0
                ? "Broaden the search or clear your filters to see more work."
                : "New homeowner jobs will appear here as soon as they are posted."}
            </p>
            {hasActiveFilters && (
              <Button type="button" variant="outline" className="mt-5" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((job) => {
              const recent = isRecentlyPosted(job.createdAt);

              return (
                <Link key={job.id} href={`/handyman/jobs/${job.id}`}>
                  <article className="group bg-white rounded-2xl border border-border/60 p-4 sm:p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col active:scale-[0.995]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {recent && (
                            <span className="text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                              New
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
                          {job.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-1 shrink-0 transition-colors" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2.5 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                        {job.category}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/40 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">Homeowner budget</p>
                        <p className="text-lg font-bold text-foreground leading-tight">
                          ${job.budgetMin}–${job.budgetMax}
                        </p>
                      </div>

                      <div className="text-right min-w-0">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-32">{job.location}</span>
                        </div>
                        <p className="text-xs text-primary font-semibold mt-1.5">View & bid</p>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
            <Clock className="w-3.5 h-3.5" />
            New jobs appear here as homeowners post them.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
