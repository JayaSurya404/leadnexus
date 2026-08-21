import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  publicLeadSchema,
} from "@/lib/validation/public";

function nullable(
  value: string,
) {
  const result =
    value.trim();

  return result
    ? result
    : null;
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
    publicLeadSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    const issue =
      parsed.error.issues[0];

    return NextResponse.json(
      {
        error:
          issue?.message ??
          "Invalid lead information.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    businessId,
    sessionId,
    productId,
    name,
    phone,
    email,
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
    .select("id, lead_id")
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
      error:
        productError,
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

    if (
      productError ||
      !product
    ) {
      return NextResponse.json(
        {
          error:
            "Selected product is invalid.",
        },
        {
          status: 400,
        },
      );
    }
  }

  const leadValues = {
    primary_product_id:
      productId ??
      null,

    name:
      name.trim(),

    phone:
      phone.trim(),

    email:
      nullable(email),
  };

  const leadMutation =
    session.lead_id
      ? supabase
          .from("leads")
          .update(leadValues)
          .eq(
            "id",
            session.lead_id,
          )
          .eq(
            "business_id",
            businessId,
          )
      : supabase
          .from("leads")
          .insert({
            ...leadValues,

            business_id:
              businessId,

            visitor_session_id:
              sessionId,
          });

  const {
    data: lead,
    error:
      leadError,
  } = await leadMutation
    .select("id")
    .single();

  if (
    leadError ||
    !lead
  ) {
    console.error(
      "LeadNexus public lead:",
      leadError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save your enquiry.",
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
    .from("activity_events")
    .insert({
      business_id:
        businessId,

      session_id:
        sessionId,

      lead_id:
        lead.id,

      product_id:
        productId ??
        null,

      event_type:
        "LEAD_FORM_SUBMITTED",
    });

  if (activityError) {
    console.error(
      "LeadNexus lead submission activity:",
      activityError,
    );
  }

  /*
   * Lead defaults and visibility are
   * intentionally controlled by the
   * deployed database triggers.
   *
   * Initial lead:
   * ADMIN_ONLY
   *
   * Direct contact event later:
   * OWNER_VISIBLE
   */

  return NextResponse.json(
    {
      leadId:
        lead.id,
    },
    {
      status:
        session.lead_id
          ? 200
          : 201,
    },
  );
}
