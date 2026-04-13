import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer } from "lucide-react";
import { Link } from "wouter";

const posts = [
  {
    slug: "how-to-hire-a-handyman-in-saskatchewan",
    title: "How to Hire a Handyman in Saskatchewan",
    excerpt:
      "A practical guide for homeowners who want to compare bids, check reviews, and hire with more confidence.",
  },
  {
    slug: "small-home-jobs-you-should-not-put-off",
    title: "Small Home Jobs You Should Not Put Off",
    excerpt:
      "From loose fixtures to minor plumbing leaks, these are the home repairs that can become expensive if ignored.",
  },
  {
    slug: "what-homeowners-should-ask-before-accepting-a-bid",
    title: "What Homeowners Should Ask Before Accepting a Bid",
    excerpt:
      "A simple checklist to help you review availability, pricing, and job scope before choosing a handyman.",
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
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">
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
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                SaskHandy Blog
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Home repair tips, hiring advice, and local homeowner content for people looking for
                handyman services in Saskatchewan.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Homeowner Tips
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">
                    {post.title}
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">{post.excerpt}</p>
                  <div className="mt-5">
                    <Link
                      href="/sign-up"
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
      </main>
    </div>
  );
}