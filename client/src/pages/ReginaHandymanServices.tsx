import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";

const services = [
  "Furniture assembly in Regina",
  "TV wall mounting",
  "Minor plumbing jobs",
  "Painting and touch-ups",
  "Small home repair work",
  "Drywall patching",
  "Door and trim fixes",
  "Yard and seasonal help",
];

export default function ReginaHandymanServicesPage() {
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
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-4xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <MapPin className="h-4 w-4" />
                  Local handyman services in Regina
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Handyman Services in Regina
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  SaskHandy helps Regina homeowners connect with local handymen for everyday home
                  repairs, installations, maintenance work, and other practical jobs around the house.
                  If you are looking for a simpler way to hire local help in Regina, post a job and
                  compare bids in one place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Find a Regina Handyman
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link href="/saskatchewan-handyman-services">View Saskatchewan Page</Link>
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

        <section className="bg-white border-b border-slate-200">
          <div className="container py-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Common handyman jobs in Regina
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              Regina homeowners often need help with practical repair work, small installations,
              and maintenance jobs that need a reliable local handyman.
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
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Clearer local hiring</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Post your job once and compare bids from handymen serving Regina and surrounding areas.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Star className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Profiles and reviews</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Homeowners can make better choices with visible profile details, communication, and reviews.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Built for practical home jobs</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  SaskHandy is aimed at the everyday tasks that homeowners want done properly without overcomplicating the process.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                A better way to find handyman services in Regina
              </h2>
              <p className="mt-4 text-slate-600 leading-8">
                SaskHandy is designed to help Regina homeowners move faster from job posting to
                completed work, without the confusion that usually comes with fragmented hiring.
              </p>

              <div className="mt-8">
                <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Post Your Job in Regina
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