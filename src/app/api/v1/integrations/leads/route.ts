import {
  NextRequest,
  NextResponse,
} from "next/server";

import { verifyIntegrationRequest } from "@/features/integrations/integration-signing";
import { voiceNexusAcknowledgeSchema } from "@/features/integrations/voicenexus-contract";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    {
      error:
        "Unauthorized.",
    },
    {
      status: 401,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

function unavailable() {
  return NextResponse.json(
    {
      error:
        "VoiceNexus integration is not configured.",
    },
    {
      status: 503,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

function authenticate(request: NextRequest, body: string) {
  const secret = process.env.VOICENEXUS_SHARED_SECRET;
  if (!secret || secret.length < 32) return unavailable();

  const timestamp = request.headers.get("x-integration-timestamp") ?? "";
  const requestId = request.headers.get("x-integration-request-id") ?? "";
  if (!/^[0-9]+$/.test(timestamp) || !/^[0-9a-f-]{36}$/i.test(requestId)) return unauthorized();

  return verifyIntegrationRequest(secret, {
    timestamp,
    method: request.method,
    path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    requestId,
    body,
  }, request.headers.get("x-integration-signature")) ? null : unauthorized();
}

export async function GET(
  request: NextRequest,
) {
  const authenticationError = authenticate(request, "");
  if (authenticationError) return authenticationError;

  const requestedLimit =
    Number(
      request.nextUrl
        .searchParams
        .get("limit") ??
        "20",
    );

  const limit =
    Number.isFinite(
      requestedLimit,
    )
      ? Math.min(
          Math.max(
            Math.floor(
              requestedLimit,
            ),
            1,
          ),
          50,
        )
      : 20;

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      "outbox_events",
    )
    .select(
      `
        id,
        business_id,
        event_type,
        aggregate_type,
        aggregate_id,
        payload,
        status,
        attempt_count,
        created_at
      `,
    )
    .eq(
      "provider",
      "VOICENEXUS",
    )
    .eq(
      "status",
      "PENDING",
    )
    .lte(
      "available_at",
      new Date()
        .toISOString(),
    )
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
    .limit(limit);

  if (error) {
    console.error(
      "VoiceNexus outbox GET:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load handoff events.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      schemaVersion:
        "1.0",

      count:
        data?.length ??
        0,

      events:
        data ?? [],
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  const rawBody = await request.text();
  if (rawBody.length > 20_000) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }
  const authenticationError = authenticate(request, rawBody);
  if (authenticationError) return authenticationError;

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  const parsed =
    voiceNexusAcknowledgeSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid acknowledgement.",
      },
      {
        status: 400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const {
    eventId,
    businessId,
    status,
    error:
      consumerError,
  } = parsed.data;

  const supabase =
    createAdminClient();

  const {
    data: event,
    error:
      eventError,
  } = await supabase
    .from(
      "outbox_events",
    )
    .select(
      `
        id,
        business_id,
        status
      `,
    )
    .eq(
      "id",
      eventId,
    )
    .eq(
      "business_id",
      businessId,
    )
    .eq(
      "provider",
      "VOICENEXUS",
    )
    .maybeSingle();

  if (
    eventError ||
    !event
  ) {
    return NextResponse.json(
      {
        error:
          "Handoff event not found.",
      },
      {
        status: 404,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const now =
    new Date()
      .toISOString();

  const effectiveStatus =
    event.status === "SENT"
      ? "SENT"
      : status;

  const {
    error:
      updateError,
  } = await supabase
    .from(
      "outbox_events",
    )
    .update({
      status:
        effectiveStatus,

      last_error:
        effectiveStatus ===
        "FAILED"
          ? consumerError ??
            "VoiceNexus reported a failed handoff."
          : null,

      sent_at:
        effectiveStatus ===
        "SENT"
          ? now
          : null,

      processed_at:
        effectiveStatus === "SENT"
          ? now
          : null,

      response_payload:
        parsed.data,

      updated_at:
        now,
    })
    .eq(
      "id",
      event.id,
    )
    .eq(
      "business_id",
      businessId,
    );

  if (updateError) {
    return NextResponse.json(
      {
        error:
          "Unable to acknowledge handoff.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const {
    data:
      connection,
  } = await supabase
    .from(
      "integration_connections",
    )
    .select("business_id")
    .eq(
      "business_id",
      event.business_id,
    )
    .eq(
      "provider",
      "VOICENEXUS",
    )
    .limit(1)
    .maybeSingle();

  const connectionPayload = {
    status:
      effectiveStatus ===
      "SENT"
        ? "VERIFIED"
        : "ERROR",

    display_name:
      "VoiceNexus",

    last_error:
      effectiveStatus ===
      "FAILED"
        ? consumerError ??
          "VoiceNexus reported a failed handoff."
          : null,

    last_synced_at:
      effectiveStatus === "SENT"
        ? now
        : null,

    connected_at:
      effectiveStatus ===
      "SENT"
        ? now
        : null,

    updated_at:
      now,
  };

  let connectionWrite;
  if (connection) {
    connectionWrite = await supabase
      .from(
        "integration_connections",
      )
      .update(
        connectionPayload,
      )
      .eq(
        "business_id",
        event.business_id,
      )
      .eq(
        "provider",
        "VOICENEXUS",
      );
  } else {
    connectionWrite = await supabase
      .from(
        "integration_connections",
      )
      .insert({
        business_id:
          event.business_id,

        provider:
          "VOICENEXUS",

        ...connectionPayload,
      });
  }

  if (connectionWrite.error) {
    return NextResponse.json(
      { error: "Unable to update VoiceNexus connection status." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      success: true,

      eventId,

      businessId,

      status:
        effectiveStatus,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}
