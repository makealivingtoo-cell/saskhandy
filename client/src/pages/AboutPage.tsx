import { Button } from "@/components/ui/button";
import { Hammer, ArrowRight, ShieldCheck, Users, MapPin } from "lucide-react";
import { Link } from "wouter";

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
                  SaskHandy is a local marketplace that helps homeowners in Saskatchewan find trusted
                  help for everyday home jobs. We make it easier to post jobs, compare bids, chat
                  with local handymen, and pay securely in one place.
                </p>
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
                  Post a job once and receive bids from local handymen without chasing leads across
                  multiple platforms.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <Hammer className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">For handymen</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Find local jobs, send bids, and build trust through ratings, reviews, and a clean
                  profile experience.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 p-6">
                <ShieldCheck className="h-8 w-8 text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">For trust</h2>
                <p className="mt-2 text-slate-600 leading-7">
                  Keep communication and payments inside the platform to create a safer and simpler
                  hiring process.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Why we built it
              </h2>
              <p className="mt-4 text-slate-600 leading-8">
                Many homeowners still rely on social media groups, scattered referrals, and slow
                back-and-forth messaging just to get simple home jobs done. SaskHandy was created
                to give Saskatchewan homeowners a cleaner way to hire local help for repairs,
                maintenance, installations, yard work, and other everyday tasks.
              </p>
              <p className="mt-4 text-slate-600 leading-8">
                We also want to help local handymen grow by making it easier for them to discover
                real jobs, quote confidently, and build a strong reputation over time.
              </p>

              <div className="mt-8">
                <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Join SaskHandy
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