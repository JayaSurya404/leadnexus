import {
  NextResponse,
} from "next/server";

import {
  buildEmailUrl,
  buildPhoneUrl,
  buildWhatsappUrl,
  resolveContactMessage,
} from "@/features/contact/message-template";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  publicContactSchema,
} from "@/lib/validation/public";

import type {
  PublicContactChannel,
} from "@/types/public-business";

const eventByChannel:
  Record<
    PublicContactChannel,
    | "WHATSAPP_CLICK"
    | "EMAIL_CLICK"
    | "PHONE_CLICK"
    | "WEBSITE_CLICK"
    | "INSTAGRAM_CLICK"
    | "FACEBOOK_CLICK"
    | "LINKEDIN_CLICK"
  > = {
  WHATSAPP:
    "WHATSAPP_CLICK",

  EMAIL:
    "EMAIL_CLICK",

  PHONE:
    "PHONE_CLICK",

  WEBSITE:
    "WEBSITE_CLICK",

  INSTAGRAM:
    "INSTAGRAM_CLICK",

  FACEBOOK:
    "FACEBOOK_CLICK",

  LINKEDIN:
    "LINKEDIN_CLICK",
};

async function contactMessage({
  supabase,
  businessId,
  channel,
  businessName,
  productId,
  productName,
}: {
  supabase:
    ReturnType<
      typeof createAdminClient
    >;

  businessId: string;

  channel:
    | "WHATSAPP"
    | "EMAIL";

  businessName: string;

  productId:
    | string
    | null
    | undefined;

  productName:
    | string
    | null;
}) {
  let productTemplate:
    | string
    | null = null;

  if (productId) {
    const {
      data,
    } = await supabase
      .from("contact_templates")
      .select("message_template")
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "channel",
        channel,
      )
      .eq(
        "product_id",
        productId,
      )
      .eq(
        "active",
        true,
      )
      .limit(1)
      .maybeSingle();

    productTemplate =
      data?.message_template ??
      null;
  }

  const {
    data: businessTemplate,
  } = await supabase
    .from("contact_templates")
    .select("message_template")
    .eq(
      "business_id",
      businessId,
    )
    .eq(
      "channel",
      channel,
    )
    .is(
      "product_id",
      null,
    )
    .eq(
      "active",
      true,
    )
    .limit(1)
    .maybeSingle();

  return resolveContactMessage({
    productTemplate,
    businessTemplate:
      businessTemplate
        ?.message_template ??
      null,
    businessName,
    productName,
  });
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
    publicContactSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid contact request.",
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
    channel,
  } = parsed.data;

  const supabase =
    createAdminClient();

  const [
    businessResult,
    sessionResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        `
          id,
          name,
          business_email,
          business_phone,
          whatsapp_number,
          website
        `,
      )
      .eq(
        "id",
        businessId,
      )
      .eq(
        "status",
        "ACTIVE",
      )
      .maybeSingle(),

    supabase
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
      .maybeSingle(),

  ]);

  const business =
    businessResult.data;

  if (
    businessResult.error ||
    !business ||
    sessionResult.error ||
    !sessionResult.data
  ) {
    return NextResponse.json(
      {
        error:
          "Contact request could not be verified.",
      },
      {
        status: 400,
      },
    );
  }

  if (leadId) {
    const {
      data: lead,
      error: leadError,
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

    if (
      leadError ||
      !lead
    ) {
      return NextResponse.json(
        {
          error:
            "Captured enquiry could not be verified.",
        },
        {
          status: 400,
        },
      );
    }
  }

  let productName:
    | string
    | null = null;

  if (productId) {
    const {
      data: product,
      error:
        productError,
    } = await supabase
      .from("products")
      .select(
        "id, name",
      )
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

    productName =
      product.name;
  }

  let destination:
    | string
    | null = null;

  if (
    channel ===
    "WHATSAPP"
  ) {
    const phone =
      business.whatsapp_number ??
      business.business_phone;

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "WhatsApp is not available.",
        },
        {
          status: 404,
        },
      );
    }

    const message =
      await contactMessage({
        supabase,
        businessId,
        channel:
          "WHATSAPP",
        businessName:
          business.name,
        productId,
        productName,
      });

    destination =
      buildWhatsappUrl(
        phone,
        message,
      );
  }

  if (
    channel ===
    "EMAIL"
  ) {
    if (
      !business.business_email
    ) {
      return NextResponse.json(
        {
          error:
            "Email contact is not available.",
        },
        {
          status: 404,
        },
      );
    }

    const message =
      await contactMessage({
        supabase,
        businessId,
        channel:
          "EMAIL",
        businessName:
          business.name,
        productId,
        productName,
      });

    destination =
      buildEmailUrl({
        email:
          business.business_email,

        subject:
          productName
            ? `Enquiry about ${productName}`
            : `General enquiry for ${business.name}`,

        message,
      });
  }

  if (
    channel ===
    "PHONE"
  ) {
    if (
      !business.business_phone
    ) {
      return NextResponse.json(
        {
          error:
            "Phone contact is not available.",
        },
        {
          status: 404,
        },
      );
    }

    destination =
      buildPhoneUrl(
        business.business_phone,
      );
  }

  if (
    channel ===
    "WEBSITE"
  ) {
    destination =
      business.website;
  }

  if (
    channel ===
      "INSTAGRAM" ||
    channel ===
      "FACEBOOK" ||
    channel ===
      "LINKEDIN"
  ) {
    const {
      data: social,
    } = await supabase
      .from(
        "business_social_links",
      )
      .select("url")
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "platform",
        channel,
      )
      .eq(
        "enabled",
        true,
      )
      .limit(1)
      .maybeSingle();

    destination =
      social?.url ??
      null;
  }

  if (!destination) {
    return NextResponse.json(
      {
        error:
          "This contact option is unavailable.",
      },
      {
        status: 404,
      },
    );
  }

  /*
   * IMPORTANT:
   *
   * The database trigger attached to
   * activity_events is responsible for
   * changing a lead from ADMIN_ONLY to
   * OWNER_VISIBLE when a direct-contact
   * event occurs.
   */

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

      session_id:
        sessionId,

      lead_id:
        leadId ??
        null,

      product_id:
        productId ??
        null,

      event_type:
        eventByChannel[
          channel
        ],
    });

  if (activityError) {
    console.error(
      "LeadNexus contact activity:",
      activityError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to record contact intent.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    url:
      destination,
  });
}
