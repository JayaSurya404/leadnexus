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
  socialLinksSchema,
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

export async function updateSocialLinksAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    socialLinksSchema.safeParse(
      {
        instagramUrl: text(
          formData,
          "instagramUrl",
        ),

        facebookUrl: text(
          formData,
          "facebookUrl",
        ),

        linkedinUrl: text(
          formData,
          "linkedinUrl",
        ),

        youtubeUrl: text(
          formData,
          "youtubeUrl",
        ),

        telegramUrl: text(
          formData,
          "telegramUrl",
        ),

        xUrl: text(
          formData,
          "xUrl",
        ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Invalid social link.",
    );
  }

  const supabase =
    await createClient();

  const { error:
    deleteError } =
    await supabase
      .from(
        "business_social_links",
      )
      .delete()
      .eq(
        "business_id",
        context.business.id,
      )
      .in(
        "platform",
        [
          "INSTAGRAM",
          "FACEBOOK",
          "LINKEDIN",
          "YOUTUBE",
          "TELEGRAM",
          "X",
        ],
      );

  if (deleteError) {
    throw new Error(
      `Unable to update social links: ${deleteError.message}`,
    );
  }

  const values =
    parsed.data;

  const rows = [
    {
      platform:
        "INSTAGRAM",
      label:
        "Instagram",
      url:
        values.instagramUrl,
    },

    {
      platform:
        "FACEBOOK",
      label:
        "Facebook",
      url:
        values.facebookUrl,
    },

    {
      platform:
        "LINKEDIN",
      label:
        "LinkedIn",
      url:
        values.linkedinUrl,
    },

    {
      platform:
        "YOUTUBE",
      label:
        "YouTube",
      url:
        values.youtubeUrl,
    },

    {
      platform:
        "TELEGRAM",
      label:
        "Telegram",
      url:
        values.telegramUrl,
    },

    {
      platform:
        "X",
      label:
        "X",
      url:
        values.xUrl,
    },
  ] as const;

  const inserts =
    rows
      .filter(
        (row) =>
          row.url.trim()
            .length > 0,
      )
      .map(
        (
          row,
          index,
        ) => ({
          business_id:
            context.business.id,

          platform:
            row.platform,

          label:
            row.label,

          url:
            row.url.trim(),

          sort_order:
            index,

          enabled:
            true,
        }),
      );

  if (
    inserts.length > 0
  ) {
    const {
      error:
        insertError,
    } = await supabase
      .from(
        "business_social_links",
      )
      .insert(inserts);

    if (insertError) {
      throw new Error(
        `Unable to save social links: ${insertError.message}`,
      );
    }
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}