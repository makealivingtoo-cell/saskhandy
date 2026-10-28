import { afterEach, beforeEach, expect, it, vi } from "vitest";

let choice: string | null;
let appendChild: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  choice = null;
  appendChild = vi.fn();
  vi.stubGlobal("localStorage", { getItem: () => choice, setItem: (_: string, value: string) => { choice = value; } });
  vi.stubGlobal("navigator", { doNotTrack: "0" });
  vi.stubGlobal("window", { addEventListener: vi.fn(), dispatchEvent: vi.fn(), setTimeout: vi.fn() });
  vi.stubGlobal("document", { createElement: () => ({}), head: { appendChild }, cookie: "" });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("does not load Meta or track conversions before consent", async () => {
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  trackJobLead("job:42");
  expect(appendChild).not.toHaveBeenCalled();
  expect(window.fbq).toBeUndefined();
});

it("queues matching browser event names and IDs after consent", async () => {
  choice = "granted";
  const { trackJobLead, trackCompleteRegistration } = await import("../client/src/lib/metaPixel");
  trackJobLead("job:42");
  trackCompleteRegistration("website", "handyman", "registration:7");
  const queue = (window.fbq as unknown as { queue: unknown[][] }).queue;
  expect(queue).toContainEqual(["init", "1016886836651819"]);
  expect(queue).toContainEqual(["track", "Lead", {
    content_name: "Customer Job Posted", lead_source: "website", user_type: "homeowner",
  }, { eventID: "job:42" }]);
  expect(queue).toContainEqual(["track", "CompleteRegistration", {
    content_name: "Handyman Signup", status: "completed", registration_method: "website", user_type: "handyman",
  }, { eventID: "registration:7" }]);
  expect(appendChild).toHaveBeenCalledTimes(1);
});

it("stops new browser events when consent is withdrawn", async () => {
  choice = "granted";
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  trackJobLead("job:42");
  const queue = (window.fbq as unknown as { queue: unknown[][] }).queue;
  const count = queue.length;
  choice = "denied";
  trackJobLead("job:43");
  expect(queue).toHaveLength(count);
});

it("does not send a browser conversion without a server-issued ID", async () => {
  choice = "granted";
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  trackJobLead();
  expect(appendChild).not.toHaveBeenCalled();
});

it("honors browser global privacy control despite a stored grant", async () => {
  choice = "granted";
  vi.stubGlobal("navigator", { globalPrivacyControl: true });
  const { getMetaAttribution } = await import("../client/src/lib/metaConsent");
  expect(getMetaAttribution()).toBeUndefined();
});
