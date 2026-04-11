import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "highest_budget" | "lowest_budget";

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

      const matchesCategory =
        category === "all" || job.category === category;

      const jobMin = parseFloat(job.budgetMin);
      const jobMax = parseFloat(job.budgetMax);

      const matchesBudgetMin =
        minBudget === null || jobMax >= minBudget;

      const matchesBudgetMax =
        maxBudget === null || jobMin <= maxBudget;

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
      <div className="space-y-4 mb-6">
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
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

      {!isLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "job" : "jobs"} available
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/60 p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">No jobs found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search, filters, or category.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <Link key={job.id} href={`/handyman/jobs/${job.id}`}>
              <div className="bg-white rounded-xl border border-border/60 p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
                    {job.title}
                  </h3>
                  <StatusBadge status={job.status} />
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                  {job.description}
                </p>

                <div className="space-y-2 mt-auto">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                      {job.category}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      ${job.budgetMin}–${job.budgetMax}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
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
          ))}
        </div>
      )}
    </AppLayout>
  );
}