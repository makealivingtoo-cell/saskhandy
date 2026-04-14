import SeoLandingPage from "@/components/SeoLandingPage";

export default function DrywallPaintingSaskatchewanPage() {
  return (
    <SeoLandingPage
      title="Drywall Repair and Painting in Saskatchewan"
      pageTitle="Drywall Repair and Painting Saskatchewan | SaskHandy"
      metaDescription="Find drywall repair and painting in Saskatchewan for drywall patch repair, wall touch-ups, interior painting, and small home finishing jobs."
      badge="Drywall and painting services across Saskatchewan"
      intro="SaskHandy helps homeowners find drywall repair and painting in Saskatchewan for patch jobs, wall touch-ups, interior painting, and other small finishing jobs around the home."
      secondaryIntro="These are the kinds of repair and improvement tasks that homeowners often postpone, even though they make a big difference once completed."
      heroImage="/images/saskatchewan.jpg"
      primaryCtaText="Book Drywall or Painting Help"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular drywall and painting jobs"
      sectionDescription="These are some of the most common drywall repair and painting tasks homeowners search for."
      items={[
        "Drywall patch repair",
        "Wall damage repair",
        "Interior painting",
        "Paint touch-ups",
        "Hole patching",
        "Trim painting",
        "Small room painting",
        "Finishing repairs",
      ]}
      whyTitle="Why homeowners use SaskHandy for drywall repair and painting"
      whyParagraphs={[
        "Drywall patching, wall touch-ups, and small painting jobs are common home tasks that homeowners often put off even though they make a big difference once finished.",
        "SaskHandy helps homeowners find local help for practical finishing work across Saskatchewan, from drywall repair to interior painting and touch-up jobs.",
      ]}
      bottomTitle="Need drywall patching or painting help in Saskatchewan?"
      bottomParagraph="SaskHandy is building better local visibility for common home repair and finishing jobs, including drywall repair and painting services."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}