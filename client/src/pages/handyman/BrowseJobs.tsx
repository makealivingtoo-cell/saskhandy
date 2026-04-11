import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export default function BrowseJobs() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: categories = [] } = trpc.jobs.categories.useQuery();

  const { data: jobs, isLoading } = trpc.jobs.getOpen.useQuery(
    { limit: 50, offset: 0, category: category === "all" ? undefined : category },
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

  const filtered =
    jobs?.filter((job) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
      );
    }) ?? [];

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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
            {search || category !== "all"
              ? "Try adjusting your search or category filter."
              : "No open jobs right now. Check back soon."}
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
                  <div className="flex items-center justify-between">
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