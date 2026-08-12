import type {
  MetadataRoute,
} from "next";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const supabase =
    createAdminClient();

  const {
    data: businesses,
    error:
      businessError,
  } = await supabase
    .from("businesses")
    .select(
      "id, slug",
    )
    .eq(
      "status",
      "ACTIVE",
    );

  if (businessError) {
    console.error(
      "LeadNexus sitemap businesses:",
      businessError,
    );

    return [
      {
        url:
          appUrl,

        changeFrequency:
          "weekly",

        priority: 1,
      },
    ];
  }

  const rows =
    businesses ?? [];

  if (
    rows.length === 0
  ) {
    return [
      {
        url:
          appUrl,

        changeFrequency:
          "weekly",

        priority: 1,
      },
    ];
  }

  const businessIds =
    rows.map(
      (business) =>
        business.id,
    );

  const [
    publicResult,
    seoResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "public_page_settings",
        )
        .select(
          "business_id, published",
        )
        .in(
          "business_id",
          businessIds,
        ),

      supabase
        .from(
          "seo_settings",
        )
        .select(
          `
            business_id,
            canonical_url,
            indexable,
            updated_at
          `,
        )
        .in(
          "business_id",
          businessIds,
        )
        .order(
          "updated_at",
          {
            ascending: false,
          },
        ),
    ]);

  const publishedMap =
    new Map<
      string,
      boolean
    >();

  for (
    const setting of
      publicResult.data ??
      []
  ) {
    publishedMap.set(
      setting.business_id,
      setting.published,
    );
  }

  const seoMap =
    new Map<
      string,
      {
        canonicalUrl:
          | string
          | null;

        indexable:
          boolean;

        updatedAt:
          string | null;
      }
    >();

  for (
    const setting of
      seoResult.data ??
      []
  ) {
    if (
      seoMap.has(
        setting.business_id,
      )
    ) {
      continue;
    }

    seoMap.set(
      setting.business_id,
      {
        canonicalUrl:
          setting.canonical_url,

        indexable:
          setting.indexable,

        updatedAt:
          setting.updated_at,
      },
    );
  }

  const publicPages:
    MetadataRoute.Sitemap =
      rows
        .filter(
          (business) => {
            if (
              !publishedMap.get(
                business.id,
              )
            ) {
              return false;
            }

            const seo =
              seoMap.get(
                business.id,
              );

            return (
              seo?.indexable ??
              true
            );
          },
        )
        .map(
          (business) => {
            const seo =
              seoMap.get(
                business.id,
              );

            return {
              url:
                seo?.canonicalUrl ||
                `${appUrl}/b/${business.slug}`,

              lastModified:
                seo?.updatedAt
                  ? new Date(
                      seo.updatedAt,
                    )
                  : undefined,

              changeFrequency:
                "weekly" as const,

              priority:
                0.8,
            };
          },
        );

  return [
    {
      url:
        appUrl,

      changeFrequency:
        "weekly",

      priority:
        1,
    },

    ...publicPages,
  ];
}