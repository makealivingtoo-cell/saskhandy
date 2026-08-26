import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Hammer,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  UserCheck,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";

type RelatedLink = {
  href: string;
  label: string;
};

type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

type FaqItem = {
  question: string;
  answer: string;
};

type SeoLandingPageProps = {
  title: string;
  pageTitle: string;
  metaDescription: string;
  canonicalPath?: string;
  serviceName?: string;
  locationName?: string;
  primaryCategory?: string;
  seoKeywords?: string[];
  faqItems?: FaqItem[];
  badge: string;
  intro: string;
  secondaryIntro?: string;
  heroImage:
    | "/images/hero-handyman.jpg"
    | "/images/homeowner-posting-job.jpg"
    | "/images/saskatchewan.jpg";
  primaryCtaText: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  sectionTitle: string;
  sectionDescription: string;
  items: string[];
  whyTitle: string;
  whyParagraphs: string[];
  bottomTitle: string;
  bottomParagraph: string;
  relatedLinks?: RelatedLink[];
  articleSections?: ArticleSection[];
};

export default function SeoLandingPage({
  title,
  pageTitle,
  metaDescription,
  canonicalPath,
  serviceName,
  locationName = "Saskatoon",
  primaryCategory = "Handyman Services",
  seoKeywords = [],
  faqItems = [],
  badge,
  intro,
  secondaryIntro,
  heroImage,
  primaryCtaText,
  primaryCtaHref = "/sign-up",
  secondaryCtaText,
  secondaryCtaHref,
  sectionTitle,
  sectionDescription,
  items,
  whyTitle,
  whyParagraphs,
  bottomTitle,
  bottomParagraph,
  relatedLinks = [],
  articleSections = [],
}: SeoLandingPageProps) {
  useEffect(() => {
    document.title = pageTitle;

    const siteUrl = "https://saskhandy.com";
    const canonicalUrl =
      canonicalPath && canonicalPath.startsWith("/")
        ? `${siteUrl}${canonicalPath}`
        : typeof window !== "undefined"
        ? `${siteUrl}${window.location.pathname}`
        : siteUrl;
    const locationHubPath: Record<string, string> = {
      Saskatoon: "/saskatoon-handyman-services",
      Regina: "/regina-handyman-services",
      Saskatchewan: "/saskatchewan-handyman-services",
      "Moose Jaw": "/moose-jaw-handyman-services",
      "Prince Albert": "/prince-albert-handyman-services",
      Warman: "/warman-handyman-services",
      Martensville: "/martensville-handyman-services",
    };
    const locationHubUrl = `${siteUrl}${locationHubPath[locationName] ?? "/saskatchewan-handyman-services"}`;

    const setMeta = (
      selector: string,
      attrName: "name" | "property",
      attrValue: string,
      content: string
    ) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    const setJsonLd = (id: string, data: Record<string, unknown>) => {
      let element = document.getElementById(id) as HTMLScriptElement | null;

      if (!element) {
        element = document.createElement("script");
        element.id = id;
        element.type = "application/ld+json";
        document.head.appendChild(element);
      }

      element.textContent = JSON.stringify(data);
    };

    setMeta('meta[name="description"]', "name", "description", metaDescription);
    setMeta('meta[property="og:title"]', "property", "og:title", pageTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", metaDescription);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "SaskHandy");
    setMeta('meta[property="og:image"]', "property", "og:image", `${siteUrl}${heroImage}`);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", pageTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", metaDescription);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", `${siteUrl}${heroImage}`);

    setMeta('meta[name="robots"]', "name", "robots", "index, follow, max-image-preview:large");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;

    setJsonLd("saskhandy-service-schema", {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: serviceName ?? title,
      serviceType: serviceName ?? primaryCategory,
      category: primaryCategory,
      description: metaDescription,
      areaServed: {
        "@type": "City",
        name: locationName,
        addressRegion: "SK",
        addressCountry: "CA",
      },
      provider: {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "SaskHandy",
        url: siteUrl,
      },
      url: canonicalUrl,
    });

    setJsonLd("saskhandy-breadcrumb-schema", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: locationName === "Saskatchewan" ? "Saskatchewan handyman services" : `${locationName} handyman services`,
          item: locationHubUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: serviceName ?? title,
          item: canonicalUrl,
        },
      ],
    });

    if (faqItems.length > 0) {
      setJsonLd("saskhandy-faq-schema", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      });
    } else {
      document.getElementById("saskhandy-faq-schema")?.remove();
    }

    return () => {
      document.getElementById("saskhandy-service-schema")?.remove();
      document.getElementById("saskhandy-breadcrumb-schema")?.remove();
      document.getElementById("saskhandy-faq-schema")?.remove();
    };
  }, [
    pageTitle,
    metaDescription,
    canonicalPath,
    heroImage,
    serviceName,
    locationName,
    primaryCategory,
    seoKeywords,
    faqItems,
    title,
  ]);

  const hasArticleContent = articleSections.length > 0;
  const hasSeoKeywords = seoKeywords.length > 0;
  const hasFaqItems = faqItems.length > 0;

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
        <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
          <div className="container py-3 text-sm text-slate-600">
            <Link href="/" className="hover:text-emerald-800">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page">{serviceName ?? title} in {locationName}</span>
          </div>
        </nav>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-4xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <MapPin className="h-4 w-4" />
                  {badge}
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  {title}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>

                {secondaryIntro ? (
                  <p className="mt-4 max-w-3xl text-slate-600 leading-8">{secondaryIntro}</p>
                ) : null}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href={primaryCtaHref}>
                      {primaryCtaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  {secondaryCtaText && secondaryCtaHref ? (
                    <Button asChild size="lg" variant="outline" className="rounded-full">
                      <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src={heroImage}
                    alt={`${serviceName ?? primaryCategory} in ${locationName}`}
                    className="block h-[420px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="container py-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{sectionTitle}</h2>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">{sectionDescription}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-emerald-50/50">
          <div className="container py-14 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                  Safety First
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Review who you’re hiring before you choose
                </h2>

                <p className="mt-4 text-lg leading-8 text-slate-600">
                  SaskHandy helps you compare more than price. Before accepting a bid, review the
                  handyman’s profile photo, bio, skills, service area, reviews, external review
                  links, and verification badges.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-200 bg-white p-5 shadow-sm">
                  <UserCheck className="mb-3 h-5 w-5 text-emerald-700" />
                  <h3 className="font-semibold text-slate-900">ID Name Matched</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Handymen need approved ID Name Matched status before they can send bids.
                  </p>
                </div>

                <div className="rounded-[24px] border border-amber-200 bg-white p-5 shadow-sm">
                  <ShieldCheck className="mb-3 h-5 w-5 text-amber-700" />
                  <h3 className="font-semibold text-slate-900">Gold Shield</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Gold Shield means ID Name Matched plus Criminal Record Check Reviewed.
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <MessageSquare className="mb-3 h-5 w-5 text-emerald-700" />
                  <h3 className="font-semibold text-slate-900">Message before choosing</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ask about experience, availability, materials, service area, and past work.
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-700" />
                  <h3 className="font-semibold text-slate-900">Payment protection</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Payment is held through SaskHandy and released after you mark the job complete.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-xs leading-6 text-slate-500">
              Verification badges help you review trust signals, but they do not guarantee safety
              or replace your own judgment.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-16">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">{whyTitle}</h2>
                {whyParagraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-slate-600 leading-8">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 p-6">
                  <ShieldCheck className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Compare bids and profiles</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Post your job once, review local bids, compare profiles, and message before choosing.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Star className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Trust signals before you choose</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    Review ID Name Matched, Gold Shield, service area, external review links, and SaskHandy reviews.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 p-6">
                  <Wrench className="h-8 w-8 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Built for practical local jobs</h3>
                  <p className="mt-2 text-slate-600 leading-7">
                    SaskHandy is focused on everyday repair, installation, mounting, assembly, yard, and maintenance jobs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasSeoKeywords ? (
          <section className="border-t border-slate-200 bg-white">
            <div className="container py-12">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Common local searches
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                  Looking for {serviceName ?? primaryCategory} near you in {locationName}?
                </h2>
                <p className="mt-3 text-slate-600 leading-7">
                  SaskHandy helps homeowners looking for local help post a job, compare bids from
                  {locationName}-area handymen, review profiles, message before choosing, and pay
                  securely through the platform.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {seoKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {hasArticleContent ? (
          <section className="border-t border-slate-200 bg-white">
            <article className="container max-w-4xl py-16">
              <div className="mb-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  SaskHandy Guide
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Helpful guide for Saskatoon homeowners
                </h2>
              </div>

              <div className="space-y-12">
                {articleSections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                      {section.heading}
                    </h3>

                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-slate-600 leading-8">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {section.bullets && section.bullets.length > 0 ? (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-slate-600 leading-7">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-700" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {hasFaqItems ? (
          <section className="border-t border-slate-200 bg-white">
            <div className="container max-w-4xl py-16">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                FAQs
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Frequently asked questions about {serviceName ?? primaryCategory} in {locationName}
              </h2>

              <div className="mt-8 space-y-4">
                {faqItems.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="font-semibold text-slate-950">{faq.question}</h3>
                    <p className="mt-2 text-slate-600 leading-7">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">{bottomTitle}</h2>
              <p className="mt-4 text-slate-600 leading-8">{bottomParagraph}</p>

              <div className="mt-8 rounded-[28px] border border-emerald-200 bg-white p-6">
                <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Ready to compare local bids?
                    </p>
                    <p className="mt-2 text-slate-600 leading-7">
                      Post your job, review handyman trust signals, message before choosing, and
                      pay securely through SaskHandy.
                    </p>
                  </div>

                  <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                    <Link href={primaryCtaHref}>
                      {primaryCtaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {relatedLinks.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-8">
                <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href={primaryCtaHref}>
                    {primaryCtaText}
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