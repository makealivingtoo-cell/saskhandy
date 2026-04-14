import SeoLandingPage from "@/components/SeoLandingPage";

export default function ElectricalHelpSaskatchewanPage() {
  return (
    <SeoLandingPage
      title="Electrical Help in Saskatchewan"
      pageTitle="Electrical Help Saskatchewan | SaskHandy"
      metaDescription="Find electrical help in Saskatchewan for light fixture installation, outlet replacement, ceiling fan installation, and other small electrical jobs with SaskHandy."
      badge="Small electrical help across Saskatchewan"
      intro="SaskHandy helps homeowners find electrical help in Saskatchewan for small home jobs like light fixture installation, outlet replacement, switch replacement, ceiling fan installation, and similar tasks."
      secondaryIntro="This page is focused on the smaller electrical jobs homeowners often search for when they want practical local help."
      heroImage="/images/hero-handyman.jpg"
      primaryCtaText="Book Electrical Help"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular electrical help jobs"
      sectionDescription="These are some of the common small electrical tasks homeowners search for in Saskatchewan."
      items={[
        "Light fixture installation",
        "Outlet replacement",
        "Switch replacement",
        "Ceiling fan installation",
        "Bathroom fan swap",
        "Wall sconce installation",
        "Basic lighting updates",
        "Small electrical fixes",
      ]}
      whyTitle="Why homeowners book electrical help through SaskHandy"
      whyParagraphs={[
        "Many homeowners need help with smaller electrical jobs like light fixture installation, outlet replacement, switch updates, and ceiling fan installs.",
        "SaskHandy gives homeowners a clearer way to find practical local help for these everyday electrical tasks without overcomplicating the process.",
      ]}
      bottomTitle="Need local electrical help in Saskatchewan?"
      bottomParagraph="SaskHandy is expanding coverage for small home installation and repair work, including electrical help in major Saskatchewan cities and nearby communities."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}