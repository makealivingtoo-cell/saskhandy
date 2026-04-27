import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer } from "lucide-react";
import { Link } from "wouter";

const posts = [
  {
    slug: "how-to-hire-a-handyman-in-saskatchewan",
    title: "How to Hire a Handyman in Saskatchewan",
    excerpt:
      "A practical guide for Saskatchewan homeowners who want to compare bids, review handyman experience, ask the right questions, and hire local help with more confidence.",
  },
  {
    slug: "small-home-jobs-you-should-not-put-off",
    title: "Small Home Jobs You Should Not Put Off",
    excerpt:
      "From loose fixtures to minor plumbing leaks, these common home repairs can become expensive if ignored. Learn which small jobs are worth fixing early.",
  },
  {
    slug: "what-homeowners-should-ask-before-accepting-a-bid",
    title: "What Homeowners Should Ask Before Accepting a Bid",
    excerpt:
      "A simple checklist for reviewing handyman quotes, availability, pricing, job scope, materials, timelines, and expectations before choosing the right person.",
  },
];

const serviceLinks = [
  {
    href: "/saskatchewan-handyman-services",
    label: "Handyman services in Saskatchewan",
  },
  {
    href: "/saskatoon-handyman-services",
    label: "Handyman services in Saskatoon",
  },
  {
    href: "/regina-handyman-services",
    label: "Handyman services in Regina",
  },
  {
    href: "/furniture-assembly-saskatchewan",
    label: "Furniture assembly in Saskatchewan",
  },
  {
    href: "/tv-mounting-saskatchewan",
    label: "TV mounting in Saskatchewan",
  },
  {
    href: "/plumbing-repairs-saskatchewan",
    label: "Plumbing repairs in Saskatchewan",
  },
  {
    href: "/electrical-help-saskatchewan",
    label: "Electrical help in Saskatchewan",
  },
  {
    href: "/yard-work-saskatchewan",
    label: "Yard work in Saskatchewan",
  },
  {
    href: "/drywall-painting-saskatchewan",
    label: "Drywall and painting in Saskatchewan",
  },
];

export default function BlogPage() {
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

          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              About
            </Link>

            <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Saskatchewan Home Repair Blog
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Home Repair Tips and Handyman Hiring Advice for Saskatchewan Homeowners
                </h1>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  The SaskHandy Blog helps homeowners find practical answers about home repairs,
                  handyman services, small maintenance jobs, furniture assembly, TV mounting, yard
                  work, drywall repairs, painting, plumbing help, electrical help, and hiring local
                  handymen in Saskatchewan.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">Post a Job</Link>
                  </Button>

                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/saskatchewan-handyman-services">
                      Explore Handyman Services
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/images/hero-handyman.jpg"
                    alt="Handyman working on a home repair project"
                    className="block h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Guides for Finding Reliable Handyman Services in Saskatchewan
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                Whether you live in Saskatoon, Regina, Prince Albert, Moose Jaw, Warman,
                Martensville, or another Saskatchewan community, finding the right person for a home
                repair job can feel overwhelming. SaskHandy creates homeowner-friendly guides to
                help you understand what to ask, how to compare quotes, which small repairs should
                be handled early, and how to describe your job clearly when posting it online.
              </p>

              <p className="mt-4 leading-8 text-slate-600">
                Our goal is to make local handyman hiring easier for everyday home projects. That
                includes simple jobs like assembling furniture, mounting a TV, fixing drywall,
                painting a room, cleaning up a yard, repairing a fence, replacing fixtures, or
                getting help with basic plumbing and electrical tasks. These articles are written
                for homeowners who want practical advice before choosing a handyman.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Homeowner Tips
                  </p>

                  <h2 className="mt-3 text-xl font-semibold text-slate-900">{post.title}</h2>

                  <p className="mt-3 leading-7 text-slate-600">{post.excerpt}</p>

                  <div className="mt-5">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Read more
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7faf8]">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Why Homeowners Use SaskHandy for Local Home Jobs
                </h2>

                <div className="mt-5 space-y-4 leading-8 text-slate-600">
                  <p>
                    SaskHandy is built for homeowners who need a simpler way to find local help for
                    home repair and maintenance tasks. Instead of calling around without knowing who
                    is available, homeowners can post a job, explain what needs to be done, add
                    details about the location and budget, and give local handymen a chance to
                    respond.
                  </p>

                  <p>
                    This is especially helpful for small home jobs that do not always require a full
                    contractor. Many homeowners need help with practical tasks such as furniture
                    assembly, TV mounting, drywall patching, painting, yard cleanup, basic plumbing
                    repairs, fixture replacement, fence repairs, deck maintenance, and general
                    handyman work around the house.
                  </p>

                  <p>
                    A clear job post can help homeowners receive better responses. The more detail
                    you include about the work, materials, timeline, photos, and location, the easier
                    it is for a handyman to understand the scope of the job and decide whether they
                    are a good fit.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">
                  Popular Handyman Services
                </h3>

                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  {serviceLinks.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="rounded-[32px] bg-emerald-700 px-6 py-12 text-center text-white md:px-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Need help with a home repair or small job?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-8 text-emerald-50">
                Post your job on SaskHandy and connect with local handymen in Saskatchewan for
                repairs, assembly, mounting, yard work, painting, drywall, and other home projects.
              </p>

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  <Link href="/sign-up">Post Your First Job</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}