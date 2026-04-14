import SeoLandingPage from "@/components/SeoLandingPage";

export default function WarmanHandymanServicesPage() {
  return (
    <SeoLandingPage
      title="Handyman Services in Warman"
      pageTitle="Handyman Services Warman | SaskHandy"
      metaDescription="Find handyman services in Warman for home repairs, furniture assembly, TV mounting, painting, plumbing help, drywall repair, and yard work."
      badge="Local handyman services in Warman"
      intro="SaskHandy helps homeowners in Warman find local handyman services for furniture assembly, TV mounting, home repairs, drywall patching, painting, yard work, and other practical jobs."
      secondaryIntro="Warman homeowners often need local help for the smaller jobs that still matter, and this page is built to support those searches more directly."
      heroImage="/images/saskatchewan.jpg"
      primaryCtaText="Find a Warman Handyman"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular handyman jobs in Warman"
      sectionDescription="These are the kinds of local home jobs Warman homeowners commonly need help with."
      items={[
        "Furniture assembly",
        "TV mounting",
        "Painting touch-ups",
        "Drywall repair",
        "Minor plumbing help",
        "Yard work",
        "Fence repair",
        "General handyman help",
      ]}
      whyTitle="Why a Warman location page helps"
      whyParagraphs={[
        "Warman is exactly the kind of growing area where homeowners search for practical local help rather than broad province-wide results.",
        "A dedicated Warman page gives SaskHandy a better chance to rank for city-specific handyman searches and local service intent.",
      ]}
      bottomTitle="Looking for a local handyman in Warman?"
      bottomParagraph="SaskHandy is building city pages that help homeowners in Warman find local support for repair, maintenance, installation, and seasonal home jobs."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/martensville-handyman-services", label: "Martensville Handyman Services" },
      ]}
    />
  );
}