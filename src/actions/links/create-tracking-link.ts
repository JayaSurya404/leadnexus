"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  trackingLinkSchema,
} from "@/lib/validation/tracking-link";

function nullable(
  value: string,
) {
  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

async function generateCode() {
  const supabase =
    createAdminClient();

  for (
    let attempt = 0;
    attempt < 8;
    attempt += 1
  ) {
    const code =
      crypto
        .randomUUID()
        .replaceAll(
          "-",
          "",
        )
        .slice(
          0,
          8,
        );

    const {
      data,
    } = await supabase
      .from(
        "tracking_links",
      )
      .select("id")
      .eq(
        "code",
        code,
      )
      .limit(1)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  throw new Error(
    "Unable to generate tracking link code.",
  );
}

export async function createTrackingLinkAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    trackingLinkSchema.safeParse(
      {
        name:
          formData.get(
            "name",
          ) ?? "",

        source:
          formData.get(
            "source",
          ) ?? "",

        medium:
          formData.get(
            "medium",
          ) ?? "",

        campaign:
          formData.get(
            "campaign",
          ) ?? "",

        content:
          formData.get(
            "content",
          ) ?? "",

        term:
          formData.get(
            "term",
          ) ?? "",

        productId:
          formData.get(
            "productId",
          ) ?? "",
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error
        .issues[0]
        ?.message ??
        "Invalid tracking link.",
    );
  }

  const {
    name,
    source,
    medium,
    campaign,
    content,
    term,
    productId,
  } = parsed.data;

  const supabase =
    createAdminClient();

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
        context.business.id,
      )
      .maybeSingle();

    if (
      productError ||
      !product
    ) {
      throw new Error(
        "Selected product is invalid.",
      );
    }
  }

  const code =
    await generateCode();

  const {
    error,
  } = await supabase
    .from(
      "tracking_links",
    )
    .insert({
      business_id:
        context.business.id,

      name,

      code,

      source,

      medium:
        nullable(
          medium,
        ),

      campaign:
        nullable(
          campaign,
        ),

      content:
        nullable(
          content,
        ),

      term:
        nullable(
          term,
        ),

      product_id:
        productId,

      destination_path:
        `/b/${context.business.slug}`,

      active:
        true,
    });

  if (error) {
    throw new Error(
      `Unable to create tracking link: ${error.message}`,
    );
  }

  revalidatePath(
    "/links",
  );
}