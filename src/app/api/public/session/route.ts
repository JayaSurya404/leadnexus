import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  publicSessionSchema,
} from "@/lib/validation/public";

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
    anonymousId,
    source,
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
        source ??
        "Direct",

      landing_path:
        landingPath,
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