import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { createHash } from "node:crypto";
import { sendMetaConversion } from "./metaConversions";
import { jobLeadData, metaAttributionSchema } from "../shared/metaConversions";

const request = { headers: { "user-agent": "test-browser" } } as Request;
const event = {
  eventName: "Lead" as const, eventId: "job:42", sourcePath: "/post-job" as const,
  email: "  Example@Example.COM ", attribution: { consent: true as const, fbp: "fb.1.123.456" },
  customData: jobLeadData,
};

beforeEach(() => {
  vi.stubEnv("META_CAPI_ENABLED", "true");
  vi.stubEnv("META_CAPI_ACCESS_TOKEN", "test-token");
  vi.stubEnv("META_PIXEL_ID", "123456");
  vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ events_received: 1 }))));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Meta CAPI delivery", () => {
  it("sends a hashed email and server-owned event identity without raw contact data", async () => {
    await sendMetaConversion(request, event);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v23.0/123456/events");
    expect(options?.headers).toMatchObject({ Authorization: "Bearer test-token" });
    const body = JSON.parse(options?.body as string);
    expect(body.data[0]).toMatchObject({ event_name: "Lead", event_id: "job:42", action_source: "website", event_source_url: "https://saskhandy.com/post-job", custom_data: jobLeadData });
    expect(body.data[0].user_data.em).toEqual([createHash("sha256").update("example@example.com").digest("hex")]);
    expect(options?.body).not.toContain("Example@Example.COM");
    expect(body.test_event_code).toBeUndefined();
  });
  it("does not send without affirmative consent", async () => {
    await sendMetaConversion(request, { ...event, attribution: undefined });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["sec-gpc", "dnt"])("honors %s opt-out", async header => {
    await sendMetaConversion({ headers: { [header]: "1" } } as Request, event);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["META_CAPI_ACCESS_TOKEN", "META_PIXEL_ID", "META_CAPI_ENABLED"])("fails closed without %s", async key => {
    vi.stubEnv(key, "");
    await sendMetaConversion(request, event);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("supports Meta Test Events without hardcoding a test code", async () => {
    vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "TEST123");
    await sendMetaConversion(request, event);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string).test_event_code).toBe("TEST123");
  });
  it("retries transient failures with exactly the same event payload", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    const delivery = sendMetaConversion(request, event);
    await vi.runAllTimersAsync();
    await delivery;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(vi.mocked(fetch).mock.calls[1][1]?.body);
  });
  it("does not retry token errors or log Meta response bodies", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValue(new Response("private response", { status: 401 }));
    await expect(sendMetaConversion(request, event)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("private response");
  });
  it("bounds network retries and absorbs exhaustion", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new Error("private exception"));
    const delivery = sendMetaConversion(request, event);
    await vi.runAllTimersAsync();
    await expect(delivery).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("rejects malformed attribution while accepting valid click IDs", () => {
    expect(metaAttributionSchema.safeParse({ consent: true, fbc: "fb.1.123.Ab_C-12" }).success).toBe(true);
    expect(metaAttributionSchema.safeParse({ consent: true, fbc: "arbitrary@example.com" }).success).toBe(false);
  });
});
