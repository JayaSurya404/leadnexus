"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  contactTemplatesSchema,
} from "@/lib/validation/business";

function text(
  formData: FormData,
  name: string,
) {
  const value =
    formData.get(name);

  return typeof value ===
    "string"
    ? value
    : "";
}

export async function updateContactTemplatesAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    contactTemplatesSchema.safeParse(
      {
        whatsappMessage:
          text(
            formData,
            "whatsappMessage",
          ),

        emailMessage:
          text(
            formData,
            "emailMessage",
          ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Invalid contact template.",
    );
  }

  const supabase =
    await createClient();

  const {
    error:
      deleteError,
  } = await supabase
    .from(
      "contact_templates",
    )
    .delete()
    .eq(
      "business_id",
      context.business.id,
    )
    .is(
      "product_id",
      null,
    )
    .in(
      "channel",
      [
        "WHATSAPP",
        "EMAIL",
      ],
    );

  if (deleteError) {
    throw new Error(
      `Unable to update contact templates: ${deleteError.message}`,
    );
  }

  const rows = [
    {
      business_id:
        context.business.id,

      product_id:
        null,

      channel:
        "WHATSAPP",

      title:
        "WhatsApp enquiry",

      message_template:
        parsed.data
          .whatsappMessage,

      active:
        true,
    },
  ];

  if (
    parsed.data.emailMessage
      .trim()
  ) {
    rows.push({
      business_id:
        context.business.id,

      product_id:
        null,

      channel:
        "EMAIL",

      title:
        "Email enquiry",

      message_template:
        parsed.data
          .emailMessage,

      active:
        true,
    });
  }

  const {
    error:
      insertError,
  } = await supabase
    .from(
      "contact_templates",
    )
    .insert(rows);

  if (insertError) {
    throw new Error(
      `Unable to save contact templates: ${insertError.message}`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}