import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Hammer } from "lucide-react";
import { Link, useParams } from "wouter";

type BlogArticle = {
  title: string;
  pageTitle: string;
  metaDescription: string;
  badge: string;
  intro: string;
  readTime: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
  relatedLinks: {
    href: string;
    label: string;
  }[];
};

const articles: Record<string, BlogArticle> = {
  "how-to-hire-a-handyman-in-saskatchewan": {
    title: "How to Hire a Handyman in Saskatchewan",
    pageTitle: "How to Hire a Handyman in Saskatchewan | SaskHandy",
    metaDescription:
      "Learn how to hire a handyman in Saskatchewan. Compare bids, ask the right questions, review experience, check job scope, and find local help for home repairs.",
    badge: "Homeowner hiring guide",
    readTime: "8 min read",
    intro:
      "Hiring a handyman in Saskatchewan is easier when you know what to ask, what details to include, and how to compare local options before choosing someone for your home repair or maintenance job.",
    sections: [
      {
        heading: "Start by describing the job clearly",
        paragraphs: [
          "The first step to hiring a handyman in Saskatchewan is being clear about the work you need done. A handyman can only give a useful response if they understand the actual job. Instead of writing something vague like “I need repairs,” explain the task in practical terms. For example, say that you need a TV mounted on drywall in a living room, a dresser assembled from a boxed furniture kit, a leaky faucet checked under the bathroom sink, or a small drywall hole patched and painted.",
          "Clear job descriptions help local handymen decide whether the work matches their skills, tools, schedule, and experience. They also help you avoid back-and-forth messages that waste time. If the job involves several small tasks, list them together. For example, you might need furniture assembly, shelf installation, drywall touch-ups, and a light fixture replaced. Grouping related tasks can make the job easier to understand and more worthwhile for a handyman to review.",
          "Photos are also helpful. A photo of the wall where the TV will be mounted, the damaged drywall, the boxed furniture, the leaking fixture, or the yard area can give a handyman a better idea of the job before they respond. On SaskHandy, homeowners can post the details of the project so local service providers can review the scope and decide whether to respond.",
        ],
      },
      {
        heading: "Know what type of handyman service you need",
        paragraphs: [
          "Handyman services can cover many practical home jobs, but not every handyman does every type of work. Some focus on furniture assembly, TV mounting, shelving, and small installations. Others may be more comfortable with drywall repair, painting, yard work, minor plumbing help, or general maintenance. Before hiring, think about the category your job fits into and whether it requires specialized qualifications.",
          "For example, replacing a shower head, fixing a dripping faucet, or swapping a simple fixture may be different from major plumbing work. Installing a light fixture may be different from adding new wiring or working on an electrical panel. Some plumbing and electrical jobs may require a properly qualified or licensed professional. Being clear about the type of work helps protect you and helps the handyman understand whether they are the right person for the job.",
          "SaskHandy is built for common home jobs like furniture assembly, TV mounting, drywall patching, painting, yard work, fixture replacement, minor repairs, and seasonal maintenance. If your project is complex, unsafe, permit-related, or beyond a simple repair, you should choose a properly qualified professional for that work.",
        ],
      },
      {
        heading: "Compare bids beyond price",
        paragraphs: [
          "Price matters, but it should not be the only thing you compare when hiring a handyman. A lower bid may look attractive, but you should also consider experience, availability, communication, the details included in the bid, and whether the person seems to understand the job. A clear bid should explain what is included, when the handyman can complete the work, and whether materials are included or separate.",
          "For example, if you post a painting touch-up job, one handyman may include sanding, patching, priming, and painting, while another may only include applying paint. If you post a TV mounting job, one response may include bracket installation and cable management, while another may only include basic mounting. Comparing the details helps you understand what you are actually paying for.",
          "When using SaskHandy, homeowners can compare responses in one place instead of trying to manage scattered messages from different platforms. This makes it easier to review pricing, ask follow-up questions, and choose the person who seems like the best fit for the work.",
        ],
      },
      {
        heading: "Ask the right questions before accepting a bid",
        paragraphs: [
          "Before accepting a bid, ask a few practical questions. You can ask whether the handyman has done similar work before, whether they have the required tools, whether they need you to buy materials, how long the job should take, and whether there are any extra costs you should know about. These questions are simple, but they can prevent misunderstandings.",
          "For furniture assembly, ask if they have experience with the brand or item type. For TV mounting, ask if they can work with your wall type and bracket. For drywall repair, ask whether sanding, priming, and paint matching are included. For yard work, ask whether debris removal is included. For minor plumbing or electrical help, ask whether the task is within their skill level and whether a licensed professional may be needed.",
          "Good communication before the job usually leads to a smoother experience during the job. A handyman who answers clearly and asks useful questions is often easier to work with than someone who gives vague replies.",
        ],
      },
      {
        heading: "Check timing and availability",
        paragraphs: [
          "Availability is a major part of hiring a handyman. Some jobs are flexible, while others are time-sensitive. A move-in furniture assembly job, rental unit repair, leaky fixture, or seasonal cleanup may need to be completed quickly. When posting your job, include your preferred timeline so handymen can respond honestly.",
          "It is also helpful to mention whether someone will be home, whether parking is available, and whether the work area is easy to access. These details are especially useful for apartments, condos, rental units, basement suites, or homes with limited access.",
          "If you need the work done by a certain date, say that clearly. A handyman may be interested in the job but unavailable during your preferred window. Clear timing helps both sides avoid wasted conversations.",
        ],
      },
      {
        heading: "Prepare the area before the handyman arrives",
        paragraphs: [
          "Once you hire someone, prepare the work area. Move furniture if possible, clear clutter, make sure pets are safely away from the work area, and have any purchased materials ready. If the job involves furniture assembly, keep the boxes, hardware, and instructions together. If the job involves TV mounting, have the mount and TV ready. If the job involves painting or drywall repair, make sure the damaged area is visible and accessible.",
          "Preparation can reduce the time required and make the job easier. It also shows respect for the handyman’s time. If there are special instructions, building rules, parking details, or access codes, share them before the appointment.",
          "For rental properties or homes where you will not be present, make sure access is arranged clearly. Miscommunication about access can delay the job and frustrate both sides.",
        ],
      },
      {
        heading: "Use SaskHandy to make local hiring easier",
        paragraphs: [
          "SaskHandy is designed to help Saskatchewan homeowners find local help for everyday home jobs. Instead of relying only on broad searches, word of mouth, or scattered listings, you can post your job, describe the work, compare bids, and manage communication in one place.",
          "Whether you need handyman services in Saskatoon, Regina, Moose Jaw, Prince Albert, Warman, Martensville, or another Saskatchewan community, a clear job post gives local handymen a better chance to understand your needs and respond with useful information.",
          "The best hiring process is simple: describe the job clearly, include photos when helpful, compare more than just price, ask practical questions, confirm timing, and choose someone who fits the work. That approach makes it easier to hire with confidence and get your home repair or maintenance job completed properly.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
      { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
      { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      { href: "/furniture-assembly-saskatchewan", label: "Furniture Assembly Saskatchewan" },
      { href: "/tv-mounting-saskatchewan", label: "TV Mounting Saskatchewan" },
      { href: "/plumbing-repairs-saskatchewan", label: "Plumbing Repairs Saskatchewan" },
    ],
  },

  "small-home-jobs-you-should-not-put-off": {
    title: "Small Home Jobs You Should Not Put Off",
    pageTitle: "Small Home Jobs You Should Not Put Off | SaskHandy",
    metaDescription:
      "Small home repairs can become bigger problems if ignored. Learn which home jobs Saskatchewan homeowners should handle early, from leaks to drywall repairs.",
    badge: "Home repair tips",
    readTime: "7 min read",
    intro:
      "Small home jobs are easy to ignore, but many of them become more expensive, more frustrating, or more noticeable when they sit unfinished for too long.",
    sections: [
      {
        heading: "Why small home jobs matter",
        paragraphs: [
          "Most homeowners have a list of small jobs that never seem urgent enough to handle right away. A loose handle, dripping faucet, small drywall hole, damaged fence board, unmounted shelf, scuffed wall, running toilet, or messy yard can sit for weeks or months. The problem is that small repairs often affect how a home feels every day.",
          "A home does not need to be falling apart for maintenance to matter. Small unfinished jobs can make a space feel cluttered, neglected, or frustrating. They can also make larger future projects harder. A small leak can damage a cabinet. A small drywall hole can become more noticeable. A loose railing or fixture can become a safety issue. A clogged gutter can contribute to water problems.",
          "SaskHandy helps Saskatchewan homeowners post these practical home jobs and connect with local help before the work becomes more stressful.",
        ],
      },
      {
        heading: "Leaky faucets and running toilets",
        paragraphs: [
          "Plumbing issues are some of the most important small jobs to handle early. A leaky faucet may seem minor, but it can waste water, stain fixtures, and become more annoying over time. A running toilet can also waste water and create daily frustration. These issues are easy to ignore because they often start small, but they rarely fix themselves.",
          "Homeowners should pay attention to dripping faucets, loose sink fixtures, slow drains, running toilets, leaking supply lines, and moisture under cabinets. Some plumbing work may require a licensed plumber, especially when the issue is complex, hidden, or major. But smaller fixture replacement and repair-style jobs are common reasons homeowners look for local help.",
          "Posting the issue clearly on SaskHandy can help local service providers understand whether the job is a simple repair, a fixture replacement, or something that needs a specialist.",
        ],
      },
      {
        heading: "Drywall holes, dents, and wall damage",
        paragraphs: [
          "Drywall damage is another job homeowners often delay. Nail holes, dents, cracks, scuffs, and larger patches can make a room feel unfinished. These repairs are especially important before moving out, selling a home, preparing a rental unit, or refreshing a room.",
          "Small drywall damage can also stand out more after painting, moving furniture, or changing lighting. A hallway dent, basement wall patch, door handle hole, or damaged corner can make an otherwise clean room look neglected. Drywall repair often involves patching, sanding, priming, and painting, so it is worth explaining the full scope when posting the job.",
          "If several rooms need touch-ups, group them into one job. A handyman may be more interested in a project that includes multiple patches and paint touch-ups instead of one tiny hole.",
        ],
      },
      {
        heading: "Loose fixtures, shelves, and hardware",
        paragraphs: [
          "Loose fixtures can become bigger problems when ignored. A loose towel bar, cabinet handle, door hinge, shelf, railing, closet rod, or curtain rod can damage the wall or surrounding area if it keeps being used. Small hardware problems can also make a home feel less functional.",
          "These jobs are often quick for someone with the right tools, but frustrating for homeowners who do not have anchors, screws, drills, levels, or the time to fix them properly. If you have several loose items around the home, combine them into one handyman job.",
          "When posting the job, include what needs to be tightened, replaced, mounted, or repaired. Photos help because the handyman can see the wall type, fixture style, and possible hardware needed.",
        ],
      },
      {
        heading: "TV mounting and furniture assembly",
        paragraphs: [
          "TV mounting and furniture assembly are not always repairs, but they are common jobs homeowners put off. A boxed dresser, bed frame, desk, or shelving unit can sit unfinished for weeks. A TV can stay on the floor or on a temporary stand because mounting it feels stressful.",
          "These jobs matter because they affect how usable your space feels. A mounted TV can make a living room, bedroom, or basement look cleaner. Properly assembled furniture can make a bedroom, office, or rental unit functional. Waiting too long often creates clutter and frustration.",
          "When posting these jobs, include the item type, brand, room location, TV size, bracket type, wall type, and whether the furniture or mount has already been purchased.",
        ],
      },
      {
        heading: "Gutter cleaning, fence repair, and yard cleanup",
        paragraphs: [
          "Outdoor maintenance is easy to delay because it is seasonal. In Saskatchewan, spring cleanup, fall cleanup, branch removal, gutter cleaning, fence repair, deck maintenance, and yard tidy-up can become bigger tasks when left too long. Weather changes can also make the timing more important.",
          "Clogged gutters can cause water overflow and exterior maintenance problems. Loose fence boards can worsen with wind and weather. Yard debris can make outdoor spaces harder to use. Fall cleanup can become harder after snow arrives. These are practical jobs that often benefit from local help.",
          "If you need outdoor maintenance, include details like yard size, number of gutters, fence damage, debris removal needs, tool availability, and whether hauling is required.",
        ],
      },
      {
        heading: "Paint touch-ups and small room refreshes",
        paragraphs: [
          "Painting is another job that can change how a home feels quickly. A full renovation may not be necessary, but paint touch-ups, trim painting, one-room painting, or covering scuffs can make a space feel cleaner. This is especially useful before listing a property, welcoming guests, setting up a rental, or moving into a new home.",
          "Paint jobs are easier to quote when the scope is clear. Include the room size, number of walls, paint colour, whether paint is supplied, whether patching is needed, and whether trim or doors are included.",
          "Small painting jobs can pair well with drywall repair. If walls need patching and painting, mention both in the same post so the handyman understands the full project.",
        ],
      },
      {
        heading: "Handle small jobs before they pile up",
        paragraphs: [
          "The easiest way to manage home maintenance is to deal with small jobs before they become a long list. Once several small repairs pile up, the work feels more overwhelming and easier to avoid. Posting a bundled handyman job can help you get multiple tasks done at once.",
          "SaskHandy is built for these everyday home jobs across Saskatchewan. Homeowners can post repair, assembly, mounting, yard work, painting, drywall, plumbing help, electrical help, and maintenance tasks in one place.",
          "If you have been putting off small home jobs, start by listing everything that needs attention. Then group related tasks together and post a clear job. A little organization can help you move from a growing to-do list to a home that feels more complete.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/drywall-painting-saskatchewan", label: "Drywall and Painting Saskatchewan" },
      { href: "/plumbing-repairs-saskatchewan", label: "Plumbing Repairs Saskatchewan" },
      { href: "/yard-work-saskatchewan", label: "Yard Work Saskatchewan" },
      { href: "/tv-mounting-saskatchewan", label: "TV Mounting Saskatchewan" },
      { href: "/furniture-assembly-saskatchewan", label: "Furniture Assembly Saskatchewan" },
      { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
    ],
  },

  "what-homeowners-should-ask-before-accepting-a-bid": {
    title: "What Homeowners Should Ask Before Accepting a Bid",
    pageTitle: "What Homeowners Should Ask Before Accepting a Bid | SaskHandy",
    metaDescription:
      "Before accepting a handyman bid, ask about scope, pricing, materials, timing, experience, cleanup, and qualifications. Use this homeowner checklist.",
    badge: "Hiring checklist",
    readTime: "8 min read",
    intro:
      "Before accepting a handyman bid, homeowners should ask a few simple questions about scope, pricing, materials, timing, experience, cleanup, and expectations.",
    sections: [
      {
        heading: "Make sure the scope is clear",
        paragraphs: [
          "Before accepting a bid, the first question is whether the handyman clearly understands the scope of the job. Scope means exactly what work is included and what is not included. A bid for drywall repair may include patching but not painting. A bid for TV mounting may include the bracket installation but not cable management. A bid for yard work may include cleanup but not hauling debris away.",
          "Ask the handyman to confirm what they are including in the price. You do not need a complicated contract for every small job, but you should have a clear written understanding inside your messages. This protects both the homeowner and the handyman.",
          "If the job has multiple parts, list each task and ask the handyman to confirm them. For example: assemble one dresser, mount one TV, install two shelves, patch one drywall hole, and touch up paint. Clear scope prevents confusion later.",
        ],
      },
      {
        heading: "Ask whether materials are included",
        paragraphs: [
          "Materials can create confusion if they are not discussed before the job starts. Some jobs require screws, anchors, paint, drywall compound, replacement parts, faucet parts, brackets, caulking, bags, or other supplies. The bid may or may not include those materials.",
          "Ask whether you need to purchase materials before the appointment. For furniture assembly, the furniture and hardware usually come in the box. For TV mounting, you may need to provide the mount. For painting, you may need to provide the paint. For plumbing fixture replacement, you may need to provide the new fixture.",
          "If the handyman is supplying materials, ask whether that cost is included in the bid or added separately. This helps avoid surprises when the work is finished.",
        ],
      },
      {
        heading: "Confirm timing and availability",
        paragraphs: [
          "Timing matters, especially for move-in jobs, rental repairs, leaks, seasonal cleanup, or work that needs to be completed before guests arrive. Before accepting a bid, ask when the handyman is available and how long the job is expected to take.",
          "Some jobs can be completed in one visit. Others may require drying time, paint matching, extra materials, or a second visit. Drywall repair and painting, for example, may involve patching, sanding, priming, and painting. Yard work may depend on weather. Fixture replacement may depend on having the correct part.",
          "Be clear about your deadline. If the work must be done by a certain date, say that before accepting the bid.",
        ],
      },
      {
        heading: "Ask about similar experience",
        paragraphs: [
          "You do not need to overcomplicate the hiring process, but it is reasonable to ask whether the handyman has done similar work before. Experience matters for jobs like TV mounting, drywall patching, furniture assembly, fixture replacement, painting, fence repair, and minor plumbing help.",
          "For TV mounting, ask if they have mounted a similar TV size or bracket type. For furniture assembly, ask if they have built similar items. For drywall repair, ask if they can handle patching and finishing. For plumbing or electrical help, ask whether the task is within their skill level and whether a licensed professional may be required.",
          "A good handyman should be honest about what they can and cannot do. That honesty is better than accepting a job that is outside their experience.",
        ],
      },
      {
        heading: "Clarify cleanup and disposal",
        paragraphs: [
          "Cleanup is often forgotten until the job is done. Before accepting a bid, ask whether cleanup is included. For furniture assembly, this might include breaking down boxes or gathering packaging. For yard work, it may include bagging leaves or hauling debris. For drywall repair, it may include sanding dust cleanup. For painting, it may include protecting floors and cleaning the work area.",
          "Disposal is different from cleanup. A handyman may clean the work area but not haul away garbage, branches, old fixtures, or packaging. If you need removal, say that clearly and ask if it is included.",
          "This is especially important for yard cleanup, fence repair, gutter cleaning, rental property maintenance, and move-out jobs.",
        ],
      },
      {
        heading: "Check whether the job needs a specialist",
        paragraphs: [
          "Some jobs should be handled by a properly qualified professional. This is especially important for complex plumbing, electrical, structural, gas, roofing, or permit-related work. A handyman may be suitable for small repairs and practical tasks, but not every home job should be treated the same way.",
          "For electrical work, new wiring, panel work, unsafe circuits, or permit-related changes may require a licensed electrician. For plumbing, major leaks, water line changes, sewer issues, or complex system problems may require a licensed plumber. When in doubt, ask the person bidding whether the job is appropriate for them or whether you should hire a specialist.",
          "A reliable service provider should not pressure you into using them for work they are not qualified to do.",
        ],
      },
      {
        heading: "Compare communication, not just cost",
        paragraphs: [
          "The cheapest bid is not always the best choice. Good communication can save you time, stress, and misunderstanding. Pay attention to whether the handyman answers your questions, explains what is included, asks for useful details, and responds clearly.",
          "A slightly higher bid from someone who understands the job may be better than a lower bid with vague answers. For example, if you are hiring someone for drywall repair and painting, a clear response about patching, sanding, priming, and paint matching is more useful than a low price with no details.",
          "SaskHandy gives homeowners a way to compare bids and messages in one place, making it easier to choose based on fit instead of price alone.",
        ],
      },
      {
        heading: "Confirm the final details before work begins",
        paragraphs: [
          "Before the job starts, confirm the date, time, address or area, parking instructions, materials, price, and scope. If you live in an apartment, condo, or rental, confirm any building rules or permission requirements. If the job is outdoors, confirm weather expectations. If pets are in the home, plan how they will be kept away from the work area.",
          "These details may feel small, but they help the appointment go smoothly. The more organized you are before the job, the easier it is for the handyman to complete the work properly.",
          "A good bid should lead to a clear plan. Once the scope, materials, timing, price, and expectations are confirmed, you can move forward with more confidence.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/saskatchewan-handyman-services", label: "Saskatchewan Handyman Services" },
      { href: "/saskatoon-handyman-services", label: "Saskatoon Handyman Services" },
      { href: "/regina-handyman-services", label: "Regina Handyman Services" },
      { href: "/plumbing-repairs-saskatchewan", label: "Plumbing Repairs Saskatchewan" },
      { href: "/electrical-help-saskatchewan", label: "Electrical Help Saskatchewan" },
      { href: "/drywall-painting-saskatchewan", label: "Drywall and Painting Saskatchewan" },
    ],
  },
};

export default function BlogArticlePage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const article = articles[slug];

  useEffect(() => {
    if (!article) {
      document.title = "Blog Article Not Found | SaskHandy";
      return;
    }

    document.title = article.pageTitle;

    const content = article.metaDescription;
    let metaDescription = document.querySelector('meta[name="description"]');

    if (metaDescription) {
      metaDescription.setAttribute("content", content);
    } else {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      metaDescription.setAttribute("content", content);
      document.head.appendChild(metaDescription);
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="container flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                <Hammer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">SaskHandy</div>
                <div className="text-sm text-slate-500">Local help for home jobs</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Blog article not found
            </h1>
            <p className="mt-4 text-slate-600">
              The article you are looking for does not exist yet.
            </p>
            <div className="mt-8">
              <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                <Link href="/blog">Back to Blog</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Hammer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">SaskHandy</div>
              <div className="text-sm text-slate-500">Local help for home jobs</div>
            </div>
          </Link>

          <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
            <Link href="/sign-up">Post a Job</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-[#f7faf8]">
          <div className="container py-16 md:py-20">
            <div className="mx-auto max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                <Calendar className="h-4 w-4" />
                {article.badge} · {article.readTime}
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                {article.title}
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">{article.intro}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-emerald-700 hover:bg-emerald-800">
                  <Link href="/sign-up">
                    Post a Job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/blog">Back to Blog</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <article className="bg-white">
          <div className="container py-16">
            <div className="mx-auto max-w-3xl">
              <div className="space-y-12">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      {section.heading}
                    </h2>

                    <div className="mt-5 space-y-5">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-base leading-8 text-slate-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </article>

        <section className="border-t border-slate-200 bg-[#f7faf8]">
          <div className="container py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Related SaskHandy pages
              </h2>

              <p className="mt-4 text-slate-600 leading-8">
                Explore related local handyman service pages and Saskatchewan home repair guides.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {article.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-10 rounded-[32px] bg-emerald-700 px-6 py-10 text-center text-white">
                <h2 className="text-2xl font-bold tracking-tight">
                  Need help with a home repair or small job?
                </h2>

                <p className="mx-auto mt-4 max-w-2xl leading-8 text-emerald-50">
                  Post your job on SaskHandy and connect with local handymen for repairs,
                  assembly, mounting, yard work, painting, drywall, plumbing help, electrical help,
                  and other home projects.
                </p>

                <div className="mt-7">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-white text-emerald-800 hover:bg-emerald-50"
                  >
                    <Link href="/sign-up">Post Your First Job</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}