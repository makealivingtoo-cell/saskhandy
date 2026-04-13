import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Hammer,
  MapPin,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

const categories = [
  "Furniture Assembly",
  "TV Mounting",
  "Plumbing",
  "Electrical Help",
  "Yard Work",
  "Painting",
  "Home Repairs",
  "Moving Help",
];

const trustItems = [
  {
    title: "Compare bids",
    description: "Post once and receive bids from local handymen.",
    icon: CheckCircle2,
  },
  {
    title: "Secure payments",
    description: "Keep payments inside the platform until the job is complete.",
    icon: ShieldCheck,
  },
  {
    title: "Ratings and reviews",
    description: "Build trust with visible feedback from completed jobs.",
    icon: Star,
  },
];

const testimonials = [
  {
    quote:
      "I posted a fence repair job and got responses faster than I expected. The whole process felt simple.",
    name: "Sarah M.",
    role: "Homeowner, Saskatoon",
  },
  {
    quote:
      "Much better than chasing people in Facebook groups. I could compare bids and pick the one that made sense.",
    name: "Jason T.",
    role: "Homeowner, Regina",
  },
  {
    quote:
      "As a handyman, I like being able to see local jobs and send bids without wasting time going back and forth.",
    name: "Chris P.",
    role: "Handyman, Saskatchewan",
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "homeowner") navigate("/dashboard");
      else if (user.userType === "handyman") navigate("/handyman/dashboard");
      else navigate("/role-select");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Hammer className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <div className="text-2xl font-bold tracking-tight">SaskHandy</div>
              <div className="text-sm text-slate-500">Local help for home jobs</div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/about"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 md:inline"
            >
              About
            </Link>

            <Link
              href="/blog"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 md:inline"
            >
              Blog
            </Link>

            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Sign in
            </Link>

            <Button
              asChild
              className="rounded-full bg-emerald-700 px-6 text-sm font-semibold hover:bg-emerald-800"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-14 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <MapPin className="h-4 w-4" />
                  Saskatchewan homeowners meet local handymen
                </div>

                <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
                  Book trusted help for home jobs
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  Post a job, compare bids, chat with local handymen, and pay securely in one place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-emerald-700 px-8 text-base hover:bg-emerald-800"
                  >
                    <Link href="/sign-up">
                      Post a Job
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white px-8 text-base text-slate-900 hover:bg-slate-50"
                  >
                    <Link href="/sign-up">Become a Handyman</Link>
                  </Button>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/images/hero-handyman.jpg"
                    alt="Handyman helping a homeowner with home repairs"
                    className="h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="container py-12">
            <div className="mb-6 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-700" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Popular services
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link
                  key={category}
                  href="/sign-up"
                  className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16 md:py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50">
                <img
                  src="/images/homeowner-posting-job.jpg"
                  alt="Homeowner posting a repair job from a phone"
                  className="h-[420px] w-full object-cover"
                />
              </div>

              <div className="max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  A simple way to hire local help
                </h2>

                <div className="mt-8 space-y-6">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">1. Post your job</div>
                    <p className="mt-2 text-slate-600">
                      Describe what you need done and add photos if needed.
                    </p>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-slate-900">2. Compare bids</div>
                    <p className="mt-2 text-slate-600">
                      Review pricing, availability, and profiles before choosing someone.
                    </p>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-slate-900">3. Chat and pay</div>
                    <p className="mt-2 text-slate-600">
                      Keep communication and payment in one place from start to finish.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-emerald-700 px-8 text-base hover:bg-emerald-800"
                  >
                    <Link href="/sign-up">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-b border-slate-200 bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Why use SaskHandy
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A cleaner way to hire for small home jobs without chasing random numbers on Facebook.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-10 md:py-14">
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="mb-4 flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>

                  <p className="text-base leading-7 text-slate-700">“{item.quote}”</p>

                  <div className="mt-5">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16 md:py-20">
            <div className="rounded-[36px] bg-emerald-700 px-8 py-12 text-white md:px-14 md:py-16">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Ready to post your first job?
                </h2>
                <p className="mt-4 text-lg text-emerald-50/90">
                  Start with one real job and build the marketplace from there.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-8 text-base text-emerald-800 hover:bg-emerald-50"
                >
                  <Link href="/sign-up">
                    Post a Job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                >
                  <Link href="/sign-up">Join as a Handyman</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">SaskHandy</div>
              <div className="text-sm text-slate-500">Local help for home jobs</div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/about" className="hover:text-slate-900">
                About Us
              </Link>
              <Link href="/blog" className="hover:text-slate-900">
                Blog
              </Link>
              <Link href="/privacy" className="hover:text-slate-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Terms & Conditions
              </Link>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-500">
            © {new Date().getFullYear()} SaskHandy
          </div>
        </div>
      </footer>
    </div>
  );
}