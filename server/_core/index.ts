import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { constructWebhookEvent } from "../stripe";
import { getDb } from "../db";
import { payments, jobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";
import multer from "multer";
import { nanoid } from "nanoid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Stripe Webhook (MUST be before express.json) ───────────────────────────
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      let event;
      try {
        event = constructWebhookEvent(req.body as Buffer, sig);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Test event passthrough
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Event: ${event.type} (${event.id})`);

      if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as any;
        const jobId = parseInt(intent.metadata?.jobId ?? "0");
        if (jobId) {
          const db = await getDb();
          if (db) {
            await db
              .update(payments)
              .set({ status: "pending", stripePaymentIntentId: intent.id })
              .where(eq(payments.jobId, jobId));
            await db
              .update(jobs)
              .set({ status: "in_progress" })
              .where(eq(jobs.id, jobId));
            console.log(`[Webhook] Payment confirmed for job ${jobId}`);
          }
        }
      }

      res.json({ received: true });
    }
  );

  // ─── Body parsers ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── File Upload Endpoint ────────────────────────────────────────────────────
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });

  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const ext = (req.file.originalname as string).split(".").pop() ?? "bin";
      const key = `uploads/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer as Buffer, req.file.mimetype as string);
      res.json({ url, key });
    } catch (err: any) {
      console.error("[Upload] Error:", err.message);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // ─── OAuth callback ──────────────────────────────────────────────────────────
  registerOAuthRoutes(app);

  // ─── tRPC API ────────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ─── Frontend ────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
