import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

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

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);

      res
        .status(200)
        .set({
          "Content-Type": "text/html",
          "Cache-Control": "no-cache",
        })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(
    express.static(distPath, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        const normalizedPath = filePath.replace(/\\/g, "/");

        if (normalizedPath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
          return;
        }

        if (
          normalizedPath.includes("/assets/") ||
          /\.(js|css|mjs|map|png|jpg|jpeg|webp|avif|svg|ico|gif|woff|woff2|ttf|otf)$/i.test(
            normalizedPath
          )
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }

        if (
          normalizedPath.endsWith("/robots.txt") ||
          normalizedPath.endsWith("/sitemap.xml")
        ) {
          res.setHeader("Cache-Control", "public, max-age=3600");
          return;
        }

        res.setHeader("Cache-Control", "public, max-age=86400");
      },
    })
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}