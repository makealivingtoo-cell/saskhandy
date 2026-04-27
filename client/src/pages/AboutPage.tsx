import { Button } from "@/components/ui/button";
import { Hammer, ArrowRight, ShieldCheck, Users, MapPin } from "lucide-react";
import { Link } from "wouter";

const serviceLinks = [
  { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
  { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
  { href: "/regina-handyman-services", label: "Regina Handyman Services" },
  { href: "/moose-jaw-handyman-services", label: "Moose Jaw Handyman Services" },
  { href: "/prince-albert-handyman-services", label: "Prince Albert Handyman Services" },
  { href: "/warman-handyman-services", label: "Warman Handyman Services" },
  { href: "/martensville-handyman-services", label: "Martensville Handyman Services" },
  { href: "/furniture-assembly-saskatchewan", label: "Furniture Assembly Saskatchewan" },
  { href: "/tv-mounting-saskatchewan", label: "TV Mounting Saskatchewan" },
  { href: "/plumbing-repairs-saskatchewan", label: "Plumbing Repairs Saskatchewan" },
  { href: "/electrical-help-saskatchewan", label: "Electrical Help Saskatchewan" },
  { href: "/drywall-painting-saskatchewan", label: "Drywall and Painting Saskatchewan" },
  { href: "/yard-work-saskatchewan", label: "Yard Work Saskatchewan" },
];

export default function AboutPage() {
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
            <Link href="/blog" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Blog
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
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <MapPin className="h-4 w-4" />
                  Built for Saskatchewan homeowners and handymen
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  About SaskHandy
                </h1>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  SaskHandy is a Saskatchewan handyman marketplace that helps homeowners find local
                  help for everyday home jobs. Homeowners can post repair, installation, assembly,
                  yard work, drywall, painting, plumbing help, electrical help, and maintenance
                  projects, then compare bids from local handymen in one place.
                </p>

                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Whether someone needs handyman services in Saskatoon, Regina, Moose Jaw, Prince
                  Albert, Warman, Martensville, or another Saskatchewan community, SaskHandy is built
                  to make local hiring clearer, simpler, and easier to manage.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Post a Job
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/saskatchewan-handyman-services">
                      View Saskatchewan Services
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/images/saskatchewan.jpg"
                    alt="Saskatchewan landscape"
                    className="h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200 p-6">
                <Users className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">For homeowners</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Post a job once and receive bids from local handymen without chasing scattered
                  referrals, social media comments, and slow back-and-forth messages across
                  different platforms.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">For handymen</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Find local jobs, select the skills you offer, receive matching job notifications,
                  send bids, and build trust through ratings, reviews, and a clean profile
                  experience.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <ShieldCheck className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">For trust</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Keep job details, communication, bids, and payments inside the platform to create a
                  clearer and more organized hiring process for homeowners and handymen.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Why we built SaskHandy
                </h2>

                <div className="mt-5 space-y-5 text-slate-600 leading-8">
                  <p>
                    Many homeowners still rely on word of mouth, social media groups, scattered
                    listings, and slow back-and-forth messaging just to get simple home jobs done.
                    That can work sometimes, but it is not always organized. It can be difficult to
                    know who is available, what they charge, what skills they offer, and whether they
                    are a good fit for the job.
                  </p>

                  <p>
                    SaskHandy was created to give Saskatchewan homeowners a cleaner way to hire local
                    help for the practical home jobs that often get delayed. These include furniture
                    assembly, TV mounting, drywall patching, painting touch-ups, leaky faucet repair,
                    small electrical help, yard work, fence repair, gutter cleaning, seasonal cleanup,
                    and general home maintenance.
                  </p>

                  <p>
                    The goal is not to make every home job complicated. The goal is to make the
                    process easier. A homeowner should be able to explain what needs to be done, add
                    useful details, compare bids, message local handymen, and move forward with more
                    confidence.
                  </p>

                  <p>
                    SaskHandy also helps handymen by giving them a place to find real local jobs that
                    match their skills. Instead of waiting for random referrals, handymen can build a
                    profile, select their service categories, receive notifications for matching jobs,
                    and grow their reputation over time.
                  </p>
                </div>

                <div className="mt-8">
                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Join SaskHandy
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#f7faf8] p-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Common jobs on SaskHandy
                </h2>

                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  <li>Furniture assembly and home setup</li>
                  <li>TV wall mounting and bracket installation</li>
                  <li>Drywall patch repair and paint touch-ups</li>
                  <li>Leaky faucet repair and fixture replacement</li>
                  <li>Light fixture installation and small electrical help</li>
                  <li>Yard work, seasonal cleanup, and gutter cleaning</li>
                  <li>Fence repair, deck maintenance, and outdoor fixes</li>
                  <li>General handyman services and small home repairs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Local handyman services across Saskatchewan
              </h2>

              <p className="mt-4 text-slate-600 leading-8">
                SaskHandy is building stronger local visibility for handyman services across
                Saskatchewan. Explore city-specific service pages and common home repair categories
                below.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="rounded-[32px] bg-emerald-700 px-6 py-12 text-center text-white md:px-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Ready to get a home job done?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-8 text-emerald-50">
                Post your job on SaskHandy and connect with local handymen for repairs, assembly,
                mounting, yard work, painting, drywall, plumbing help, electrical help, and other
                home projects across Saskatchewan.
              </p>

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}