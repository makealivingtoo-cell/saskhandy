import SeoLandingPage from "@/components/SeoLandingPage";

export default function PrinceAlbertHandymanServicesPage() {
  return (
    <SeoLandingPage
      title="Handyman Services in Prince Albert"
      pageTitle="Handyman Services Prince Albert | SaskHandy"
      metaDescription="Find handyman services in Prince Albert for furniture assembly, TV mounting, repairs, painting, plumbing help, yard work, and local home maintenance jobs."
      badge="Local handyman services in Prince Albert"
      intro="SaskHandy helps homeowners in Prince Albert find local handyman services for home repairs, maintenance tasks, furniture assembly, TV mounting, painting, and yard work."
      secondaryIntro="This page is designed to support homeowners searching for practical local help in Prince Albert for the everyday home jobs that often get delayed."
      heroImage="/images/homeowner-posting-job.jpg"
      primaryCtaText="Find a Prince Albert Handyman"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular handyman jobs in Prince Albert"
      sectionDescription="These are some of the common home jobs Prince Albert homeowners search for."
      items={[
        "Furniture assembly",
        "TV wall mounting",
        "Drywall patch repair",
        "Painting touch-ups",
        "Leaky faucet repair",
        "Yard work",
        "Fence repair",
        "General home maintenance",
      ]}
      whyTitle="Why Prince Albert homeowners use SaskHandy"
      whyParagraphs={[
        "Prince Albert homeowners often need practical local help for repairs, maintenance work, furniture assembly, painting, and smaller home projects that still matter.",
        "SaskHandy is designed to make that process simpler by helping homeowners compare local options and manage the job in one place.",
      ]}
      bottomTitle="Need a handyman in Prince Albert?"
      bottomParagraph="SaskHandy is building stronger city-level pages across Saskatchewan so homeowners in Prince Albert can find more relevant local handyman results."
      relatedLinks={[
        { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}