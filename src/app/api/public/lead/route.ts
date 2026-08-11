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

  const {
    data: lead,
    error:
      leadError,
  } = await supabase
    .from("leads")
    .insert({
      business_id:
        businessId,

      visitor_session_id:
        sessionId,

      primary_product_id:
        productId ??
        null,

      name:
        name.trim(),

      phone:
        phone.trim(),

      email:
        nullable(email),
    })
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
      status: 201,
    },
  );
}