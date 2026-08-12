"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export async function queueVoiceNexusLeadAction(
  leadId: string,
  formData: FormData,
) {
  void formData;

  const context =
    await requireOwner();

  const supabase =
    createAdminClient();

  const {
    data: lead,
    error:
      leadError,
  } = await supabase
    .from("leads")
    .select(
      `
        id,
        business_id,
        name,
        phone,
        email,
        status,
        contact_intent,
        primary_product_id,
        created_at
      `,
    )
    .eq(
      "id",
      leadId,
    )
    .eq(
      "business_id",
      context.business.id,
    )
    .eq(
      "visibility",
      "OWNER_VISIBLE",
    )
    .is(
      "archived_at",
      null,
    )
    .maybeSingle();

  if (
    leadError ||
    !lead
  ) {
    throw new Error(
      "Owner-visible lead could not be found.",
    );
  }

  const {
    data:
      existingEvent,
    error:
      existingError,
  } = await supabase
    .from(
      "outbox_events",
    )
    .select("id")
    .eq(
      "business_id",
      context.business.id,
    )
    .eq(
      "provider",
      "VOICENEXUS",
    )
    .eq(
      "event_type",
      "LEAD_HANDOFF_REQUESTED",
    )
    .eq(
      "aggregate_id",
      leadId,
    )
    .in(
      "status",
      [
        "PENDING",
        "PROCESSING",
      ],
    )
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Unable to inspect VoiceNexus queue: ${existingError.message}`,
    );
  }

  if (existingEvent) {
    revalidatePath(
      "/settings",
    );

    return;
  }

  let product:
    | {
        id: string;
        name: string;
      }
    | null = null;

  if (
    lead.primary_product_id
  ) {
    const {
      data,
    } = await supabase
      .from("products")
      .select(
        "id, name",
      )
      .eq(
        "id",
        lead.primary_product_id,
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .maybeSingle();

    product =
      data;
  }

  const {
    data:
      intelligence,
  } = await supabase
    .from(
      "lead_intelligence",
    )
    .select(
      `
        temperature,
        score,
        primary_interest,
        buying_intent,
        reasons,
        recommended_action
      `,
    )
    .eq(
      "lead_id",
      leadId,
    )
    .eq(
      "business_id",
      context.business.id,
    )
    .maybeSingle();

  const payload = {
    schemaVersion:
      "1.0",

    event:
      "LEAD_HANDOFF_REQUESTED",

    business: {
      id:
        context.business.id,

      name:
        context.business.name,

      slug:
        context.business.slug,
    },

    lead: {
      id:
        lead.id,

      name:
        lead.name,

      phone:
        lead.phone,

      email:
        lead.email,

      status:
        lead.status,

      contactIntent:
        lead.contact_intent,

      createdAt:
        lead.created_at,

      product:
        product
          ? {
              id:
                product.id,

              name:
                product.name,
            }
          : null,
    },

    intelligence:
      intelligence
        ? {
            temperature:
              intelligence.temperature,

            score:
              intelligence.score,

            primaryInterest:
              intelligence.primary_interest,

            buyingIntent:
              intelligence.buying_intent,

            reasons:
              intelligence.reasons,

            recommendedAction:
              intelligence.recommended_action,
          }
        : null,

    requestedAt:
      new Date()
        .toISOString(),
  };

  const {
    error,
  } = await supabase
    .from(
      "outbox_events",
    )
    .insert({
      business_id:
        context.business.id,

      provider:
        "VOICENEXUS",

      event_type:
        "LEAD_HANDOFF_REQUESTED",

      aggregate_type:
        "lead",

      aggregate_id:
        lead.id,

      payload,

      status:
        "PENDING",

      available_at:
        new Date()
          .toISOString(),
    });

  if (error) {
    throw new Error(
      `Unable to queue VoiceNexus handoff: ${error.message}`,
    );
  }

  revalidatePath(
    "/settings",
  );
}