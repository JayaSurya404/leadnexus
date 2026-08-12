import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  isValidVoiceNexusAuthorization,
} from "@/features/integrations/voicenexus-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  voiceNexusAcknowledgeSchema,
} from "@/lib/validation/integration";

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

export async function GET(
  request: NextRequest,
) {
  const secret =
    process.env
      .VOICENEXUS_SHARED_SECRET;

  if (!secret) {
    return unavailable();
  }

  if (
    !isValidVoiceNexusAuthorization(
      request.headers.get(
        "authorization",
      ),
      secret,
    )
  ) {
    return unauthorized();
  }

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
  const secret =
    process.env
      .VOICENEXUS_SHARED_SECRET;

  if (!secret) {
    return unavailable();
  }

  if (
    !isValidVoiceNexusAuthorization(
      request.headers.get(
        "authorization",
      ),
      secret,
    )
  ) {
    return unauthorized();
  }

  const body =
    await request
      .json()
      .catch(
        () => null,
      );

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
        attempt_count
      `,
    )
    .eq(
      "id",
      eventId,
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

  const {
    error:
      updateError,
  } = await supabase
    .from(
      "outbox_events",
    )
    .update({
      status,

      attempt_count:
        Number(
          event.attempt_count ??
            0,
        ) + 1,

      last_error:
        status ===
        "FAILED"
          ? consumerError ??
            "VoiceNexus reported a failed handoff."
          : null,

      sent_at:
        status ===
        "SENT"
          ? now
          : null,

      updated_at:
        now,
    })
    .eq(
      "id",
      event.id,
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
      status ===
      "SENT"
        ? "CONNECTED"
        : "ERROR",

    display_name:
      "VoiceNexus",

    last_error:
      status ===
      "FAILED"
        ? consumerError ??
          "VoiceNexus reported a failed handoff."
        : null,

    connected_at:
      status ===
      "SENT"
        ? now
        : null,

    updated_at:
      now,
  };

  if (connection) {
    await supabase
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
    await supabase
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

  return NextResponse.json(
    {
      success: true,

      eventId,

      status,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}