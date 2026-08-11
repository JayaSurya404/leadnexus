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

export async function deleteProductAction(
  productId: string,
) {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

  const {
    data: product,
    error:
      lookupError,
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
    lookupError ||
    !product
  ) {
    throw new Error(
      "Product does not belong to this business.",
    );
  }

  const imagePath =
    `${context.business.id}/products/${productId}`;

  const {
    error:
      storageError,
  } = await supabase.storage
    .from(
      "business-media",
    )
    .remove([
      imagePath,
    ]);

  if (storageError) {
    console.error(
      "Product image cleanup:",
      storageError.message,
    );
  }

  const { error } =
    await supabase
      .from("products")
      .delete()
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
      `Unable to delete product: ${error.message}`,
    );
  }

  revalidatePath(
    "/products",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}