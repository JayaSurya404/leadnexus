import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  publicSessionSchema,
} from "@/lib/validation/public";

type Attribution = {
  source: string;

  medium:
    | string
    | null;

  campaign:
    | string
    | null;

  content:
    | string
    | null;

  term:
    | string
    | null;

  trackingLinkId:
    | string
    | null;
};

function validUuid(
  value:
    | string
    | null,
) {
  if (!value) {
    return null;
  }

  const pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return pattern.test(
    value,
  )
    ? value
    : null;
}

function attributionFromLandingPath(
  landingPath: string,
  fallbackSource:
    | string
    | null
    | undefined,
): Attribution {
  try {
    const url =
      new URL(
        landingPath,
        "https://leadnexus.local",
      );

    return {
      source:
        url.searchParams.get(
          "utm_source",
        ) ??
        fallbackSource ??
        "Direct",

      medium:
        url.searchParams.get(
          "utm_medium",
        ),

      campaign:
        url.searchParams.get(
          "utm_campaign",
        ),

      content:
        url.searchParams.get(
          "utm_content",
        ),

      term:
        url.searchParams.get(
          "utm_term",
        ),

      trackingLinkId:
        validUuid(
          url.searchParams.get(
            "ln_tracking",
          ),
        ),
    };
  } catch {
    return {
      source:
        fallbackSource ??
        "Direct",

      medium:
        null,

      campaign:
        null,

      content:
        null,

      term:
        null,

      trackingLinkId:
        null,
    };
  }
}

export async function POST(
  request: Request,
) {
  const body =
    await request
      .json()
      .catch(
        () => null,
      );

  const parsed =
    publicSessionSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid visitor session request.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    businessId,
    existingSessionId,
    anonymousId,
    source,
    referrer,
    landingPath,
  } = parsed.data;

  const supabase =
    createAdminClient();

  const {
    data: business,
    error:
      businessError,
  } = await supabase
    .from("businesses")
    .select("id")
    .eq(
      "id",
      businessId,
    )
    .eq(
      "status",
      "ACTIVE",
    )
    .maybeSingle();

  if (
    businessError ||
    !business
  ) {
    return NextResponse.json(
      {
        error:
          "Business page is unavailable.",
      },
      {
        status: 404,
      },
    );
  }

  const {
    data: settings,
    error:
      settingsError,
  } = await supabase
    .from(
      "public_page_settings",
    )
    .select("published")
    .eq(
      "business_id",
      businessId,
    )
    .maybeSingle();

  if (
    settingsError ||
    !settings?.published
  ) {
    return NextResponse.json(
      {
        error:
          "Business page is unavailable.",
      },
      {
        status: 404,
      },
    );
  }

  const attribution =
    attributionFromLandingPath(
      landingPath,
      source,
    );

  let trackingLinkId =
    attribution.trackingLinkId;

  if (trackingLinkId) {
    const {
      data: trackingLink,
    } = await supabase
      .from(
        "tracking_links",
      )
      .select("id")
      .eq(
        "id",
        trackingLinkId,
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "active",
        true,
      )
      .maybeSingle();

    if (!trackingLink) {
      trackingLinkId =
        null;
    }
  }

  if (existingSessionId) {
    const {
      data:
        existingSession,
    } = await supabase
      .from(
        "visitor_sessions",
      )
      .select(
        `
          id,
          visit_count
        `,
      )
      .eq(
        "id",
        existingSessionId,
      )
      .eq(
        "business_id",
        businessId,
      )
      .maybeSingle();

    if (existingSession) {
      const {
        error:
          updateError,
      } = await supabase
        .from(
          "visitor_sessions",
        )
        .update({
          last_tracking_link_id:
            trackingLinkId,

          last_source:
            attribution.source,

          last_medium:
            attribution.medium,

          last_campaign:
            attribution.campaign,

          last_content:
            attribution.content,

          last_term:
            attribution.term,

          last_referrer:
            referrer ??
            null,

          last_landing_path:
            landingPath,

          visit_count:
            Number(
              existingSession.visit_count ??
                1,
            ) + 1,

          last_seen_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          existingSession.id,
        );

      if (updateError) {
        console.error(
          "LeadNexus visitor session update:",
          updateError,
        );
      }

      const {
        error:
          returnActivityError,
      } = await supabase
        .from(
          "activity_events",
        )
        .insert({
          business_id:
            businessId,

          visitor_session_id:
            existingSession.id,

          event_type:
            "RETURN_VISIT",
        });

      if (
        returnActivityError
      ) {
        console.error(
          "LeadNexus RETURN_VISIT event:",
          returnActivityError,
        );
      }

      return NextResponse.json({
        sessionId:
          existingSession.id,
      });
    }
  }

  const {
    data: session,
    error:
      sessionError,
  } = await supabase
    .from(
      "visitor_sessions",
    )
    .insert({
      business_id:
        businessId,

      anonymous_id:
        anonymousId,

      first_source:
        attribution.source,

      first_tracking_link_id:
        trackingLinkId,

      first_medium:
        attribution.medium,

      first_campaign:
        attribution.campaign,

      first_content:
        attribution.content,

      first_term:
        attribution.term,

      first_referrer:
        referrer ??
        null,

      last_tracking_link_id:
        trackingLinkId,

      last_source:
        attribution.source,

      last_medium:
        attribution.medium,

      last_campaign:
        attribution.campaign,

      last_content:
        attribution.content,

      last_term:
        attribution.term,

      last_referrer:
        referrer ??
        null,

      landing_path:
        landingPath,

      last_landing_path:
        landingPath,

      visit_count:
        1,

      last_seen_at:
        new Date()
          .toISOString(),
    })
    .select("id")
    .single();

  if (
    sessionError ||
    !session
  ) {
    console.error(
      "LeadNexus public session:",
      sessionError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to start visitor session.",
      },
      {
        status: 500,
      },
    );
  }

  const {
    error:
      activityError,
  } = await supabase
    .from(
      "activity_events",
    )
    .insert({
      business_id:
        businessId,

      visitor_session_id:
        session.id,

      event_type:
        "SESSION_STARTED",
    });

  if (activityError) {
    console.error(
      "LeadNexus SESSION_STARTED event:",
      activityError,
    );
  }

  return NextResponse.json(
    {
      sessionId:
        session.id,
    },
    {
      status: 201,
    },
  );
}