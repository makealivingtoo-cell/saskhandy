import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, Search, Wrench } from "lucide-react";
import { useEffect } from "react";
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

const saskatoonServiceGroups = [
  {
    title: "Deck, fence, and outdoor repair",
    description:
      "Outdoor repairs are seasonal in Saskatoon, especially after winter, spring thaw, and heavy use during summer.",
    links: [
      { href: "/deck-repair-saskatoon", label: "Deck repair in Saskatoon" },
      { href: "/professional-deck-staining-saskatoon", label: "Professional deck staining" },
      { href: "/fence-repair-and-gate-fix-saskatoon", label: "Fence repair and gate fixes" },
      { href: "/fence-post-replacement-saskatoon", label: "Fence post replacement" },
      { href: "/bbq-assembly-service-saskatoon", label: "BBQ assembly service" },
    ],
  },
  {
    title: "Drywall, painting, trim, and interior fixes",
    description:
      "These pages help homeowners find help for walls, ceilings, trim, paint touch-ups, and finish work.",
    links: [
      { href: "/drywall-repair-and-patching-saskatoon", label: "Drywall repair and patching" },
      {
        href: "/ceiling-drywall-water-damage-repair-saskatoon",
        label: "Ceiling drywall water damage repair",
      },
      { href: "/interior-painting-handyman-saskatoon", label: "Interior painting handyman" },
      { href: "/baseboard-and-trim-installation-saskatoon", label: "Baseboard and trim installation" },
      { href: "/interior-door-hanging-service-saskatoon", label: "Interior door hanging" },
    ],
  },
  {
    title: "Minor plumbing and bathroom help",
    description:
      "For small fixture jobs and practical bathroom repairs where homeowners need clear quotes and local help.",
    links: [
      { href: "/faucet-repair-and-installation-saskatoon", label: "Faucet repair and installation" },
      { href: "/leaky-toilet-repair-service-saskatoon", label: "Leaky toilet repair service" },
      { href: "/minor-plumbing-handyman-saskatoon", label: "Minor plumbing handyman" },
      {
        href: "/caulking-repair-bathtub-shower-saskatoon",
        label: "Bathtub and shower caulking repair",
      },
    ],
  },
  {
    title: "Assembly, mounting, and installation",
    description:
      "High-intent Saskatoon pages for homeowners who need items assembled, mounted, installed, or adjusted.",
    links: [
      { href: "/tv-mounting-saskatoon", label: "TV mounting in Saskatoon" },
      { href: "/ring-doorbell-installation-saskatoon", label: "Ring doorbell installation" },
      { href: "/ikea-furniture-assembly-saskatoon", label: "IKEA furniture assembly" },
      { href: "/wayfair-furniture-assembler-saskatoon", label: "Wayfair furniture assembler" },
      {
        href: "/wall-hanging-mirror-and-art-installation-saskatoon",
        label: "Mirror and art installation",
      },
      {
        href: "/blinds-and-curtain-rod-installation-saskatoon",
        label: "Blinds and curtain rod installation",
      },
      {
        href: "/deadbolt-and-door-lock-replacement-saskatoon",
        label: "Deadbolt and door lock replacement",
      },
    ],
  },
];

const coreServiceLinks = [
  {
    href: "/local-handyman-services-saskatoon",
    label: "Local handyman services in Saskatoon",
  },
  {
    href: "/saskatoon-handyman-services",
    label: "Saskatoon handyman services",
  },
  {
    href: "/saskatchewan-handyman-services",
    label: "Handyman services in Saskatchewan",
  },
  {
    href: "/tv-mounting-saskatoon",
    label: "TV mounting in Saskatoon",
  },
  {
    href: "/ring-doorbell-installation-saskatoon",
    label: "Ring doorbell installation in Saskatoon",
  },
  {
    href: "/deck-repair-saskatoon",
    label: "Deck repair in Saskatoon",
  },
  {
    href: "/fence-repair-and-gate-fix-saskatoon",
    label: "Fence repair in Saskatoon",
  },
  {
    href: "/drywall-repair-and-patching-saskatoon",
    label: "Drywall repair in Saskatoon",
  },
  {
    href: "/ikea-furniture-assembly-saskatoon",
    label: "IKEA furniture assembly in Saskatoon",
  },
];

export default function BlogPage() {
  useEffect(() => {
    document.title = "SaskHandy Blog | Saskatoon Home Repair and Handyman Tips";

    const description =
      "Read SaskHandy homeowner guides for Saskatoon handyman services, TV mounting, doorbell installation, deck repair, fence repair, drywall patching, furniture assembly, and small home jobs.";

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

    canonical.href = "https://saskhandy.com/blog";
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
                  Saskatoon Home Repair Blog
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Home Repair Tips and Handyman Hiring Advice for Saskatoon Homeowners
                </h1>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  The SaskHandy Blog helps homeowners find practical answers about local handyman
                  services, small repairs, furniture assembly, TV mounting, doorbell installation,
                  deck repair, fence repair, drywall patching, painting, minor plumbing help, and
                  hiring local handymen in Saskatoon.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">Post a Job</Link>
                  </Button>

                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/local-handyman-services-saskatoon">
                      Explore Saskatoon Services
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/images/hero-handyman.jpg"
                    alt="Saskatoon handyman working on a home repair project"
                    className="block h-[420px] w-full object-cover"
                    width="1200"
                    height="800"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Guides for Finding Reliable Handyman Services in Saskatoon
                </h2>

                <p className="mt-4 leading-8 text-slate-600">
                  Finding the right person for a home repair job can feel overwhelming, especially
                  when the job is too small for a full contractor but still important enough to need
                  someone careful. SaskHandy creates homeowner-friendly guides to help you understand
                  what to ask, how to compare bids, which repairs should be handled early, and how to
                  describe your job clearly when posting it online.
                </p>

                <p className="mt-4 leading-8 text-slate-600">
                  The goal is to make local handyman hiring easier for everyday projects in
                  Saskatoon. That includes tasks like mounting a TV, installing a doorbell, fixing
                  drywall, repairing a fence, staining a deck, assembling furniture, replacing a
                  faucet, hanging a mirror, installing blinds, replacing a deadbolt, or getting help
                  with basic home maintenance.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#f7faf8] p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">
                  Popular homeowner topics
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Start with a guide, then explore the related Saskatoon service page when you are
                  ready to post a job.
                </p>

                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}

                  <li>
                    <Link
                      href="/local-handyman-services-saskatoon"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Local Handyman Services Saskatoon
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/tv-mounting-saskatoon"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      TV Mounting Saskatoon
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/deck-repair-saskatoon"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Deck Repair Saskatoon
                    </Link>
                  </li>
                </ul>
              </div>
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

        <section className="border-t border-b border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                <Search className="h-4 w-4" />
                Saskatoon service guides
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                High-intent handyman services homeowners search for
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                These Saskatoon service pages help homeowners find specific help instead of landing
                on one generic handyman page. Each page explains what to include in the job post,
                what can affect the quote, and how SaskHandy helps homeowners compare local bids.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {saskatoonServiceGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <Wrench className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-950">{group.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{group.description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {group.links.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
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
                    This is especially helpful for jobs that do not always require a full contractor.
                    Many homeowners need help with practical tasks such as furniture assembly, TV
                    mounting, drywall patching, interior painting, minor plumbing repairs, faucet
                    replacement, fence repairs, deck maintenance, wall hanging, blinds installation,
                    deadbolt replacement, and general handyman work around the house.
                  </p>

                  <p>
                    A clear job post can help homeowners receive better responses. The more detail
                    you include about the work, materials, timeline, photos, and location, the easier
                    it is for a handyman to understand the scope of the job and decide whether they
                    are a good fit.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#f7faf8] p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">
                  Core SaskHandy service pages
                </h3>

                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  {coreServiceLinks.map((item) => (
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
                Post your job on SaskHandy and connect with local handymen in Saskatoon for
                repairs, assembly, mounting, yard work, painting, drywall, deck repair, fence
                repair, and other home projects.
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
