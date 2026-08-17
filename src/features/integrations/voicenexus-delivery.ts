import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { voiceNexusHandoffSchema } from "@/features/integrations/voicenexus-contract";
import { sendVoiceNexusHandoff, VoiceNexusDeliveryError } from "@/features/integrations/voicenexus-http";

function safeMessage(error: unknown): string {
  return error instanceof VoiceNexusDeliveryError ? error.message.slice(0, 1000) : "VoiceNexus delivery failed safely.";
}

export async function deliverVoiceNexusEvent(eventId: string, businessId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: event, error } = await admin.from("outbox_events")
    .select("id,business_id,payload,status,attempt_count")
    .eq("id", eventId).eq("business_id", businessId).eq("provider", "VOICENEXUS").eq("event_type", "LEAD_HANDOFF_REQUESTED").maybeSingle();
  if (error || !event) throw new Error("VoiceNexus handoff event could not be found.");
  if (event.status === "SENT") return true;
  const parsed = voiceNexusHandoffSchema.safeParse(event.payload);
  if (!parsed.success || parsed.data.eventId !== event.id) {
    await admin.from("outbox_events").update({ status: "FAILED", last_error: "Stored handoff payload is invalid." }).eq("id", event.id);
    return false;
  }
  const attempts = Number(event.attempt_count ?? 0) + 1;
  const now = new Date().toISOString();
  const { error: processingError } = await admin.from("outbox_events").update({
    status: "PROCESSING", attempt_count: attempts, last_attempt_at: now, last_error: null
  }).eq("id", event.id).eq("business_id", businessId);
  if (processingError) throw new Error("VoiceNexus handoff could not enter processing state.");

  try {
    const url = process.env.VOICENEXUS_IMPORT_URL;
    const secret = process.env.VOICENEXUS_SHARED_SECRET;
    if (!url || !secret || secret.length < 32) throw new VoiceNexusDeliveryError(503, "VoiceNexus delivery is not configured.");
    const response = await sendVoiceNexusHandoff(parsed.data, { url, secret });
    const completedAt = new Date().toISOString();
    const { error: connectionError } = await admin.from("integration_connections").upsert({
      business_id: businessId,
      provider: "VOICENEXUS",
      status: "VERIFIED",
      display_name: "VoiceNexus",
      last_error: null,
      connected_at: completedAt,
      last_synced_at: completedAt
    }, { onConflict: "business_id,provider" });
    if (connectionError) throw new VoiceNexusDeliveryError(500, "VoiceNexus connection status could not be acknowledged.");
    const { error: sentError } = await admin.from("outbox_events").update({
      status: "SENT",
      last_error: null,
      sent_at: completedAt,
      processed_at: completedAt,
      response_payload: response
    }).eq("id", event.id).eq("business_id", businessId);
    if (sentError) throw new VoiceNexusDeliveryError(500, "VoiceNexus acknowledgement could not be persisted.");
    return true;
  } catch (deliveryError) {
    const message = safeMessage(deliveryError);
    const retryAt = new Date(Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** Math.min(attempts - 1, 5))).toISOString();
    await admin.from("outbox_events").update({ status: "FAILED", last_error: message, available_at: retryAt }).eq("id", event.id).eq("business_id", businessId);
    await admin.from("integration_connections").upsert({
      business_id: businessId,
      provider: "VOICENEXUS",
      status: "ERROR",
      display_name: "VoiceNexus",
      last_error: message
    }, { onConflict: "business_id,provider" });
    return false;
  }
}
