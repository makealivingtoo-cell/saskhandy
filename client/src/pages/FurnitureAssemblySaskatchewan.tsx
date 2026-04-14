import SeoLandingPage from "@/components/SeoLandingPage";

export default function FurnitureAssemblySaskatchewanPage() {
  return (
    <SeoLandingPage
      title="Furniture Assembly in Saskatchewan"
      pageTitle="Furniture Assembly Saskatchewan | SaskHandy"
      metaDescription="Find furniture assembly in Saskatchewan with SaskHandy for bed frames, desks, shelves, IKEA furniture, dressers, and other home furniture setup."
      badge="Furniture assembly services across Saskatchewan"
      intro="SaskHandy helps homeowners find furniture assembly in Saskatchewan for bed frames, desks, shelving, dressers, dining sets, office furniture, and other home setup jobs."
      secondaryIntro="Whether you need help with IKEA furniture assembly in Saskatoon, a desk setup in Regina, or general furniture assembly in a growing Saskatchewan community, SaskHandy makes it easier to post the job and compare bids."
      heroImage="/images/hero-handyman.jpg"
      primaryCtaText="Book Furniture Assembly"
      secondaryCtaText="View Saskatchewan Services"
      secondaryCtaHref="/saskatchewan-handyman-services"
      sectionTitle="Popular furniture assembly jobs"
      sectionDescription="These are some of the furniture assembly tasks Saskatchewan homeowners commonly need help with."
      items={[
        "IKEA furniture assembly",
        "Bed frame assembly",
        "Desk and office setup",
        "Bookshelf assembly",
        "Dining table setup",
        "Dresser assembly",
        "TV stand assembly",
        "Nursery furniture setup",
      ]}
      whyTitle="Why homeowners use SaskHandy for furniture assembly"
      whyParagraphs={[
        "Furniture assembly is one of the most common handyman jobs because it saves time, reduces frustration, and helps homeowners avoid mistakes during setup.",
        "Whether it is a bed frame, desk, bookshelf, dresser, or IKEA furniture build, SaskHandy gives homeowners a clearer way to find local help for practical assembly jobs across Saskatchewan.",
      ]}
      bottomTitle="Need furniture assembly in Saskatoon, Regina, or nearby?"
      bottomParagraph="We are building stronger visibility for furniture assembly and handyman help across Saskatchewan, including Saskatoon, Regina, Moose Jaw, Prince Albert, Warman, and Martensville."
      relatedLinks={[
        { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
        { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      ]}
    />
  );
}