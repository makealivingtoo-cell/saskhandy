import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
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
  return new Promise((resolve) => {
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

function getJobIdFromPaymentIntent(intent: any) {
  const rawJobId = intent?.metadata?.jobId;
  const jobId = Number.parseInt(rawJobId ?? "0", 10);

  if (!Number.isFinite(jobId) || jobId <= 0) {
    return null;
  }

  return jobId;
}

async function markPaymentSucceeded(intent: any) {
  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.succeeded missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "pending",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "in_progress",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.log(`[Webhook] Payment succeeded for job ${jobId}. Job moved to in_progress.`);
}

async function markPaymentFailed(intent: any) {
  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.payment_failed missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "failed",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "awaiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.warn(
    "[Webhook] Payment failed:",
    intent.id,
    intent.last_payment_error?.message ?? "Unknown error"
  );
}

async function markPaymentCanceled(intent: any) {
  const jobId = getJobIdFromPaymentIntent(intent);

  if (!jobId) {
    console.warn("[Webhook] payment_intent.canceled missing valid jobId metadata:", intent.id);
    return;
  }

  const db = await getDb();

  await db
    .update(payments)
    .set({
      status: "failed",
      stripePaymentIntentId: intent.id,
      updatedAt: new Date(),
    })
    .where(eq(payments.jobId, jobId));

  await db
    .update(jobs)
    .set({
      status: "awaiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.warn("[Webhook] Payment canceled:", intent.id);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature || Array.isArray(signature)) {
        console.error("[Webhook] Missing or invalid Stripe signature header");
        return res.status(400).send("Webhook Error: Missing or invalid Stripe signature");
      }

      let event;

      try {
        event = constructWebhookEvent(req.body as Buffer, signature);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case "payment_intent.succeeded": {
            const intent = event.data.object as any;
            await markPaymentSucceeded(intent);
            break;
          }

          case "payment_intent.payment_failed": {
            const intent = event.data.object as any;
            await markPaymentFailed(intent);
            break;
          }

          case "payment_intent.canceled": {
            const intent = event.data.object as any;
            await markPaymentCanceled(intent);
            break;
          }

          default:
            console.log(`[Webhook] Ignored event type: ${event.type}`);
            break;
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error("[Webhook] Handler failed:", err?.message ?? err);
        return res.status(500).json({
          error: "Webhook handler failed",
          message: err?.message ?? "Unknown error",
        });
      }
    }
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const ext = (req.file.originalname as string).split(".").pop() ?? "bin";
      const key = `uploads/${nanoid()}.${ext}`;

      const { url } = await storagePut(
        key,
        req.file.buffer as Buffer,
        req.file.mimetype as string
      );

      return res.json({ url, key });
    } catch (err: any) {
      console.error("[Upload] Error:", err.message);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);