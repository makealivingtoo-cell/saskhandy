import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";

const services = [
  "Furniture assembly in Saskatoon",
  "TV mounting and wall installations",
  "Drywall patching and repairs",
  "Minor plumbing help",
  "Small electrical jobs",
  "Painting and touch-ups",
  "Door, trim, and hardware fixes",
  "Seasonal yard help",
];

export default function SaskatoonHandymanServicesPage() {
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
            <Link href="/sign-up">Post a Job</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                <MapPin className="h-4 w-4" />
                Local handyman services in Saskatoon
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Handyman Services in Saskatoon
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Looking for handyman services in Saskatoon? SaskHandy helps homeowners in Saskatoon
                post home repair jobs, compare bids from local handymen, and manage the job process
                in one place. From small repairs to practical installation work, the goal is to make
                hiring local help simpler and more trustworthy.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Find a Saskatoon Handyman
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/saskatchewan-handyman-services">View Saskatchewan Page</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-slate-200">
          <div className="container py-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Popular handyman jobs in Saskatoon
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              Many Saskatoon homeowners need help with practical home maintenance and repair work
              that is too small for a large contractor but still important to get done properly.
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
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200 p-6">
                <ShieldCheck className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Compare bids locally</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Post your job once and compare responses from handymen serving Saskatoon and nearby areas.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Star className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Choose with more confidence</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Reviews, profiles, and clearer communication help homeowners make better hiring decisions.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Better for everyday home jobs</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  SaskHandy is designed around the smaller repair and maintenance jobs that homeowners often struggle to book.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Saskatoon handyman help, without the usual mess
              </h2>
              <p className="mt-4 text-slate-600 leading-8">
                Instead of searching through scattered listings or relying on social media posts,
                homeowners in Saskatoon can use one place to post jobs, compare bids, and move
                forward with more clarity.
              </p>

              <div className="mt-8">
                <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Post Your Job in Saskatoon
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}