import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";

const services = [
  "Furniture assembly in Saskatoon",
  "TV mounting in Saskatoon",
  "Leaky faucet repair",
  "Light fixture installation",
  "Drywall patch repair",
  "Interior painting touch-ups",
  "Yard work and seasonal cleanup",
  "Fence and gutter repair",
];

export default function SaskatoonHandymanServicesPage() {
  useEffect(() => {
    document.title = "Handyman Services in Saskatoon | SaskHandy";

    const metaDescription = document.querySelector('meta[name="description"]');
    const content =
      "Looking for handyman services in Saskatoon? Find local help for furniture assembly, TV mounting, plumbing repairs, electrical help, drywall repair, painting, and yard work with SaskHandy.";

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
                  Local handyman services in Saskatoon
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Handyman Services in Saskatoon for Home Repairs, TV Mounting, Plumbing Help, and More
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  Looking for handyman services in Saskatoon? SaskHandy helps homeowners in
                  Saskatoon find local help for furniture assembly, TV mounting, drywall patch
                  repair, leaky faucet repair, light fixture installation, interior painting
                  touch-ups, yard work, and other everyday home repair jobs.
                </p>

                <p className="mt-4 max-w-3xl text-slate-600 leading-8">
                  Instead of relying on scattered listings or social media posts, you can post a
                  job, compare bids, message local handymen, and manage the work in one place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Find a Saskatoon Handyman
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link href="/saskatchewan-handyman-services">Saskatchewan Services</Link>
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
              Popular handyman jobs in Saskatoon
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              Many Saskatoon homeowners need practical local help for installation, maintenance,
              repair, and seasonal home jobs.
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
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Compare local bids</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Post your job once and compare responses from handymen serving Saskatoon and
                  nearby areas.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Star className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Reviews and trust</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Profiles, ratings, and clearer communication help homeowners choose with more confidence.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Better for everyday jobs</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  SaskHandy is designed for the real jobs homeowners search for, from TV wall
                  mounting to drywall patching and light fixture installation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Saskatoon handyman help without the usual back-and-forth
              </h2>
              <p className="mt-4 text-slate-600 leading-8">
                If you are searching for a local Saskatoon handyman for repairs, maintenance, TV
                mounting, plumbing help, electrical help, painting, or yard work, SaskHandy is
                built to make the hiring process simpler.
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