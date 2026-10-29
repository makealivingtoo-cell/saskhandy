import { afterEach, beforeEach, expect, it, vi } from "vitest";

let appendChild: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  appendChild = vi.fn();
  vi.stubGlobal("window", {});
  vi.stubGlobal("document", { createElement: () => ({}), head: { appendChild } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("queues the customer Lead even before the Pixel script loads", async () => {
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  trackJobLead();
  const queue = (window.fbq as unknown as { queue: unknown[][] }).queue;
  expect(queue[0]).toEqual(["init", "1016886836651819"]);
  expect(queue.filter(event => event[1] === "Lead")).toEqual([["track", "Lead", {
    content_name: "Customer Job Posted", lead_source: "website", user_type: "homeowner",
  }]]);
  expect(appendChild).toHaveBeenCalledTimes(1);
});

it("does not let a blocked script interrupt the job confirmation", async () => {
  appendChild.mockImplementation(() => { throw new Error("script blocked"); });
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  expect(() => trackJobLead()).not.toThrow();
});

it("absorbs an exception from the tracking function", async () => {
  vi.stubGlobal("window", { fbq: () => { throw new Error("tracking failure"); } });
  const { trackJobLead } = await import("../client/src/lib/metaPixel");
  expect(() => trackJobLead()).not.toThrow();
});

it("preserves separate homeowner and handyman registration labels", async () => {
  const { trackCompleteRegistration } = await import("../client/src/lib/metaPixel");
  trackCompleteRegistration("website", "homeowner");
  trackCompleteRegistration("website", "handyman");
  const queue = (window.fbq as unknown as { queue: unknown[][] }).queue;
  const registrations = queue.filter(event => event[1] === "CompleteRegistration");
  expect(registrations.map(event => event[2])).toEqual([
    { content_name: "Homeowner Signup", status: "completed", registration_method: "website", user_type: "homeowner" },
    { content_name: "Handyman Signup", status: "completed", registration_method: "website", user_type: "handyman" },
  ]);
});
