import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const INTEGRATION_SIGNATURE_WINDOW_SECONDS = 300;

export interface CanonicalIntegrationRequest {
  timestamp: string;
  method: string;
  path: string;
  requestId: string;
  body: string;
}

export function integrationBodyDigest(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

export function canonicalIntegrationRequest(input: CanonicalIntegrationRequest): string {
  return ["voicenexus-integration-v1", input.timestamp, input.method.toUpperCase(), input.path, input.requestId, integrationBodyDigest(input.body)].join("\n");
}

export function signIntegrationRequest(secret: string, input: CanonicalIntegrationRequest): string {
  const digest = createHmac("sha256", secret).update(canonicalIntegrationRequest(input), "utf8").digest("hex");
  return `v1=${digest}`;
}

export function verifyIntegrationRequest(secret: string, input: CanonicalIntegrationRequest, suppliedSignature: string | null, nowMs = Date.now()): boolean {
  const timestamp = Number(input.timestamp);
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(nowMs / 1000) - timestamp) > INTEGRATION_SIGNATURE_WINDOW_SECONDS) return false;
  if (!suppliedSignature?.startsWith("v1=")) return false;
  const suppliedHex = suppliedSignature.slice(3);
  if (!/^[a-f0-9]{64}$/.test(suppliedHex)) return false;
  const expectedHex = signIntegrationRequest(secret, input).slice(3);
  const supplied = Buffer.from(suppliedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
