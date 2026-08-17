import { signIntegrationRequest } from "./integration-signing";
import { voiceNexusImportResponseSchema, type VoiceNexusHandoff, type VoiceNexusImportResponse } from "./voicenexus-contract";

export class VoiceNexusDeliveryError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function validateVoiceNexusImportUrl(value: string, production = process.env.NODE_ENV === "production"): URL {
  const url = new URL(value);
  if (production && (url.protocol !== "https:" || ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname))) {
    throw new VoiceNexusDeliveryError(503, "VoiceNexus import URL must be deployed HTTPS in production.");
  }
  return url;
}

export async function sendVoiceNexusHandoff(
  payload: VoiceNexusHandoff,
  options: { url: string; secret: string; fetchImpl?: typeof fetch; nowMs?: number }
): Promise<VoiceNexusImportResponse> {
  const url = validateVoiceNexusImportUrl(options.url);
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor((options.nowMs ?? Date.now()) / 1000));
  const path = `${url.pathname}${url.search}`;
  const signature = signIntegrationRequest(options.secret, { timestamp, method: "POST", path, requestId: payload.eventId, body });
  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-integration-timestamp": timestamp,
        "x-integration-request-id": payload.eventId,
        "x-integration-signature": signature
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000)
    });
  } catch {
    throw new VoiceNexusDeliveryError(503, "VoiceNexus endpoint is unavailable.");
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const root = json && typeof json === "object" ? json as Record<string, unknown> : {};
    const nested = root.error && typeof root.error === "object" ? root.error as Record<string, unknown> : {};
    const message = typeof nested.message === "string" ? nested.message : "VoiceNexus rejected the handoff.";
    throw new VoiceNexusDeliveryError(response.status, message.slice(0, 1000));
  }
  const parsed = voiceNexusImportResponseSchema.safeParse(json);
  if (!parsed.success || parsed.data.eventId !== payload.eventId) {
    throw new VoiceNexusDeliveryError(502, "VoiceNexus returned an invalid acknowledgement.");
  }
  return parsed.data;
}
