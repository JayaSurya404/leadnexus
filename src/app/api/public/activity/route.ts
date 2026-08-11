import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  publicActivitySchema,
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
    publicActivitySchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid activity event.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    businessId,
    sessionId,
    leadId,
    productId,
    eventType,
  } = parsed.data;

  const supabase =
    createAdminClient();

  const {
    data: session,
    error:
      sessionError,
  } = await supabase
    .from(
      "visitor_sessions",
    )
    .select("id")
    .eq(
      "id",
      sessionId,
    )
    .eq(
      "business_id",
      businessId,
    )
    .maybeSingle();

  if (
    sessionError ||
    !session
  ) {
    return NextResponse.json(
      {
        error:
          "Visitor session is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  if (productId) {
    const {
      data: product,
    } = await supabase
      .from("products")
      .select("id")
      .eq(
        "id",
        productId,
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

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product is invalid.",
        },
        {
          status: 400,
        },
      );
    }
  }

  if (leadId) {
    const {
      data: lead,
    } = await supabase
      .from("leads")
      .select("id")
      .eq(
        "id",
        leadId,
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visitor_session_id",
        sessionId,
      )
      .maybeSingle();

    if (!lead) {
      return NextResponse.json(
        {
          error:
            "Lead is invalid.",
        },
        {
          status: 400,
        },
      );
    }
  }

  const {
    error:
      eventError,
  } = await supabase
    .from(
      "activity_events",
    )
    .insert({
      business_id:
        businessId,

      visitor_session_id:
        sessionId,

      lead_id:
        leadId ??
        null,

      product_id:
        productId ??
        null,

      event_type:
        eventType,
    });

  if (eventError) {
    console.error(
      "LeadNexus activity event:",
      eventError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to record activity.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    success: true,
  });
}