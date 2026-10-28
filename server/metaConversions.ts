import { createHash } from "node:crypto";
import type { Request } from "express";
import type { MetaAttribution } from "../shared/metaConversions";

type Conversion = {
  eventName: "Lead" | "CompleteRegistration";
  eventId: string;
  sourcePath: "/post-job" | "/sign-up";
  email?: string | null;
  attribution?: MetaAttribution;
  customData: Record<string, string>;
};

/** No token or contact data is ever written to logs or returned to the browser. */
export async function sendMetaConversion(req: Request, event: Conversion): Promise<void> {
  try {
    const token = process.env.META_CAPI_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;
    if (process.env.META_CAPI_ENABLED !== "true" || !token || !pixelId) return;
    if (!event.attribution?.consent || req.headers["sec-gpc"] === "1" || req.headers.dnt === "1") return;
    const version = process.env.META_GRAPH_API_VERSION || "v23.0";
    if (!/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(pixelId)) return;
    const email = event.email?.trim().toLowerCase();
    const payload = {
      data: [{
        event_name: event.eventName,
        event_id: event.eventId,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: `https://saskhandy.com${event.sourcePath}`,
        user_data: {
          ...(email ? { em: [createHash("sha256").update(email).digest("hex")] } : {}),
          client_user_agent: req.headers["user-agent"],
          fbp: event.attribution.fbp,
          fbc: event.attribution.fbc,
        },
        custom_data: event.customData,
      }],
      ...(process.env.META_CAPI_TEST_EVENT_CODE
        ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE } : {}),
    };

    // The same event ID and timestamp are reused on transient retries.
    // This bounded delivery runs independently of the customer's request.
    for (let attempt = 0; attempt < 3; attempt++) {
      let retry = false;
      try {
        const response = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok) {
          const result = await response.json() as { events_received?: number };
          if (result.events_received === 1) return;
          console.warn("[Meta CAPI] Event was not acknowledged");
          return;
        }
        retry = response.status === 429 || response.status >= 500;
        if (!retry) {
          console.warn("[Meta CAPI] Event rejected; HTTP status", response.status);
          return;
        }
      } catch {
        retry = true;
      }
      if (retry && attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
    console.warn("[Meta CAPI] Delivery failed after three attempts");
  } catch {
    console.warn("[Meta CAPI] Could not prepare event");
  }
}
