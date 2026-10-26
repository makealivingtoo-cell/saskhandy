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

async function getRoutes() {
  const appSource = await fs.readFile(
    path.join(projectRoot, "client", "src", "App.tsx"),
    "utf8"
  );

  const blogSource = await fs.readFile(
    path.join(projectRoot, "client", "src", "pages", "BlogArticlePage.tsx"),
    "utf8"
  );

  // Select static service pages only.
  // Exclude open jobs, profiles, quotes, accounts, and dashboards.
  const serviceRoutes = [
    ...appSource.matchAll(
      /<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g
    ),
  ]
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
    ...blogSource.matchAll(/^  "([a-z0-9-]+)": \{/gm),
  ].map(([, slug]) => `/blog/${slug}`);

  if (serviceRoutes.length === 0 || blogRoutes.length === 0) {
    throw new Error(
      "Could not find service pages or blog articles. Check the route discovery patterns."
    );
  }

  return [...new Set([...serviceRoutes, ...blogRoutes])].sort();
}

async function main() {
  const routes = await getRoutes();

  const template = await fs.readFile(
    path.join(publicDirectory, "index.html"),
    "utf8"
  );

  await fs.rm(stagingDirectory, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(stagingDirectory, {
    recursive: true,
  });

  // Serve only the built frontend during capture.
  // The application server and database are not started.
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

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not start the prerender server.");
  }

  const origin = `http://127.0.0.1:${address.port}`;
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    for (const route of routes) {
      const context = await browser.newContext({
        viewport: {
          width: 1440,
          height: 1000,
        },
        serviceWorkers: "block",
      });

      try {
        // Prevent analytics, third-party requests, and API calls
        // from leaving the capture browser.
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
          // Stripe is intentionally blocked while capturing static
          // service pages and articles, which have no payment forms.
          // The live application and its payment flow are unchanged.
          if (error.message === "Failed to load Stripe.js") {
            return;
          }

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

        // Wait for React content and page metadata effects.
        await page.waitForFunction(
          (expectedCanonical) => {
            const root = document.getElementById("root");
            const heading = root?.querySelector("h1");

            const canonical = document.querySelector(
              'link[rel="canonical"]'
            );

            const description = document.querySelector(
              'meta[name="description"]'
            );

            return (
              root &&
              root.textContent.trim().length > 200 &&
              heading?.textContent.trim() &&
              canonical?.getAttribute("href") === expectedCanonical &&
              description?.getAttribute("content")?.trim()
            );
          },
          canonicalUrl,
          {
            timeout: 30000,
          }
        );

        if (new URL(page.url()).pathname !== route) {
          throw new Error(
            `Unexpected redirect while rendering ${route}`
          );
        }

        if (pageErrors.length > 0) {
          throw new Error(
            `Browser errors on ${route}: ${pageErrors.join("; ")}`
          );
        }

        const html = await page.evaluate(
          ({ template, canonicalUrl, isArticle }) => {
            const root = document.getElementById("root");

            if (!root || root.querySelectorAll("h1").length !== 1) {
              throw new Error("Expected exactly one page heading.");
            }

            const canonicals = document.querySelectorAll(
              'link[rel="canonical"]'
            );

            if (
              canonicals.length !== 1 ||
              canonicals[0].getAttribute("href") !== canonicalUrl
            ) {
              throw new Error("Invalid or duplicate canonical URL.");
            }

            const robots = document.querySelector(
              'meta[name="robots"]'
            );

            if (
              /\bnoindex\b/i.test(
                robots?.getAttribute("content") ?? ""
              )
            ) {
              throw new Error("The page is marked noindex.");
            }

            if (
              !isArticle &&
              !document.getElementById("saskhandy-service-schema")
            ) {
              throw new Error("Service structured data is missing.");
            }

            const schemas = document.querySelectorAll(
              'script[type="application/ld+json"]'
            );

            for (const schema of schemas) {
              JSON.parse(schema.textContent ?? "");
            }

            // Start with the original built template, preserving
            // its asset URLs and analytics initialization.
            // Do not copy dynamically injected tracking scripts.
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
                output.head.appendChild(
                  output.importNode(element, true)
                );
              });

            const outputRoot = output.getElementById("root");

            if (!outputRoot) {
              throw new Error(
                "The HTML template has no root element."
              );
            }

            outputRoot.innerHTML = root.innerHTML;

            return `<!doctype html>\n${output.documentElement.outerHTML}`;
          },
          {
            template,
            canonicalUrl,
            isArticle: route.startsWith("/blog/"),
          }
        );

        // Match the filename encoding in server/_core/vite.ts.
        const filename =
          Buffer.from(route, "utf8").toString("hex") + ".html";

        await fs.writeFile(
          path.join(stagingDirectory, filename),
          html,
          "utf8"
        );

        console.log(`Prerendered: ${route}`);
      } finally {
        await context.close();
      }
    }

    // Publish generated pages only after every page succeeds.
    await fs.rm(outputDirectory, {
      recursive: true,
      force: true,
    });

    await fs.rename(stagingDirectory, outputDirectory);

    console.log(
      `\nSuccessfully prerendered ${routes.length} pages.`
    );
  } finally {
    try {
      if (browser) {
        await browser.close();
      }
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      await fs.rm(stagingDirectory, {
        recursive: true,
        force: true,
      });
    }
  }
}

main().catch((error) => {
  console.error("\nPrerendering failed:", error);
  process.exitCode = 1;
});