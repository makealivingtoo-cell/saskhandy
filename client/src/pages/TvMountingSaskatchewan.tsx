import SeoLandingPage from "@/components/SeoLandingPage";

export default function TvMountingSaskatchewanPage() {
  return (
    <SeoLandingPage
      title="TV Mounting in Saskatchewan"
      pageTitle="TV Mounting Saskatchewan | SaskHandy"
      metaDescription="Looking for TV mounting in Saskatchewan? Find local help for TV wall mounting, bracket installation, home theater setup, cable management, and living room TV installation."
      badge="TV mounting services across Saskatchewan"
      intro="SaskHandy helps homeowners find TV mounting in Saskatchewan for wall-mounted TVs, bracket installation, cable management, media wall setup, and simple home theater installation."
      secondaryIntro="TV wall mounting is one of the most practical handyman jobs for homeowners who want a clean setup without guessing about alignment, placement, or hardware."
      heroImage="/images/homeowner-posting-job.jpg"
      primaryCtaText="Book TV Mounting"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular TV mounting jobs"
      sectionDescription="These are some of the most common TV wall mounting and setup jobs homeowners search for in Saskatchewan."
      items={[
        "TV wall mounting",
        "Bracket installation",
        "Cable concealment",
        "Home theater setup",
        "Living room TV setup",
        "Bedroom TV installation",
        "Media console setup",
        "Soundbar mounting",
      ]}
      whyTitle="Why homeowners book TV mounting through SaskHandy"
      whyParagraphs={[
        "TV mounting is a practical job that many homeowners want done properly the first time, especially when placement, wall hardware, and room setup matter.",
        "SaskHandy helps homeowners find local help for TV wall mounting, bracket installation, and home theater setup without relying on scattered listings or rushed last-minute referrals.",
      ]}
      bottomTitle="Looking for TV wall mounting in Saskatoon or Regina?"
      bottomParagraph="If you want local help for TV mounting, bracket installation, or home theater setup, SaskHandy is building pages that make it easier to find the right service in the right city."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}