import { describe, expect, it, vi } from "vitest";

import { signIntegrationRequest, verifyIntegrationRequest } from "../../src/features/integrations/integration-signing";
import { voiceNexusHandoffSchema } from "../../src/features/integrations/voicenexus-contract";
import { sendVoiceNexusHandoff, VoiceNexusDeliveryError } from "../../src/features/integrations/voicenexus-http";

const payload = voiceNexusHandoffSchema.parse({
  schemaVersion: "1.0",
  event: "LEAD_HANDOFF_REQUESTED",
  eventId: "11111111-1111-4111-8111-111111111111",
  requestedAt: "2026-08-17T10:00:00.000Z",
  business: { id: "22222222-2222-4222-8222-222222222222", name: "Acme", slug: "acme" },
  lead: {
    id: "33333333-3333-4333-8333-333333333333", name: "Priya", phone: "+919876543210",
    email: "priya@example.com", status: "QUALIFIED", contactIntent: "DIRECT_CONTACT", doNotCall: false,
    createdAt: "2026-08-17T09:00:00.000Z",
  },
  product: { id: "44444444-4444-4444-8444-444444444444", name: "Growth plan" },
  intelligence: { temperature: "HOT", score: 91, primaryInterest: "Automation", buyingIntent: "Ready", reasons: ["Pricing visited"], recommendedAction: "Review" },
});

describe("VoiceNexus signed handoff", () => {
  const secret = "a-secure-shared-secret-with-at-least-32-characters";
  const nowMs = Date.parse("2026-08-17T10:00:00.000Z");

  it("rejects unknown fields and malformed lead identity", () => {
    expect(voiceNexusHandoffSchema.safeParse({ ...payload, extra: true }).success).toBe(false);
    expect(voiceNexusHandoffSchema.safeParse({ ...payload, schemaVersion: "2.0" }).success).toBe(false);
    expect(voiceNexusHandoffSchema.safeParse({ ...payload, lead: { ...payload.lead, phone: "9876543210" } }).success).toBe(false);
    expect(voiceNexusHandoffSchema.safeParse({ ...payload, lead: { ...payload.lead, email: "invalid" } }).success).toBe(false);
    const missingPhone = structuredClone(payload) as Record<string, unknown> & { lead: Record<string, unknown> };
    delete missingPhone.lead.phone;
    expect(voiceNexusHandoffSchema.safeParse(missingPhone).success).toBe(false);
  });

  it("rejects wrong, missing, tampered, expired, and future signatures", () => {
    const request = { timestamp: String(nowMs / 1000), method: "POST", path: "/api/v1/integrations/leadnexus", requestId: payload.eventId, body: JSON.stringify(payload) };
    const signature = signIntegrationRequest(secret, request);
    expect(verifyIntegrationRequest(secret, request, signature, nowMs)).toBe(true);
    expect(verifyIntegrationRequest("wrong-secret-with-at-least-32-characters", request, signature, nowMs)).toBe(false);
    expect(verifyIntegrationRequest(secret, request, null, nowMs)).toBe(false);
    expect(verifyIntegrationRequest(secret, { ...request, body: `${request.body} ` }, signature, nowMs)).toBe(false);
    for (const seconds of [-301, 301]) {
      const shifted = { ...request, timestamp: String(nowMs / 1000 + seconds) };
      expect(verifyIntegrationRequest(secret, shifted, signIntegrationRequest(secret, shifted), nowMs)).toBe(false);
    }
  });

  it("sends exact signed headers and accepts a strict acknowledgement", async () => {
    const fetchImpl = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      const body = String(init?.body);
      const headers = new Headers(init?.headers);
      expect(verifyIntegrationRequest(secret, {
        timestamp: headers.get("x-integration-timestamp") ?? "",
        method: "POST",
        path: "/api/v1/integrations/leadnexus",
        requestId: headers.get("x-integration-request-id") ?? "",
        body,
      }, headers.get("x-integration-signature"), nowMs)).toBe(true);
      return Response.json({ schemaVersion: "1.0", eventId: payload.eventId, status: "IMPORTED", voiceNexusLeadId: "55555555-5555-4555-8555-555555555555", duplicate: false, doNotCall: false });
    });
    await expect(sendVoiceNexusHandoff(payload, { url: "http://127.0.0.1:3001/api/v1/integrations/leadnexus", secret, fetchImpl: fetchImpl as typeof fetch, nowMs })).resolves.toMatchObject({ status: "IMPORTED" });
  });

  it.each([
    ["endpoint failure", vi.fn(async () => { throw new Error("offline"); }), 503],
    ["VoiceNexus 500", vi.fn(async () => Response.json({ error: { message: "safe failure" } }, { status: 500 })), 500],
    ["invalid acknowledgement", vi.fn(async () => Response.json({ ok: true })), 502],
  ])("keeps %s retryable", async (_name, fetchImpl, status) => {
    await expect(sendVoiceNexusHandoff(payload, { url: "http://127.0.0.1:3001/api/v1/integrations/leadnexus", secret, fetchImpl: fetchImpl as typeof fetch, nowMs }))
      .rejects.toMatchObject({ status } satisfies Partial<VoiceNexusDeliveryError>);
  });
});
