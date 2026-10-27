import express from "express";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const publicDirectory = path.join(projectRoot, "dist", "public");
const outputDirectory = path.join(projectRoot, "dist", "prerender");
const stagingDirectory = path.join(projectRoot, "dist", "prerender-staging");
const siteUrl = "https://saskhandy.com";

// Explicit metadata for public pages outside the service/article templates.
const publicPages = {
  "/": {
    title: "SaskHandy | Saskatoon Handyman Services",
    description:
      "Post home repair and maintenance jobs on SaskHandy. Compare bids, review handyman profiles, and connect with local help in Saskatoon and Saskatchewan.",
  },
  "/about": {
    title: "About SaskHandy | Saskatchewan Home Services Marketplace",
    description:
      "Learn about SaskHandy, a Saskatchewan marketplace connecting homeowners with local service providers for repairs, installations, and home maintenance.",
  },
  "/blog": {
    title: "SaskHandy Blog | Home Repair and Handyman Tips",
    description:
      "Explore practical home repair guides, handyman hiring tips, and project planning advice for homeowners in Saskatoon and across Saskatchewan.",
  },
  "/terms": {
    title: "Terms and Conditions | SaskHandy",
    description:
      "Read the terms and conditions for using SaskHandy, including marketplace accounts, job posts, service providers, and payments.",
  },
  "/privacy": {
    title: "Privacy Policy | SaskHandy",
    description:
      "Learn how SaskHandy collects, uses, and protects personal information when you use its home services marketplace.",
  },
};

async function getRoutes() {
  const [appSource, blogSource] = await Promise.all([
    fs.readFile(
      path.join(projectRoot, "client", "src", "App.tsx"),
      "utf8"
    ),
    fs.readFile(
      path.join(projectRoot, "client", "src", "pages", "BlogArticlePage.tsx"),
      "utf8"
    ),
  ]);

  const routeDefinitions = [
    ...appSource.matchAll(
      /<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g
    ),
  ];

  const knownRoutes = new Set(
    routeDefinitions.map(([, route]) => route)
  );

  for (const route of Object.keys(publicPages)) {
    if (!knownRoutes.has(route)) {
      throw new Error(`Public route is missing from App.tsx: ${route}`);
    }
  }

  // Only static service pages belong in this group.
  const serviceRoutes = routeDefinitions
    .filter(([, route, component]) => {
      return (
        !route.includes(":") &&
        !route.startsWith("/open-jobs") &&
        component.endsWith("Page") &&
        /-(saskatoon|regina|saskatchewan)$|^\/(saskatoon|regina|saskatchewan|moose-jaw|prince-albert|warman|martensville)-handyman-services$/.test(
          route
        )
      );
    })
    .map(([, route]) => route);

  const blogRoutes = [
    ...blogSource.matchAll(/^ {2}"([a-z0-9-]+)": \{/gm),
  ].map(([, slug]) => `/blog/${slug}`);

  if (serviceRoutes.length === 0 || blogRoutes.length === 0) {
    throw new Error(
      "Could not find service pages or blog articles. Check the route discovery patterns."
    );
  }

  return {
    routes: [
      ...new Set([
        ...Object.keys(publicPages),
        ...serviceRoutes,
        ...blogRoutes,
      ]),
    ].sort(),
    serviceRoutes: new Set(serviceRoutes),
  };
}

async function main() {
  const { routes, serviceRoutes } = await getRoutes();

  const template = await fs.readFile(
    path.join(publicDirectory, "index.html"),
    "utf8"
  );

  await fs.rm(stagingDirectory, { recursive: true, force: true });
  await fs.mkdir(stagingDirectory, { recursive: true });

  // Capture only the built frontend. Do not start the database or API.
  const app = express();

  app.use("/api", (_req, res) => {
    res.status(503).json({
      error: "API access is disabled during prerendering.",
    });
  });

  app.use(
    express.static(publicDirectory, {
      index: false,
      redirect: false,
    })
  );

  app.get("*", (_req, res) => {
    res.type("html").send(template);
  });

  const server = app.listen(0, "127.0.0.1");
  let browser;

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not start the prerender server.");
    }

    const origin = `http://127.0.0.1:${address.port}`;

    browser = await chromium.launch({ headless: true });

    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        serviceWorkers: "block",
      });

      try {
        // Block analytics, third-party requests, and API access.
        await context.route("**/*", async (requestRoute) => {
          const requestUrl = new URL(requestRoute.request().url());

          if (
            requestUrl.origin !== origin ||
            requestUrl.pathname === "/api" ||
            requestUrl.pathname.startsWith("/api/")
          ) {
            await requestRoute.abort();
            return;
          }

          await requestRoute.continue();
        });

        await context.addInitScript(() => {
          localStorage.setItem("saskhandy-a2hs-dismissed", "true");
        });

        const page = await context.newPage();
        const pageErrors = [];

        page.on("pageerror", (error) => {
          // Stripe is intentionally unavailable during static capture.
          if (error.message === "Failed to load Stripe.js") return;
          pageErrors.push(error.message);
        });

        const response = await page.goto(`${origin}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        if (!response?.ok()) {
          throw new Error(`Page request failed: ${route}`);
        }

        const canonicalUrl = `${siteUrl}${route}`;
        const publicMetadata = publicPages[route] ?? null;

        // Public information pages receive explicit snapshot metadata.
        // Services and articles must supply their own metadata.
        await page.waitForFunction(
          ({ canonicalUrl, hasPublicMetadata }) => {
            const root = document.getElementById("root");
            const heading = root?.querySelector("h1");

            if (
              !root ||
              root.textContent.trim().length <= 200 ||
              !heading?.textContent.trim()
            ) {
              return false;
            }

            if (hasPublicMetadata) return true;

            return (
              document
                .querySelector('link[rel="canonical"]')
                ?.getAttribute("href") === canonicalUrl &&
              document
                .querySelector('meta[name="description"]')
                ?.getAttribute("content")
                ?.trim()
            );
          },
          {
            canonicalUrl,
            hasPublicMetadata: Boolean(publicMetadata),
          },
          { timeout: 30000 }
        );

        if (new URL(page.url()).pathname !== route) {
          throw new Error(`Unexpected redirect while rendering ${route}`);
        }

        const html = await page.evaluate(
          ({ template, canonicalUrl, publicMetadata, isService }) => {
            const root = document.getElementById("root");

            if (!root || root.querySelectorAll("h1").length !== 1) {
              throw new Error("Expected exactly one page heading.");
            }

            const robots = document.querySelector('meta[name="robots"]');

            if (/\bnoindex\b/i.test(robots?.getAttribute("content") ?? "")) {
              throw new Error("The page is marked noindex.");
            }

            if (
              isService &&
              !document.getElementById("saskhandy-service-schema")
            ) {
              throw new Error("Service structured data is missing.");
            }

            for (const schema of document.querySelectorAll(
              'script[type="application/ld+json"]'
            )) {
              JSON.parse(schema.textContent ?? "");
            }

            if (!publicMetadata) {
              const canonicals = document.querySelectorAll(
                'link[rel="canonical"]'
              );

              if (
                canonicals.length !== 1 ||
                canonicals[0].getAttribute("href") !== canonicalUrl
              ) {
                throw new Error("Invalid or duplicate canonical URL.");
              }
            }

            // Preserve the built asset URLs and original analytics setup.
            const output = new DOMParser().parseFromString(
              template,
              "text/html"
            );

            const metadataSelector = [
              "title",
              'meta[name="description"]',
              'meta[name="robots"]',
              'meta[property^="og:"]',
              'meta[property^="article:"]',
              'meta[name^="twitter:"]',
              'link[rel="canonical"]',
              'script[type="application/ld+json"]',
            ].join(",");

            output.head
              .querySelectorAll(metadataSelector)
              .forEach((element) => element.remove());

            document.head
              .querySelectorAll(metadataSelector)
              .forEach((element) => {
                output.head.appendChild(output.importNode(element, true));
              });

            function setMeta(attribute, key, value) {
              const selector = `meta[${attribute}="${key}"]`;

              output.head
                .querySelectorAll(selector)
                .forEach((element) => element.remove());

              const meta = output.createElement("meta");
              meta.setAttribute(attribute, key);
              meta.setAttribute("content", value);
              output.head.appendChild(meta);
            }

            if (publicMetadata) {
              output.title = publicMetadata.title;

              setMeta("name", "description", publicMetadata.description);

              output.head
                .querySelectorAll('link[rel="canonical"]')
                .forEach((element) => element.remove());

              const canonical = output.createElement("link");
              canonical.setAttribute("rel", "canonical");
              canonical.setAttribute("href", canonicalUrl);
              output.head.appendChild(canonical);

              setMeta("property", "og:type", "website");
              setMeta("property", "og:title", publicMetadata.title);
              setMeta(
                "property",
                "og:description",
                publicMetadata.description
              );
              setMeta("property", "og:url", canonicalUrl);
              setMeta("property", "og:site_name", "SaskHandy");
              setMeta("name", "twitter:card", "summary");
              setMeta("name", "twitter:title", publicMetadata.title);
              setMeta(
                "name",
                "twitter:description",
                publicMetadata.description
              );
            }

            // Fill missing social metadata from the page's own title
            // and description, without replacing existing values.
            const title = output.title.trim();
            const description = output.head
              .querySelector('meta[name="description"]')
              ?.getAttribute("content")
              ?.trim();

            if (!title || !description) {
              throw new Error("Page title or description is missing.");
            }

            const defaults = [
              ["property", "og:title", title],
              ["property", "og:description", description],
              ["property", "og:url", canonicalUrl],
              ["property", "og:site_name", "SaskHandy"],
              ["name", "twitter:card", "summary"],
              ["name", "twitter:title", title],
              ["name", "twitter:description", description],
            ];

            for (const [attribute, key, value] of defaults) {
              const existing = output.head.querySelector(
                `meta[${attribute}="${key}"]`
              );

              if (!existing?.getAttribute("content")?.trim()) {
                setMeta(attribute, key, value);
              }
            }

            const canonicals = output.head.querySelectorAll(
              'link[rel="canonical"]'
            );

            if (
              canonicals.length !== 1 ||
              canonicals[0].getAttribute("href") !== canonicalUrl
            ) {
              throw new Error("Output canonical URL is invalid.");
            }

            const outputRoot = output.getElementById("root");

            if (!outputRoot) {
              throw new Error("The HTML template has no root element.");
            }

            outputRoot.innerHTML = root.innerHTML;

            return `<!doctype html>\n${output.documentElement.outerHTML}`;
          },
          {
            template,
            canonicalUrl,
            publicMetadata,
            isService: serviceRoutes.has(route),
          }
        );

        if (pageErrors.length > 0) {
          throw new Error(
            `Browser errors on ${route}: ${pageErrors.join("; ")}`
          );
        }

        // Matches the filename encoding in server/_core/vite.ts.
        const filename =
          Buffer.from(route, "utf8").toString("hex") + ".html";

        await fs.writeFile(
          path.join(stagingDirectory, filename),
          html,
          "utf8"
        );

        console.log(`Prerendered: ${route}`);
      } catch (error) {
        throw new Error(`Failed to prerender ${route}: ${error.message}`, {
          cause: error,
        });
      } finally {
        await context.close();
      }
    }

    // Publish only after every page succeeds.
    await fs.rm(outputDirectory, { recursive: true, force: true });
    await fs.rename(stagingDirectory, outputDirectory);

    console.log(`\nSuccessfully prerendered ${routes.length} pages.`);
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      try {
        if (server.listening) {
          await new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) reject(error);
              else resolve();
            });
          });
        }
      } finally {
        await fs.rm(stagingDirectory, {
          recursive: true,
          force: true,
        });
      }
    }
  }
}

main().catch((error) => {
  console.error("\nPrerendering failed:", error);
  process.exitCode = 1;
});