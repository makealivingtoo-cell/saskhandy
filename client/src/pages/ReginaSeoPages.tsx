import SeoLandingPage from "@/components/SeoLandingPage";

const homeownerCta = "Post Your Job";

const reginaCoreLinks = [
  { href: "/regina-handyman-services", label: "Regina Handyman Services" },
  { href: "/local-handyman-services-regina", label: "Local Handyman Services Regina" },
  { href: "/tv-mounting-regina", label: "TV Mounting Regina" },
  { href: "/furniture-assembly-regina", label: "Furniture Assembly Regina" },
  { href: "/drywall-repair-regina", label: "Drywall Repair Regina" },
  { href: "/fence-repair-regina", label: "Fence Repair Regina" },
  { href: "/deck-repair-regina", label: "Deck Repair Regina" },
  { href: "/minor-plumbing-handyman-regina", label: "Minor Plumbing Handyman Regina" },
  { href: "/interior-painting-handyman-regina", label: "Interior Painting Handyman Regina" },
  { href: "/ring-doorbell-installation-regina", label: "Ring Doorbell Installation Regina" },
];

type ReginaPageProps = {
  title: string;
  pageTitle: string;
  metaDescription: string;
  badge: string;
  intro: string;
  secondaryIntro: string;
  sectionTitle: string;
  sectionDescription: string;
  items: string[];
  whyTitle: string;
  whyParagraphs: string[];
  bottomTitle: string;
  bottomParagraph: string;
  articleSections: {
    heading: string;
    paragraphs: string[];
    bullets: string[];
  }[];
};

function buildArticleSections(serviceName: string, bullets: string[]) {
  return [
    {
      heading: `${serviceName} in Regina: what homeowners should know`,
      paragraphs: [
        `When Regina homeowners need help with ${serviceName.toLowerCase()}, clear details make the job easier to quote. Photos, measurements, timing, materials, access notes, and any existing damage can help local handymen understand the scope before sending a bid.`,
        `SaskHandy is a marketplace, not a single contractor. Homeowners can post a job, compare available bids, review profiles, message before choosing, and use SaskHandy's payment flow when hiring through the platform.`,
        `As SaskHandy expands in Regina, these pages help homeowners describe real jobs and help local handymen understand what people are looking for.`
      ],
      bullets,
    },
    {
      heading: `What can affect the quote`,
      paragraphs: [
        `Pricing can depend on the size of the job, the materials needed, the condition of the existing area, access, urgency, tools required, cleanup, and whether the homeowner already has parts or supplies.`,
        `A small job can become more involved if old parts need to be removed, hidden damage is found, measurements are unusual, or special hardware is required.`,
        `Before accepting a bid, homeowners should confirm what is included, whether materials are extra, and whether the handyman has experience with similar work.`
      ],
      bullets: [
        "Add photos whenever possible.",
        "Mention whether materials or parts are already purchased.",
        "Describe timing, access, parking, pets, stairs, or condo rules.",
        "Use chat to confirm scope before choosing a handyman.",
      ],
    },
    {
      heading: `How SaskHandy helps Regina homeowners`,
      paragraphs: [
        `SaskHandy gives homeowners a simple way to turn a repair or installation need into a clear job post. Instead of calling around one by one, homeowners can explain the task once and let available local handymen respond.`,
        `For handymen, SaskHandy creates a place to build a profile, list skills, show service areas, and get matched with relevant jobs as the Regina marketplace grows.`,
        `The best results come from clear communication. Homeowners should describe the job honestly, and handymen should bid only on work that fits their skills, tools, schedule, and service area.`
      ],
      bullets: [
        "Post one clear job request.",
        "Compare available bids in one place.",
        "Review profiles and trust signals where available.",
        "Message before choosing who to hire.",
      ],
    },
  ];
}

function ReginaSeoPage(props: ReginaPageProps) {
  return (
    <SeoLandingPage
      title={props.title}
      pageTitle={props.pageTitle}
      metaDescription={props.metaDescription}
      badge={props.badge}
      intro={props.intro}
      secondaryIntro={props.secondaryIntro}
      heroImage="/images/hero-handyman.jpg"
      primaryCtaText={homeownerCta}
      sectionTitle={props.sectionTitle}
      sectionDescription={props.sectionDescription}
      items={props.items}
      whyTitle={props.whyTitle}
      whyParagraphs={props.whyParagraphs}
      articleSections={props.articleSections}
      bottomTitle={props.bottomTitle}
      bottomParagraph={props.bottomParagraph}
      relatedLinks={reginaCoreLinks}
    />
  );
}

export function LocalHandymanServicesReginaPage() {
  return (
    <ReginaSeoPage
      title="Local Handyman Services in Regina"
      pageTitle="Local Handyman Services Regina | Post a Job & Compare Bids | SaskHandy"
      metaDescription="Need local handyman services in Regina? Post small home jobs on SaskHandy, compare available bids, review profiles, and message before choosing."
      badge="Local handyman services in Regina"
      intro="SaskHandy helps Regina homeowners post small home jobs and connect with available local handymen as the marketplace grows."
      secondaryIntro="Post your job, describe what you need done, compare bids when available, review profiles, message before choosing, and use SaskHandy's secure payment flow when hiring through the platform."
      sectionTitle="Common Regina handyman jobs"
      sectionDescription="Use SaskHandy for practical repair, installation, assembly, and maintenance jobs around the house."
      items={["Small home repairs", "Furniture assembly", "TV mounting", "Drywall patching", "Fence and gate repairs", "Deck repairs", "Minor plumbing help", "Interior painting"]}
      whyTitle="Why use SaskHandy for Regina handyman services?"
      whyParagraphs={[
        "SaskHandy gives homeowners a simple way to post the job once instead of calling around one by one.",
        "The platform is designed around comparing bids, reviewing profiles, messaging before choosing, and keeping job communication organized.",
        "Regina service pages help local handymen understand what homeowners are searching for as SaskHandy expands in the city.",
      ]}
      articleSections={buildArticleSections("local handyman services", ["Repairs, installs, assembly, mounting, patching, painting, and maintenance.", "Add photos, budget range, timing, and location details.", "Use messaging to confirm scope before choosing."])}
      bottomTitle="Post a Regina handyman job"
      bottomParagraph="Tell SaskHandy what you need done and give local handymen the details they need to send useful bids."
    />
  );
}

export function TvMountingReginaPage() {
  return (
    <ReginaSeoPage
      title="TV Mounting in Regina"
      pageTitle="TV Mounting Regina | Wall Mounting & Local Handyman Help | SaskHandy"
      metaDescription="Need TV mounting in Regina? Post your job on SaskHandy and compare available bids for wall mounting, setup, and cable cleanup."
      badge="TV mounting in Regina"
      intro="Need a TV mounted safely and cleanly in Regina? SaskHandy helps homeowners post TV mounting jobs and compare local options."
      secondaryIntro="Include your TV size, wall type, mount type, cable needs, and room details so available handymen can understand the scope."
      sectionTitle="TV mounting jobs homeowners may need"
      sectionDescription="TV mounting can be simple or detailed depending on the wall, mount, room layout, and connected devices."
      items={["Wall-mounted TVs", "Full-motion mount installs", "Above-fireplace mounting", "Bedroom TV mounting", "Soundbar setup", "Cable cleanup", "Condo TV mounting", "Streaming device setup"]}
      whyTitle="What matters for a safe TV mounting job"
      whyParagraphs={["A safe TV mount depends on the wall structure, TV weight, mount rating, VESA pattern, viewing height, and hardware.", "Homeowners should mention whether the wall is drywall, brick, concrete, plaster, or above a fireplace.", "SaskHandy lets you clarify details through messaging before choosing who to hire."]}
      articleSections={buildArticleSections("TV mounting", ["TV size and weight", "Mount type: fixed, tilting, or full-motion", "Wall type and stud location", "Cable management and connected devices"])}
      bottomTitle="Post your Regina TV mounting job"
      bottomParagraph="Share your TV size, wall type, mount details, and photos so local handymen can bid more accurately."
    />
  );
}

export function FurnitureAssemblyReginaPage() {
  return (
    <ReginaSeoPage
      title="Furniture Assembly in Regina"
      pageTitle="Furniture Assembly Regina | IKEA, Wayfair & Home Furniture Help | SaskHandy"
      metaDescription="Need furniture assembly in Regina? Post your furniture assembly job on SaskHandy and compare available local handyman bids."
      badge="Furniture assembly in Regina"
      intro="SaskHandy helps Regina homeowners find local help for furniture assembly, setup, and small installation tasks."
      secondaryIntro="Post the item type, brand, number of pieces, room location, and whether packaging or old furniture needs to be moved."
      sectionTitle="Furniture assembly jobs"
      sectionDescription="From flat-pack furniture to patio sets, clear details help handymen quote the work accurately."
      items={["IKEA furniture assembly", "Wayfair furniture assembly", "Bed frames", "Dressers and cabinets", "Desks and office furniture", "Shelving units", "Patio furniture", "Exercise equipment"]}
      whyTitle="Why post furniture assembly on SaskHandy?"
      whyParagraphs={["Assembly jobs can be frustrating when instructions are unclear, pieces are heavy, or the item needs to be moved into place.", "Posting the job lets homeowners describe the item and compare available bids before choosing local help.", "Photos, product links, and the number of items can make bids more accurate."]}
      articleSections={buildArticleSections("furniture assembly", ["Include the brand and product link if possible.", "Mention how many items need assembly.", "Say whether the item is already in the correct room.", "Mention if wall anchoring or mounting is needed."])}
      bottomTitle="Post your Regina furniture assembly job"
      bottomParagraph="Add the furniture type, product details, photos, and timing so local handymen can understand the assembly work."
    />
  );
}

export function DrywallRepairReginaPage() {
  return (
    <ReginaSeoPage
      title="Drywall Repair in Regina"
      pageTitle="Drywall Repair Regina | Patching, Holes & Wall Repair | SaskHandy"
      metaDescription="Need drywall repair in Regina? Post your drywall patching or wall repair job on SaskHandy and compare available local bids."
      badge="Drywall repair in Regina"
      intro="SaskHandy helps Regina homeowners post drywall repair jobs for holes, cracks, patches, dents, and small wall damage."
      secondaryIntro="Upload photos and describe the size, location, texture, paint needs, and whether the damage may be connected to moisture."
      sectionTitle="Drywall repair tasks"
      sectionDescription="Drywall jobs can range from quick patching to more detailed repair and finishing work."
      items={["Small holes", "Wall dents", "Drywall cracks", "Ceiling patches", "Texture matching", "Water damage areas", "Paint touch-ups", "Trim-adjacent repairs"]}
      whyTitle="What affects drywall repair quotes?"
      whyParagraphs={["The quote can depend on the size of the damage, whether texture matching is needed, whether paint is included, and whether moisture or hidden damage is involved.", "Photos help local handymen understand whether the job is a simple patch or a more detailed repair.", "Before accepting a bid, homeowners should confirm whether sanding, priming, painting, materials, and cleanup are included."]}
      articleSections={buildArticleSections("drywall repair", ["Measure or photograph the damaged area.", "Mention whether paint matching is needed.", "Say whether the wall or ceiling has texture.", "Include whether the damage came from water, impact, or old repairs."])}
      bottomTitle="Post your Regina drywall repair job"
      bottomParagraph="Add photos of the wall or ceiling damage and describe the finish you want after the repair."
    />
  );
}

export function FenceRepairReginaPage() {
  return (
    <ReginaSeoPage
      title="Fence Repair in Regina"
      pageTitle="Fence Repair Regina | Gate Fixes, Panels & Posts | SaskHandy"
      metaDescription="Need fence repair in Regina? Post your fence or gate repair job on SaskHandy and compare available bids from local handymen."
      badge="Fence repair in Regina"
      intro="SaskHandy helps Regina homeowners post fence repair jobs for gates, boards, panels, posts, latches, and seasonal damage."
      secondaryIntro="Describe the fence type, damage, materials, access, and urgency so local handymen can understand the work."
      sectionTitle="Fence and gate repair jobs"
      sectionDescription="Fence repairs can be seasonal and may depend on weather, ground conditions, and material availability."
      items={["Gate repairs", "Fence panel repairs", "Loose boards", "Fence post replacement", "Latch and hinge fixes", "Leaning fence sections", "Storm damage repairs", "Small privacy fence repairs"]}
      whyTitle="Why post fence repair on SaskHandy?"
      whyParagraphs={["Fence jobs can vary depending on material, post condition, access, and whether the repair is structural or cosmetic.", "A clear job post helps local handymen decide whether they can handle the repair and what materials may be needed.", "Messaging before choosing helps homeowners confirm whether materials, disposal, and cleanup are included."]}
      articleSections={buildArticleSections("fence repair", ["Include photos of both sides of the damaged fence if possible.", "Mention whether the fence is wood, vinyl, chain-link, or metal.", "Say whether posts are loose, broken, or leaning.", "Mention gate hardware, latch, or hinge issues."])}
      bottomTitle="Post your Regina fence repair job"
      bottomParagraph="Add photos, material details, and access notes so local handymen can understand the fence repair."
    />
  );
}

export function DeckRepairReginaPage() {
  return (
    <ReginaSeoPage
      title="Deck Repair in Regina"
      pageTitle="Deck Repair Regina | Boards, Railings, Stairs & Seasonal Repairs | SaskHandy"
      metaDescription="Need deck repair in Regina? Post your deck repair job on SaskHandy and compare available local bids for boards, stairs, railings, and small fixes."
      badge="Deck repair in Regina"
      intro="SaskHandy helps Regina homeowners post deck repair jobs for boards, stairs, railings, loose fasteners, and seasonal wear."
      secondaryIntro="Describe the deck material, damaged area, safety concerns, photos, and timing so handymen can quote the job more accurately."
      sectionTitle="Deck repair jobs"
      sectionDescription="Deck repairs can involve safety, structure, weather exposure, and material matching."
      items={["Loose deck boards", "Railing repairs", "Stair repairs", "Small structural fixes", "Deck staining prep", "Weathered boards", "Fastener replacement", "Seasonal maintenance"]}
      whyTitle="What matters before hiring deck repair help?"
      whyParagraphs={["Deck repairs can affect safety, especially when stairs, railings, or rotten boards are involved.", "Homeowners should describe whether the issue is cosmetic or structural and upload photos when possible.", "Before choosing a handyman, confirm whether materials, pickup, staining, sealing, and cleanup are included."]}
      articleSections={buildArticleSections("deck repair", ["Mention whether the issue involves stairs, railings, boards, or supports.", "Add photos of damaged or soft areas.", "Say whether you already have replacement boards or materials.", "Mention if the deck needs staining or sealing after repair."])}
      bottomTitle="Post your Regina deck repair job"
      bottomParagraph="Share the deck issue, photos, material type, and timing so local handymen can send useful bids."
    />
  );
}

export function MinorPlumbingHandymanReginaPage() {
  return (
    <ReginaSeoPage
      title="Minor Plumbing Handyman in Regina"
      pageTitle="Minor Plumbing Handyman Regina | Faucets, Toilets & Small Fixture Help | SaskHandy"
      metaDescription="Need minor plumbing help in Regina? Post small plumbing and fixture jobs on SaskHandy and compare available local handyman bids."
      badge="Minor plumbing handyman in Regina"
      intro="SaskHandy helps Regina homeowners post small plumbing-related handyman jobs like faucets, toilets, caulking, and fixture replacements."
      secondaryIntro="For regulated or complex plumbing work, homeowners should confirm whether a licensed professional is required before hiring."
      sectionTitle="Minor plumbing-related jobs"
      sectionDescription="Some small fixture tasks may fit a handyman, while regulated work may require a licensed plumber."
      items={["Faucet replacement", "Leaky toilet help", "Toilet seat replacement", "Vanity hardware", "Shower caulking", "Sink fixture replacement", "Small leak assessment", "Drain assistance"]}
      whyTitle="Be clear about plumbing scope"
      whyParagraphs={["Small plumbing-adjacent jobs can become more complex if shutoff valves, leaks, old parts, hidden damage, or code requirements are involved.", "Homeowners should explain the issue clearly and use chat to confirm whether the handyman is comfortable and qualified for the scope.", "If a job requires a licensed plumber, permit, or regulated work, homeowners should hire the appropriate professional."]}
      articleSections={buildArticleSections("minor plumbing handyman help", ["Describe the fixture and issue clearly.", "Mention whether water is actively leaking.", "Say whether you already have replacement parts.", "Confirm whether licensed plumbing work is required."])}
      bottomTitle="Post your Regina minor plumbing job"
      bottomParagraph="Explain the issue, upload photos, and confirm the scope before choosing local help."
    />
  );
}

export function InteriorPaintingHandymanReginaPage() {
  return (
    <ReginaSeoPage
      title="Interior Painting Handyman in Regina"
      pageTitle="Interior Painting Handyman Regina | Small Room Painting & Touch-Ups | SaskHandy"
      metaDescription="Need interior painting help in Regina? Post small painting, touch-up, trim, and wall repair jobs on SaskHandy and compare available bids."
      badge="Interior painting handyman in Regina"
      intro="SaskHandy helps Regina homeowners post interior painting and touch-up jobs for small rooms, walls, trim, doors, and repair areas."
      secondaryIntro="Describe the room size, paint condition, prep work, number of coats, trim needs, and whether you already have paint."
      sectionTitle="Interior painting jobs"
      sectionDescription="Painting quotes depend heavily on preparation, room size, paint, trim, repairs, and finish expectations."
      items={["Small room painting", "Wall touch-ups", "Trim painting", "Door painting", "Patch and paint", "Accent walls", "Baseboard painting", "Move-out touch-ups"]}
      whyTitle="What affects painting quotes?"
      whyParagraphs={["Painting is often about prep. Holes, dents, stains, sanding, primer, furniture moving, trim detail, and number of coats can all affect the quote.", "Homeowners should include photos and mention whether the paint is already purchased.", "Before hiring, confirm whether prep, primer, cleanup, and supplies are included."]}
      articleSections={buildArticleSections("interior painting", ["Include room size and number of walls.", "Mention whether patching or sanding is needed.", "Say whether paint and supplies are provided.", "Confirm whether trim, doors, or ceilings are included."])}
      bottomTitle="Post your Regina interior painting job"
      bottomParagraph="Add photos, room details, paint information, and timing so local handymen can bid accurately."
    />
  );
}

export function RingDoorbellInstallationReginaPage() {
  return (
    <ReginaSeoPage
      title="Ring Doorbell Installation in Regina"
      pageTitle="Ring Doorbell Installation Regina | Smart Doorbell Setup | SaskHandy"
      metaDescription="Need Ring doorbell installation in Regina? Post your smart doorbell job on SaskHandy and compare local bids for setup and installation."
      badge="Ring doorbell installation in Regina"
      intro="SaskHandy helps Regina homeowners post smart doorbell installation jobs for Ring and similar video doorbells."
      secondaryIntro="Mention whether your doorbell is wired or battery-powered, whether Wi-Fi is strong at the door, and what app or smart home setup you need."
      sectionTitle="Smart doorbell jobs"
      sectionDescription="Doorbell installation can include mounting, app setup, Wi-Fi testing, power checks, and smart home connection."
      items={["Ring doorbell installation", "Battery doorbell mounting", "Wired doorbell replacement", "Wi-Fi setup", "App connection", "Chime setup", "Motion settings", "Smart display connection"]}
      whyTitle="Why get help with smart doorbell installation?"
      whyParagraphs={["A smart doorbell needs good placement, reliable power or battery setup, Wi-Fi connection, and app configuration.", "A clean installation helps reduce problems like poor camera angle, weak alerts, or unreliable live view.", "Homeowners should include the doorbell model and setup goals when posting the job."]}
      articleSections={buildArticleSections("Ring doorbell installation", ["Include the doorbell brand and model.", "Mention wired or battery-powered installation.", "Say whether an old doorbell or chime already exists.", "Mention Alexa, Google Home, Apple Home, or other smart home integrations."])}
      bottomTitle="Post your Regina Ring doorbell installation job"
      bottomParagraph="Add the model, power type, Wi-Fi details, and smart home needs so local handymen understand the setup."
    />
  );
}
