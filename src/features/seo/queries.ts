import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  SeoSettings,
} from "@/types/seo";

function mapSeo(
  row:
    | Record<
        string,
        unknown
      >
    | null,
): SeoSettings {
  const keywords =
    row?.keywords;

  return {
    title:
      typeof row?.title ===
      "string"
        ? row.title
        : null,

    description:
      typeof row?.description ===
      "string"
        ? row.description
        : null,

    keywords:
      Array.isArray(
        keywords,
      )
        ? keywords.filter(
            (
              keyword,
            ): keyword is string =>
              typeof keyword ===
              "string",
          )
        : [],

    canonicalUrl:
      typeof row
        ?.canonical_url ===
      "string"
        ? row.canonical_url
        : null,

    ogTitle:
      typeof row
        ?.og_title ===
      "string"
        ? row.og_title
        : null,

    ogDescription:
      typeof row
        ?.og_description ===
      "string"
        ? row.og_description
        : null,

    indexable:
      typeof row
        ?.indexable ===
      "boolean"
        ? row.indexable
        : true,
  };
}

export async function getSeoSettings(
  businessId: string,
): Promise<SeoSettings> {
  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      "seo_settings",
    )
    .select("*")
    .eq(
      "business_id",
      businessId,
    )
    .order(
      "updated_at",
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load SEO settings: ${error.message}`,
    );
  }

  return mapSeo(
    data as
      | Record<
          string,
          unknown
        >
      | null,
  );
}

export async function getPublicSeoSettings(
  businessId: string,
) {
  return getSeoSettings(
    businessId,
  );
}