"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  z,
} from "zod";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

const seoSchema =
  z.object({
    title: z
      .string()
      .trim()
      .max(
        70,
        "SEO title must be 70 characters or less.",
      ),

    description: z
      .string()
      .trim()
      .max(
        180,
        "Description must be 180 characters or less.",
      ),

    keywords: z
      .string()
      .trim()
      .max(500),

    canonicalUrl: z
      .string()
      .trim()
      .refine(
        (value) => {
          if (
            value === ""
          ) {
            return true;
          }

          try {
            new URL(
              value,
            );

            return true;
          } catch {
            return false;
          }
        },
        "Enter a valid canonical URL.",
      ),

    ogTitle: z
      .string()
      .trim()
      .max(70),

    ogDescription: z
      .string()
      .trim()
      .max(180),

    indexable:
      z.boolean(),
  });

function nullable(
  value: string,
) {
  const result =
    value.trim();

  return result
    ? result
    : null;
}

export async function updateSeoSettingsAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    seoSchema.safeParse({
      title:
        formData.get(
          "title",
        ) ?? "",

      description:
        formData.get(
          "description",
        ) ?? "",

      keywords:
        formData.get(
          "keywords",
        ) ?? "",

      canonicalUrl:
        formData.get(
          "canonicalUrl",
        ) ?? "",

      ogTitle:
        formData.get(
          "ogTitle",
        ) ?? "",

      ogDescription:
        formData.get(
          "ogDescription",
        ) ?? "",

      indexable:
        formData.get(
          "indexable",
        ) === "on",
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error
        .issues[0]
        ?.message ??
        "Invalid SEO settings.",
    );
  }

  const values =
    parsed.data;

  const keywords =
    values.keywords
      .split(",")
      .map(
        (keyword) =>
          keyword.trim(),
      )
      .filter(Boolean)
      .slice(
        0,
        20,
      );

  const supabase =
    createAdminClient();

  const {
    data: existing,
    error:
      existingError,
  } = await supabase
    .from(
      "seo_settings",
    )
    .select("business_id")
    .eq(
      "business_id",
      context.business.id,
    )
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Unable to inspect SEO settings: ${existingError.message}`,
    );
  }

  const payload = {
    title:
      nullable(
        values.title,
      ),

    description:
      nullable(
        values.description,
      ),

    keywords,

    canonical_url:
      nullable(
        values.canonicalUrl,
      ),

    og_title:
      nullable(
        values.ogTitle,
      ),

    og_description:
      nullable(
        values.ogDescription,
      ),

    indexable:
      values.indexable,

    updated_at:
      new Date()
        .toISOString(),
  };

  if (existing) {
    const {
      error,
    } = await supabase
      .from(
        "seo_settings",
      )
      .update(
        payload,
      )
      .eq(
        "business_id",
        context.business.id,
      );

    if (error) {
      throw new Error(
        `Unable to update SEO settings: ${error.message}`,
      );
    }
  } else {
    const {
      error,
    } = await supabase
      .from(
        "seo_settings",
      )
      .insert({
        business_id:
          context.business.id,

        ...payload,
      });

    if (error) {
      throw new Error(
        `Unable to create SEO settings: ${error.message}`,
      );
    }
  }

  revalidatePath(
    "/seo",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );

  revalidatePath(
    "/sitemap.xml",
  );
}