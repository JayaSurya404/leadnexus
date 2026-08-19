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

function slugify(
  value: string,
) {
  const base =
    value
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        80,
      );

  return base ||
    "item";
}

export async function createProductAction(
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

        sortOrder: 0,
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

  const slug =
    `${slugify(value.name)}-${crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 6)}`;

  const supabase =
    await createClient();

  // Auto-assign sort_order to position new product at end
  const {
    data: maxRow,
  } = await supabase
    .from("products")
    .select("sort_order")
    .eq(
      "business_id",
      context.business.id,
    )
    .order(
      "sort_order",
      { ascending: false },
    )
    .limit(1)
    .maybeSingle();

  const nextSortOrder =
    (maxRow?.sort_order ?? -1) + 1;

  const { error } =
    await supabase
      .from("products")
      .insert({
        business_id:
          context.business.id,

        item_type:
          value.itemType,

        name:
          value.name,

        slug,

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
          nextSortOrder,
      });

  if (error) {
    throw new Error(
      `Unable to create product: ${error.message}`,
    );
  }

  revalidatePath(
    "/products",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}