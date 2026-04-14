import SeoLandingPage from "@/components/SeoLandingPage";

export default function YardWorkSaskatchewanPage() {
  return (
    <SeoLandingPage
      title="Yard Work and Maintenance in Saskatchewan"
      pageTitle="Yard Work Saskatchewan | SaskHandy"
      metaDescription="Find yard work and maintenance in Saskatchewan for gutter cleaning, fence repair, seasonal cleanup, small outdoor jobs, and general property maintenance."
      badge="Yard work and maintenance across Saskatchewan"
      intro="SaskHandy helps homeowners find yard work and maintenance in Saskatchewan for seasonal cleanup, gutter cleaning, fence repair, small outdoor projects, and practical property upkeep."
      secondaryIntro="Yard work is highly seasonal in Saskatchewan, which makes it a strong service area for homeowners looking for fast local help."
      heroImage="/images/homeowner-posting-job.jpg"
      primaryCtaText="Book Yard Work"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Common yard work and outdoor jobs"
      sectionDescription="These are the types of outdoor and seasonal jobs homeowners often need help with."
      items={[
        "Gutter cleaning",
        "Fence repair",
        "Spring cleanup",
        "Fall cleanup",
        "Yard maintenance",
        "Small outdoor fixes",
        "Property tidy-up",
        "Seasonal exterior help",
      ]}
      whyTitle="Why yard work pages matter for local SEO"
      whyParagraphs={[
        "Yard work and outdoor maintenance often spike seasonally, which makes them a strong opportunity for homeowner search traffic.",
        "A focused page targeting gutter cleaning, fence repair, and seasonal yard work helps SaskHandy capture local intent from homeowners who want practical outdoor help.",
      ]}
      bottomTitle="Looking for gutter cleaning or fence repair in Saskatchewan?"
      bottomParagraph="SaskHandy is building service pages around the real seasonal work homeowners search for, including yard maintenance, cleanup, and repair-focused outdoor jobs."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}