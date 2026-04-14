import SeoLandingPage from "@/components/SeoLandingPage";

export default function PlumbingRepairsSaskatchewanPage() {
  return (
    <SeoLandingPage
      title="Plumbing Repairs in Saskatchewan"
      pageTitle="Plumbing Repairs Saskatchewan | SaskHandy"
      metaDescription="Find plumbing repairs in Saskatchewan for leaky faucets, toilet fixes, sink issues, fixture replacement, and other small plumbing jobs with SaskHandy."
      badge="Small plumbing repair help across Saskatchewan"
      intro="SaskHandy helps homeowners find local help for plumbing repairs in Saskatchewan, including leaky faucet repair, toilet problems, sink issues, fixture replacement, and other small plumbing jobs."
      secondaryIntro="This page is focused on practical handyman plumbing help for the everyday problems homeowners want fixed quickly."
      heroImage="/images/saskatchewan.jpg"
      primaryCtaText="Book Plumbing Help"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Common small plumbing jobs"
      sectionDescription="These are some of the small plumbing repair jobs homeowners often search for."
      items={[
        "Leaky faucet repair",
        "Toilet repair",
        "Sink fixture replacement",
        "Shower head replacement",
        "Drain issue help",
        "Bathroom fixture installation",
        "Kitchen fixture swaps",
        "Minor plumbing maintenance",
      ]}
      whyTitle="Why plumbing repair pages matter"
      whyParagraphs={[
        "Small plumbing issues often turn into urgent searches because homeowners want the problem solved quickly before it gets worse.",
        "By targeting terms like leaky faucet repair, toilet repair, and fixture installation in Saskatchewan, SaskHandy can capture practical service searches with clear intent.",
      ]}
      bottomTitle="Need leaky faucet or fixture repair in Saskatoon or Regina?"
      bottomParagraph="SaskHandy is building local and service-focused pages so homeowners searching for plumbing help can find city-relevant options more easily."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}