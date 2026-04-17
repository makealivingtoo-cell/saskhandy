import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star, Wrench } from "lucide-react";
import { Link } from "wouter";

const cities = [
  "Saskatoon",
  "Regina",
  "Prince Albert",
  "Moose Jaw",
  "Warman",
  "Martensville",
  "Yorkton",
  "Swift Current",
];

const services = [
  "Furniture assembly",
  "TV mounting",
  "Plumbing repairs",
  "Electrical help",
  "Yard work and maintenance",
  "Drywall patch repair",
  "Interior painting",
  "Fence and gutter repair",
];

export default function SaskatchewanHandymanServicesPage() {
  useEffect(() => {
    document.title = "Saskatchewan Handyman Services | SaskHandy";

    const metaDescription = document.querySelector('meta[name="description"]');
    const content =
      "Find Saskatchewan handyman services for furniture assembly, TV mounting, plumbing repairs, electrical help, yard work, drywall repair, painting, and more with SaskHandy.";

    if (metaDescription) {
      metaDescription.setAttribute("content", content);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = content;
      document.head.appendChild(meta);
    }
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

          <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-4xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <MapPin className="h-4 w-4" />
                  Handyman services across Saskatchewan
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Saskatchewan Handyman Services for Repairs, Installations, and Home Maintenance
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  SaskHandy helps homeowners across Saskatchewan find local handyman services for
                  furniture assembly, TV mounting, plumbing repairs, small electrical help, yard
                  work, drywall patch repair, interior painting, fence repair, gutter cleaning,
                  and other practical home jobs.
                </p>

                <p className="mt-4 max-w-3xl text-slate-600 leading-8">
                  Whether you are in Saskatoon, Regina, Prince Albert, Moose Jaw, Warman, or
                  Martensville, you can post a job, compare bids, message local handymen, and move
                  forward with more confidence in one place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Post a Job
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link href="/saskatoon-handyman-services">Saskatoon Services</Link>
                  </Button>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/images/saskatchewan.jpg"
                    alt="Saskatchewan landscape"
                    className="block h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="container py-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Popular handyman services in Saskatchewan
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              These are some of the most common service categories homeowners look for when they
              need local handyman help in Saskatchewan.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Why homeowners use SaskHandy
                </h2>
                <p className="mt-4 text-slate-600 leading-8">
                  Instead of chasing random numbers, searching scattered listings, or posting in
                  local Facebook groups, homeowners can use SaskHandy to compare bids, review
                  profiles, keep messages in one place, and manage the job process more clearly.
                </p>
                <p className="mt-4 text-slate-600 leading-8">
                  This works especially well for the small-to-medium jobs that often sit on a
                  homeowner’s to-do list, including wall mounting, touch-up painting, minor repairs,
                  leaky faucet fixes, light fixture installation, and seasonal yard maintenance.
                </p>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 p-6">
                  <ShieldCheck className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Secure payments and clearer process</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Post once, compare bids, and keep the payment flow inside the platform instead
                    of handling everything manually.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Star className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Reviews, profiles, and trust</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Ratings and profile details help homeowners choose local handymen with more
                    confidence.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Wrench className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Built for practical home jobs</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    SaskHandy is focused on the everyday home repair and maintenance jobs that
                    homeowners actually search for.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Major Saskatchewan locations
            </h2>
            <p className="mt-4 max-w-3xl text-slate-600 leading-8">
              We are building stronger visibility for local handyman services in major Saskatchewan
              cities and surrounding communities.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {cities.map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {city}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
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
        </section>
      </main>
    </div>
  );
}