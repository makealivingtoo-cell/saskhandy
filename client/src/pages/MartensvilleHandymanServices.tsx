import SeoLandingPage from "@/components/SeoLandingPage";

export default function MartensvilleHandymanServicesPage() {
  return (
    <SeoLandingPage
      title="Handyman Services in Martensville"
      pageTitle="Handyman Services Martensville | SaskHandy"
      metaDescription="Find handyman services in Martensville for home repairs, TV mounting, furniture assembly, painting, minor plumbing help, drywall repair, and yard work."
      badge="Local handyman services in Martensville"
      intro="SaskHandy helps homeowners in Martensville find local handyman services for furniture assembly, TV mounting, small home repairs, painting, drywall patching, yard work, and practical maintenance jobs."
      secondaryIntro="This page is designed to support homeowners in Martensville who want a simpler way to find local help for the everyday jobs that keep piling up."
      heroImage="/images/hero-handyman.jpg"
      primaryCtaText="Find a Martensville Handyman"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular handyman jobs in Martensville"
      sectionDescription="These are the kinds of home jobs Martensville homeowners often search for."
      items={[
        "Furniture assembly",
        "TV wall mounting",
        "Drywall patch repair",
        "Interior painting",
        "Minor plumbing help",
        "Yard work",
        "Seasonal maintenance",
        "General home repairs",
      ]}
      whyTitle="Why a Martensville page strengthens local reach"
      whyParagraphs={[
        "Martensville is a strong supporting location for Saskatoon-area visibility, and a dedicated page helps target city-based search intent more clearly.",
        "For homeowners looking for practical repair and maintenance help, a local page can make SaskHandy more visible for the right searches.",
      ]}
      bottomTitle="Need local handyman services in Martensville?"
      bottomParagraph="SaskHandy is expanding its local service footprint across Saskatchewan, including city-specific pages for communities like Martensville."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/warman-handyman-services", label: "Warman Handyman Services" },
      ]}
    />
  );
}