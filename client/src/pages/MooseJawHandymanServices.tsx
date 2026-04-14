import SeoLandingPage from "@/components/SeoLandingPage";

export default function MooseJawHandymanServicesPage() {
  return (
    <SeoLandingPage
      title="Handyman Services in Moose Jaw"
      pageTitle="Handyman Services Moose Jaw | SaskHandy"
      metaDescription="Find handyman services in Moose Jaw for home repairs, TV mounting, furniture assembly, plumbing help, painting, yard work, and practical local home jobs."
      badge="Local handyman services in Moose Jaw"
      intro="SaskHandy helps homeowners in Moose Jaw find local handyman services for repairs, installations, maintenance jobs, and everyday home projects."
      secondaryIntro="From furniture assembly and TV mounting to painting touch-ups, minor plumbing help, and seasonal yard work, SaskHandy is built to make local hiring easier."
      heroImage="/images/hero-handyman.jpg"
      primaryCtaText="Find a Moose Jaw Handyman"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular handyman jobs in Moose Jaw"
      sectionDescription="These are some of the practical home jobs Moose Jaw homeowners often need help with."
      items={[
        "Furniture assembly",
        "TV mounting",
        "Minor plumbing help",
        "Painting touch-ups",
        "Yard work",
        "Drywall patch repair",
        "Fence repair",
        "Small home fixes",
      ]}
      whyTitle="Why Moose Jaw homeowners use SaskHandy"
      whyParagraphs={[
        "SaskHandy gives Moose Jaw homeowners a cleaner way to find local help for everyday home repairs, furniture assembly, TV mounting, painting, and maintenance tasks.",
        "Instead of relying on scattered listings or informal referrals, homeowners can post a job, compare bids, and move forward with more clarity.",
      ]}
      bottomTitle="Looking for local handyman services in Moose Jaw?"
      bottomParagraph="SaskHandy is building hyper-local visibility across Saskatchewan so homeowners searching in Moose Jaw can find practical home repair and maintenance help more easily."
      relatedLinks={[
        { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
      ]}
    />
  );
}