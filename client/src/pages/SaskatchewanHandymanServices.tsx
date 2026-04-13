import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { Link } from "wouter";

const cities = [
  "Saskatoon",
  "Regina",
  "Prince Albert",
  "Moose Jaw",
  "Martensville",
  "Warman",
  "Yorkton",
  "Swift Current",
];

const services = [
  "Furniture assembly",
  "TV mounting",
  "Drywall patching",
  "Door and trim repairs",
  "Minor plumbing help",
  "Small electrical jobs",
  "Yard work and seasonal cleanup",
  "Painting and touch-ups",
];

export default function SaskatchewanHandymanServicesPage() {
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

          <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                <MapPin className="h-4 w-4" />
                Handyman services across Saskatchewan
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Saskatchewan Handyman Services
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                SaskHandy helps homeowners across Saskatchewan connect with local handymen for
                repairs, installations, yard work, furniture assembly, painting, and other everyday
                home jobs. Whether you are in Saskatoon, Regina, or a growing community nearby, you
                can post a job, compare bids, and manage everything in one place.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Post a Job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/saskatoon-handyman-services">View Saskatoon Page</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-slate-200">
          <div className="container py-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Areas we talk about on SaskHandy
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              We are building content and visibility around handyman services in major Saskatchewan
              cities and surrounding communities.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {cities.map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Common handyman jobs in Saskatchewan
                </h2>
                <p className="mt-4 text-slate-600 leading-8">
                  Homeowners often need help with the small and medium-sized jobs that pile up over
                  time. SaskHandy is designed for those practical jobs that need reliable local
                  help without the usual back-and-forth.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <div
                      key={service}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      {service}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 p-6">
                  <ShieldCheck className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Compare local bids</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Instead of messaging random contacts across different platforms, post once and
                    receive bids from local handymen.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Star className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Build trust with reviews</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Ratings and reviews help homeowners make better decisions and help handymen grow
                    their reputation over time.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Wrench className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">One place to manage the job</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Keep job details, bids, messages, and payment flow inside the platform from
                    start to finish.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Looking for a city-specific page?
              </h2>
              <p className="mt-4 text-slate-600 leading-8">
                We are also building local pages to better serve homeowners searching for handyman
                services in specific Saskatchewan cities.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/saskatoon-handyman-services"
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                >
                  Saskatoon Handyman Services
                </Link>
                <Link
                  href="/regina-handyman-services"
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                >
                  Regina Handyman Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}