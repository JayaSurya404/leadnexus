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
  publicPageSchema,
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

function checked(
  formData: FormData,
  name: string,
) {
  return (
    formData.get(name) ===
    "on"
  );
}

function nullable(
  value: string,
) {
  const result =
    value.trim();

  return result
    ? result
    : null;
}

export async function updatePublicPageAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    publicPageSchema.safeParse(
      {
        headline: text(
          formData,
          "headline",
        ),

        subheadline: text(
          formData,
          "subheadline",
        ),

        about: text(
          formData,
          "about",
        ),

        primaryCtaText:
          text(
            formData,
            "primaryCtaText",
          ),

        published:
          checked(
            formData,
            "published",
          ),

        showProducts:
          checked(
            formData,
            "showProducts",
          ),

        showBusinessHours:
          checked(
            formData,
            "showBusinessHours",
          ),

        showSocialLinks:
          checked(
            formData,
            "showSocialLinks",
          ),

        showLocation:
          checked(
            formData,
            "showLocation",
          ),

        showPhone:
          checked(
            formData,
            "showPhone",
          ),

        showEmail:
          checked(
            formData,
            "showEmail",
          ),

        showWhatsapp:
          checked(
            formData,
            "showWhatsapp",
          ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Invalid public page settings.",
    );
  }

  const value =
    parsed.data;

  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        "public_page_settings",
      )
      .update({
        headline:
          nullable(
            value.headline,
          ),

        subheadline:
          nullable(
            value.subheadline,
          ),

        about_text:
          nullable(
            value.about,
          ),

        primary_cta_text:
          value.primaryCtaText,

        published:
          value.published,

        show_products:
          value.showProducts,

        show_business_hours:
          value.showBusinessHours,

        show_social_links:
          value.showSocialLinks,

        show_location:
          value.showLocation,

        show_phone:
          value.showPhone,

        show_email:
          value.showEmail,

        show_whatsapp:
          value.showWhatsapp,
      })
      .eq(
        "business_id",
        context.business.id,
      );

  if (error) {
    throw new Error(
      `Unable to update public page: ${error.message}`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}