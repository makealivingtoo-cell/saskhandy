import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Hammer,
  Loader2,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const categories = [
  "All",
  "Carpentry",
  "Drywall",
  "Plumbing",
  "Electrical",
  "Painting",
  "Landscaping",
  "Cleaning",
  "General Helper",
  "HVAC",
  "Roofing",
];

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBudget(job: any) {
  const min = formatCurrency(job.budgetMin);
  const max = formatCurrency(job.budgetMax);

  if (min && max) return `${min}–${max}`;
  if (min) return `From ${min}`;
  if (max) return `Up to ${max}`;
  return "Budget listed in job";
}

function formatPostedDate(value: unknown) {
  if (!value) return "Recently posted";

  const date = new Date(value as string | Date);

  if (Number.isNaN(date.getTime())) {
    return "Recently posted";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Posted less than an hour ago";
  if (diffHours < 24) return `Posted ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `Posted ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDescription(value: unknown) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= 170) return text;

  return `${text.slice(0, 170).trim()}…`;
}

function publicLocation() {
  return "Saskatoon area";
}

export default function OpenJobsSaskatoonPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const queryInput = useMemo(
    () => ({
      limit: 50,
      offset: 0,
      category: selectedCategory === "All" ? undefined : selectedCategory,
    }),
    [selectedCategory]
  );

  const jobsQuery = trpc.jobs.getOpen.useQuery(queryInput);
  const jobs = Array.isArray(jobsQuery.data) ? jobsQuery.data : [];

  useEffect(() => {
    document.title = "Open Handyman Jobs in Saskatoon | SaskHandy";

    const description =
      "See open handyman jobs in Saskatoon. Local handymen can create a profile, complete ID Name Matched, and bid on home repair, carpentry, drywall, mounting, assembly, and renovation jobs.";

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = "https://saskhandy.com/open-jobs-saskatoon";
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Hammer className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xl font-bold tracking-tight">SaskHandy</div>
              <div className="text-sm text-slate-500">Local help for home jobs</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline"
            >
              Sign in
            </Link>

            <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
              <Link href="/sign-up">Create Profile</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <BriefcaseBusiness className="h-4 w-4" />
                  For Saskatoon handymen and home service providers
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                  Open Handyman Jobs in Saskatoon
                </h1>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  See local home repair, carpentry, mounting, assembly, drywall, yard work, and
                  small renovation jobs posted by Saskatoon homeowners. Create a handyman profile,
                  complete ID Name Matched, and start sending bids.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-emerald-700 px-8 text-base hover:bg-emerald-800"
                  >
                    <Link href="/sign-up">
                      Create Handyman Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white px-8 text-base"
                  >
                    <Link href="/saskatoon-handyman-services">For Homeowners</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Before you can bid</h2>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="font-medium text-slate-900">Create a handyman profile</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Add your photo, bio, service area, and skills so homeowners know who they
                        are reviewing.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="font-medium text-slate-900">Complete ID Name Matched</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        SaskHandy requires ID Name Matched approval before handymen can send bids.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Wrench className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="font-medium text-slate-900">Bid on relevant jobs</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Choose jobs that match your skills, availability, tools, and service area.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  For privacy, SaskHandy does not publicly show homeowner names, exact addresses,
                  phone numbers, or private messages on this page.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="container py-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Current Open Jobs
                </h2>
                <p className="mt-2 text-slate-600">
                  These jobs are open for eligible handymen to review and bid on after signup.
                </p>
              </div>

              <Button asChild variant="outline" className="rounded-full">
                <Link href="/sign-up">Join to Bid</Link>
              </Button>
            </div>

            {jobsQuery.isLoading ? (
              <div className="flex items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 p-12 text-slate-600">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading open jobs...
              </div>
            ) : jobsQuery.isError ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800">
                We could not load open jobs right now. Please try again shortly.
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
                <h3 className="text-xl font-semibold text-slate-950">
                  No open jobs showing right now
                </h3>
                <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                  New Saskatoon jobs are posted as homeowners submit requests. Create a handyman
                  profile now so you are ready when matching jobs become available.
                </p>

                <div className="mt-6">
                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">Create Handyman Account</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                {jobs.map((job: any) => (
                  <article
                    key={job.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {job.category ?? "Home repair"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Open
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                          {job.title}
                        </h3>

                        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                          {shortDescription(job.description)}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                          <div className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-700" />
                            {publicLocation()}
                          </div>

                          <div className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-700" />
                            {formatPostedDate(job.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:min-w-[220px]">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Budget range
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {formatBudget(job)}
                        </p>

                        <Button
                          asChild
                          className="mt-4 w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
                        >
                          <Link href="/sign-up">Create Profile to Bid</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-14">
            <div className="rounded-[32px] bg-emerald-700 p-8 text-white md:p-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Are you a Saskatoon handyman?
              </h2>
              <p className="mt-3 max-w-2xl leading-8 text-emerald-50">
                Join SaskHandy to get notified about local jobs that match your skills. Complete
                your profile, get ID Name Matched, and send bids when homeowners post work.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-8 text-base text-emerald-800 hover:bg-emerald-50"
                >
                  <Link href="/sign-up">Create Handyman Account</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                >
                  <Link href="/support">Contact SaskHandy</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
