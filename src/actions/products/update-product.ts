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
  productSchema,
} from "@/lib/validation/product";

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

function nullable(
  value: string,
) {
  const result =
    value.trim();

  return result
    ? result
    : null;
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    productSchema.safeParse(
      {
        itemType:
          text(
            formData,
            "itemType",
          ),

        name:
          text(
            formData,
            "name",
          ),

        description:
          text(
            formData,
            "description",
          ),

        priceText:
          text(
            formData,
            "priceText",
          ),

        active:
          formData.get(
            "active",
          ) === "on",

        featured:
          formData.get(
            "featured",
          ) === "on",

        sortOrder:
          Number(
            text(
              formData,
              "sortOrder",
            ) || 0,
          ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Invalid product information.",
    );
  }

  const value =
    parsed.data;

  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("products")
      .update({
        item_type:
          value.itemType,

        name:
          value.name,

        description:
          nullable(
            value.description,
          ),

        price_text:
          nullable(
            value.priceText,
          ),

        active:
          value.active,

        featured:
          value.featured,

        sort_order:
          value.sortOrder,
      })
      .eq(
        "id",
        productId,
      )
      .eq(
        "business_id",
        context.business.id,
      );

  if (error) {
    throw new Error(
      `Unable to update product: ${error.message}`,
    );
  }

  revalidatePath(
    "/products",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}

export async function finalizeProductImageAction(
  productId: string,
) {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

  const {
    data: product,
    error,
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
    error ||
    !product
  ) {
    throw new Error(
      "Product does not belong to this business.",
    );
  }

  revalidatePath(
    "/products",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}

export async function removeProductImageAction(
  productId: string,
) {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

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
      "Product does not belong to this business.",
    );
  }

  const path =
    `${context.business.id}/products/${productId}`;

  const {
    error:
      storageError,
  } = await supabase.storage
    .from(
      "business-media",
    )
    .remove([
      path,
    ]);

  if (storageError) {
    throw new Error(
      `Unable to remove product image: ${storageError.message}`,
    );
  }

  revalidatePath(
    "/products",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}