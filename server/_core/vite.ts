import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const serviceRedirects = new Map<string, string>([
  [
    "/professional-tv-mounting-saskatoon",
    "/tv-mounting-saskatoon",
  ],
  [
    "/tv-installation-service-saskatoon",
    "/tv-mounting-saskatoon",
  ],
  [
    "/home-security-doorbell-installation-saskatoon",
    "/smart-doorbell-installation-saskatoon",
  ],
]);

const applicationRoutes = new Set([
  "/",
  "/about",
  "/blog",
  "/terms",
  "/privacy",
  "/open-jobs-saskatoon",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/role-select",
  "/onboarding",
  "/dashboard",
  "/post-job",
  "/messages",
  "/support",
  "/handyman/dashboard",
  "/handyman/browse",
  "/handyman/bids",
  "/handyman/profile",
  "/handyman/earnings",
  "/handyman/messages",
  "/admin",
  "/admin/support",
]);

// These patterns recognize app routes, not database record existence.
const dynamicApplicationRoutes = [
  /^\/quote\/[^/]+$/,
  /^\/jobs\/[^/]+$/,
  /^\/jobs\/[^/]+\/edit$/,
  /^\/support\/[^/]+$/,
  /^\/handyman\/jobs\/[^/]+$/,
  /^\/profile\/[^/]+$/,
];

function normalizeTrailingSlash(pathname: string) {
  return pathname.length > 1
    ? pathname.replace(/\/+$/, "")
    : pathname;
}

function getQueryString(originalUrl: string) {
  const queryIndex = originalUrl.indexOf("?");
  return queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";
}

// Register before static files and the HTML fallback.
function registerServiceRedirects(app: Express) {
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    const pathname = normalizeTrailingSlash(req.path);
    const destination = serviceRedirects.get(pathname);

    if (!destination) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.redirect(
      301,
      `${destination}${getQueryString(req.originalUrl)}`
    );
  });
}

const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <title>Page Not Found | SaskHandy</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #f8fafc;
        color: #0f172a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }
      main {
        width: 100%;
        max-width: 560px;
        padding: 40px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
      }
      .brand {
        color: #047857;
        font-size: 20px;
        font-weight: 700;
        text-decoration: none;
      }
      .code {
        margin: 32px 0 8px;
        color: #64748b;
        font-weight: 600;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 32px;
      }
      p {
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        margin-top: 16px;
        padding: 12px 20px;
        background: #047857;
        color: #ffffff;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
      }
      a:focus-visible {
        outline: 3px solid #059669;
        outline-offset: 4px;
      }
    </style>
  </head>
  <body>
    <main>
      <a class="brand" href="/">SaskHandy</a>
      <p class="code">404</p>
      <h1>Page not found</h1>
      <p>
        This page may have moved, or the address may be incorrect.
        Visit the homepage to find local help for your next home project.
      </p>
      <a class="button" href="/">Go to homepage</a>
    </main>
  </body>
</html>`;

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  registerServiceRedirects(app);
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(
        clientTemplate,
        "utf-8"
      );

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  const indexPath = path.join(distPath, "index.html");
  const prerenderPath = path.resolve(distPath, "..", "prerender");

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find ${indexPath}. Build the client before starting the server.`
    );
  }

  const prerenderedFiles = new Set(
    fs.existsSync(prerenderPath)
      ? fs
          .readdirSync(prerenderPath, { withFileTypes: true })
          .filter(
            (entry) =>
              entry.isFile() && /^[a-f0-9]+\.html$/.test(entry.name)
          )
          .map((entry) => entry.name)
      : []
  );

  function getPrerenderedFilename(pathname: string) {
    return `${Buffer.from(pathname, "utf8").toString("hex")}.html`;
  }

  function isApplicationRoute(pathname: string) {
    return (
      applicationRoutes.has(pathname) ||
      dynamicApplicationRoutes.some((pattern) => pattern.test(pathname))
    );
  }

  function isKnownRoute(pathname: string) {
    return (
      prerenderedFiles.has(getPrerenderedFilename(pathname)) ||
      isApplicationRoute(pathname)
    );
  }

  registerServiceRedirects(app);

  app.use(
    express.static(distPath, {
      index: false,
      redirect: false,
    })
  );

  app.get("*", (req, res, next) => {
    const pathname = req.path;

    res.setHeader("Cache-Control", "no-cache");

    const normalizedPath = normalizeTrailingSlash(pathname);

    if (
      normalizedPath !== pathname &&
      normalizedPath.startsWith("/") &&
      !normalizedPath.startsWith("//") &&
      isKnownRoute(normalizedPath)
    ) {
      res.redirect(
        301,
        `${normalizedPath}${getQueryString(req.originalUrl)}`
      );
      return;
    }

    const filename = getPrerenderedFilename(pathname);

    if (prerenderedFiles.has(filename)) {
      res.sendFile(path.join(prerenderPath, filename), (error) => {
        if (error) next(error);
      });
      return;
    }

    if (isApplicationRoute(pathname)) {
      res.sendFile(indexPath, (error) => {
        if (error) next(error);
      });
      return;
    }

    res.setHeader("X-Robots-Tag", "noindex, follow");
    res.status(404).type("html").send(notFoundHtml);
  });
}