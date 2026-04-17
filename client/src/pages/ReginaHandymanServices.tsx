import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";

const services = [
  "Furniture assembly in Regina",
  "TV wall mounting",
  "Leaky faucet repair in Regina",
  "Light fixture installation",
  "Drywall patch repair",
  "Interior painting services",
  "Fence and gutter repair",
  "Yard work and seasonal maintenance",
];

export default function ReginaHandymanServicesPage() {
  useEffect(() => {
    document.title = "Handyman Services in Regina | SaskHandy";

    const metaDescription = document.querySelector('meta[name="description"]');
    const content =
      "Find handyman services in Regina with SaskHandy for furniture assembly, TV wall mounting, plumbing repairs, electrical help, drywall repair, painting, gutter cleaning, and yard work.";

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
                  Local handyman services in Regina
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Handyman Services in Regina for Home Repairs, TV Mounting, Painting, and Yard Work
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  SaskHandy helps Regina homeowners find local handyman services for furniture
                  assembly, TV wall mounting, leaky faucet repair, drywall patching, light fixture
                  installation, painting touch-ups, fence repair, gutter work, and other home
                  maintenance jobs.
                </p>

                <p className="mt-4 max-w-3xl text-slate-600 leading-8">
                  If you are looking for a simpler way to hire local help in Regina, you can post a
                  job, compare bids, message handymen, and manage the process in one place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href="/sign-up">
                      Find a Regina Handyman
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
              Common handyman jobs in Regina
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              Regina homeowners often need help with practical repair work, seasonal maintenance,
              and smaller installations that still need a reliable local handyman.
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
                  Homeowners can make stronger decisions with visible reviews, profile details, and better communication.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Built for practical jobs</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  SaskHandy is built around the real search intent behind terms like handyman
                  services Regina, gutter repair Regina, painting services Regina, and TV mounting Regina.
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
                If you are searching for a Regina handyman for repairs, painting, plumbing help,
                electrical help, TV wall mounting, drywall patch repair, or seasonal yard work,
                SaskHandy is designed to make the process simpler.
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