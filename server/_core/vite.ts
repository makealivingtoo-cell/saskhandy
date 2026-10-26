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

      // Reload the template so development changes appear immediately.
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

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

  // Generated pages live beside public, so they are served only
  // through their matching routes rather than as downloadable assets.
  const prerenderPath = path.resolve(distPath, "..", "prerender");

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find ${indexPath}. Build the client before starting the server.`
    );
  }

  // Read the generated filenames once when the server starts.
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

  // Serve assets without letting public/index.html intercept "/".
  app.use(
    express.static(distPath, {
      index: false,
      redirect: false,
    })
  );

  app.get("*", (req, res, next) => {
    // Query strings do not affect which HTML page is served.
    const pathname = req.path;

    // The generator uses the same encoding. Encoding the full route
    // also prevents request paths from escaping the prerender directory.
    const filename = `${Buffer.from(pathname, "utf8").toString("hex")}.html`;

    const htmlPath = prerenderedFiles.has(filename)
      ? path.join(prerenderPath, filename)
      : indexPath;

    // Revalidate HTML so visitors receive the current deployment.
    res.setHeader("Cache-Control", "no-cache");

    res.sendFile(htmlPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });
}