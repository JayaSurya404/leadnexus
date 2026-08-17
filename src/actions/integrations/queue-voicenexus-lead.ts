"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deliverVoiceNexusEvent } from "@/features/integrations/voicenexus-delivery";
import { voiceNexusHandoffSchema, type VoiceNexusHandoff } from "@/features/integrations/voicenexus-contract";
import { requireOwner } from "@/lib/auth/require-owner";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidSchema = z.string().uuid();

function requireActualOwner(role: string): void {
  if (role !== "OWNER") throw new Error("Only a business owner can send leads to VoiceNexus.");
}

export async function queueVoiceNexusLeadAction(leadId: string): Promise<void> {
  const parsedLeadId = uuidSchema.safeParse(leadId);
  if (!parsedLeadId.success) throw new Error("Invalid lead ID.");
  const context = await requireOwner();
  requireActualOwner(context.role);
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin.from("outbox_events")
    .select("id,status")
    .eq("business_id", context.business.id).eq("provider", "VOICENEXUS")
    .eq("event_type", "LEAD_HANDOFF_REQUESTED").eq("aggregate_id", parsedLeadId.data)
    .in("status", ["PENDING", "PROCESSING"]).limit(1).maybeSingle();
  if (existingError) throw new Error("Unable to inspect the VoiceNexus queue.");
  if (existing) {
    if (existing.status === "PENDING") await deliverVoiceNexusEvent(existing.id, context.business.id);
    revalidatePath("/settings");
    return;
  }

  const { data: lead, error: leadError } = await admin.from("leads").select(`
    id,business_id,name,phone,email,status,contact_intent,primary_product_id,created_at,do_not_call
  `).eq("id", parsedLeadId.data).eq("business_id", context.business.id)
    .eq("visibility", "OWNER_VISIBLE").is("archived_at", null).maybeSingle();
  if (leadError || !lead) throw new Error("Owner-visible lead could not be found.");

  const [productResult, intelligenceResult] = await Promise.all([
    lead.primary_product_id
      ? admin.from("products").select("id,name").eq("id", lead.primary_product_id).eq("business_id", context.business.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from("lead_intelligence").select("temperature,score,primary_interest,buying_intent,reasons,recommended_action")
      .eq("lead_id", lead.id).eq("business_id", context.business.id).maybeSingle()
  ]);
  if (productResult.error || intelligenceResult.error) throw new Error("LeadNexus context could not be prepared.");
  const eventId = randomUUID();
  const requestedAt = new Date().toISOString();
  const intelligence = intelligenceResult.data;
  const payload: VoiceNexusHandoff = {
    schemaVersion: "1.0",
    event: "LEAD_HANDOFF_REQUESTED",
    eventId,
    requestedAt,
    business: { id: context.business.id, name: context.business.name, slug: context.business.slug },
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: lead.do_not_call ? "DO_NOT_CALL" : lead.status,
      contactIntent: lead.contact_intent,
      doNotCall: Boolean(lead.do_not_call),
      createdAt: lead.created_at
    },
    product: productResult.data ? { id: productResult.data.id, name: productResult.data.name } : null,
    intelligence: intelligence ? {
      temperature: intelligence.temperature,
      score: Number(intelligence.score),
      primaryInterest: intelligence.primary_interest,
      buyingIntent: intelligence.buying_intent,
      reasons: Array.isArray(intelligence.reasons) ? intelligence.reasons : [],
      recommendedAction: intelligence.recommended_action
    } : null
  };
  const validated = voiceNexusHandoffSchema.parse(payload);
  const { error } = await admin.from("outbox_events").insert({
    id: eventId,
    business_id: context.business.id,
    provider: "VOICENEXUS",
    event_type: "LEAD_HANDOFF_REQUESTED",
    aggregate_type: "lead",
    aggregate_id: lead.id,
    payload: validated,
    status: "PENDING",
    idempotency_key: `voicenexus:${eventId}`,
    available_at: requestedAt
  });
  if (error) throw new Error(error.code === "23505" ? "A VoiceNexus handoff is already active for this lead." : "Unable to queue VoiceNexus handoff.");
  await deliverVoiceNexusEvent(eventId, context.business.id);
  revalidatePath("/settings");
}

export async function retryVoiceNexusHandoffAction(eventId: string): Promise<void> {
  const parsedEventId = uuidSchema.safeParse(eventId);
  if (!parsedEventId.success) throw new Error("Invalid handoff event ID.");
  const context = await requireOwner();
  requireActualOwner(context.role);
  const admin = createAdminClient();
  const { data, error } = await admin.from("outbox_events").select("id,status")
    .eq("id", parsedEventId.data).eq("business_id", context.business.id)
    .eq("provider", "VOICENEXUS").eq("event_type", "LEAD_HANDOFF_REQUESTED").maybeSingle();
  if (error || !data) throw new Error("VoiceNexus handoff could not be found.");
  if (data.status === "SENT") { revalidatePath("/settings"); return; }
  const { error: updateError } = await admin.from("outbox_events").update({ status: "PENDING", available_at: new Date().toISOString(), last_error: null })
    .eq("id", data.id).eq("business_id", context.business.id);
  if (updateError) throw new Error("VoiceNexus handoff could not be prepared for retry.");
  await deliverVoiceNexusEvent(data.id, context.business.id);
  revalidatePath("/settings");
}
