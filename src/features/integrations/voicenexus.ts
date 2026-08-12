import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  VoiceNexusIntegrationStatus,
  VoiceNexusLeadOption,
  VoiceNexusOutboxItem,
  VoiceNexusOutboxStatus,
} from "@/types/integrations";

export async function getVoiceNexusIntegrationStatus(
  businessId: string,
): Promise<VoiceNexusIntegrationStatus> {
  const supabase =
    createAdminClient();

  const [
    leadsResult,
    productsResult,
    eventsResult,
    connectionResult,
  ] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          `
            id,
            name,
            phone,
            email,
            status,
            primary_product_id
          `,
        )
        .eq(
          "business_id",
          businessId,
        )
        .eq(
          "visibility",
          "OWNER_VISIBLE",
        )
        .is(
          "archived_at",
          null,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(100),

      supabase
        .from("products")
        .select(
          "id, name",
        )
        .eq(
          "business_id",
          businessId,
        ),

      supabase
        .from(
          "outbox_events",
        )
        .select(
          `
            id,
            aggregate_id,
            payload,
            status,
            attempt_count,
            last_error,
            created_at,
            sent_at
          `,
        )
        .eq(
          "business_id",
          businessId,
        )
        .eq(
          "provider",
          "VOICENEXUS",
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(50),

      supabase
        .from(
          "integration_connections",
        )
        .select(
          `
            status,
            connected_at,
            last_error
          `,
        )
        .eq(
          "business_id",
          businessId,
        )
        .eq(
          "provider",
          "VOICENEXUS",
        )
        .order(
          "updated_at",
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle(),
    ]);

  if (
    leadsResult.error
  ) {
    throw new Error(
      `Unable to load VoiceNexus leads: ${leadsResult.error.message}`,
    );
  }

  if (
    productsResult.error
  ) {
    throw new Error(
      `Unable to load VoiceNexus products: ${productsResult.error.message}`,
    );
  }

  if (
    eventsResult.error
  ) {
    throw new Error(
      `Unable to load VoiceNexus handoffs: ${eventsResult.error.message}`,
    );
  }

  const productMap =
    new Map<
      string,
      string
    >();

  for (
    const product of
      productsResult.data ??
      []
  ) {
    productMap.set(
      product.id,
      product.name,
    );
  }

  const leads:
    VoiceNexusLeadOption[] =
      (
        leadsResult.data ??
        []
      ).map(
        (lead) => ({
          id:
            lead.id,

          name:
            lead.name,

          phone:
            lead.phone,

          email:
            lead.email,

          productName:
            lead.primary_product_id
              ? productMap.get(
                  lead.primary_product_id,
                ) ??
                null
              : null,

          status:
            lead.status,
        }),
      );

  const events:
    VoiceNexusOutboxItem[] =
      (
        eventsResult.data ??
        []
      ).map(
        (event) => {
          const payload =
            event.payload &&
            typeof event.payload ===
              "object"
              ? (
                  event.payload as Record<
                    string,
                    unknown
                  >
                )
              : {};

          const lead =
            payload.lead &&
            typeof payload.lead ===
              "object"
              ? (
                  payload.lead as Record<
                    string,
                    unknown
                  >
                )
              : {};

          return {
            id:
              event.id,

            leadId:
              event.aggregate_id,

            leadName:
              typeof lead.name ===
              "string"
                ? lead.name
                : "Lead",

            status:
              event.status as
                VoiceNexusOutboxStatus,

            attemptCount:
              Number(
                event.attempt_count ??
                  0,
              ),

            lastError:
              event.last_error,

            createdAt:
              event.created_at,

            sentAt:
              event.sent_at,
          };
        },
      );

  const pending =
    events.filter(
      (event) =>
        event.status ===
          "PENDING" ||
        event.status ===
          "PROCESSING",
    ).length;

  const sent =
    events.filter(
      (event) =>
        event.status ===
        "SENT",
    ).length;

  const failed =
    events.filter(
      (event) =>
        event.status ===
        "FAILED",
    ).length;

  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const configured =
    Boolean(
      process.env
        .VOICENEXUS_SHARED_SECRET,
    );

  const connection =
    connectionResult.data;

  return {
    configured,

    connected:
      connection?.status ===
      "CONNECTED",

    connectionStatus:
      connection?.status ??
      "DISCONNECTED",

    apiEndpoint:
      `${appUrl}/api/v1/integrations/leads`,

    pending,

    sent,

    failed,

    lastConnectedAt:
      connection?.connected_at ??
      null,

    lastError:
      connection?.last_error ??
      null,

    leads,

    events,
  };
}