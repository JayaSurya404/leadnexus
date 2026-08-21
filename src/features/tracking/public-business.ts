import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  PublicBusinessPageData,
  PublicProduct,
  PublicSocialLink,
} from "@/types/public-business";

function mediaUrl(
  supabase:
    ReturnType<
      typeof createAdminClient
    >,
  path: string,
  version: string,
) {
  const publicUrl =
    supabase.storage
      .from(
        "business-media",
      )
      .getPublicUrl(
        path,
      ).data.publicUrl;

  if (!version) {
    return publicUrl;
  }

  return `${publicUrl}?v=${encodeURIComponent(
    version,
  )}`;
}

export async function getPublicBusinessPage(
  slug: string,
): Promise<
  PublicBusinessPageData | null
> {
  const supabase =
    createAdminClient();

  const {
    data: business,
    error:
      businessError,
  } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        slug,
        status,
        category,
        business_type,
        description,
        business_email,
        business_phone,
        whatsapp_number,
        website,
        city,
        state,
        country,
        service_area
        ,
        logo_url,
        cover_url
      `,
    )
    .eq(
      "slug",
      slug,
    )
    .eq(
      "status",
      "ACTIVE",
    )
    .maybeSingle();

  if (businessError) {
    throw new Error(
      `Unable to load public business: ${businessError.message}`,
    );
  }

  if (!business) {
    return null;
  }

  const [
    settingsResult,
    productResult,
    socialResult,
    hoursResult,
    logoResult,
    coverResult,
    productMediaResult,
  ] = await Promise.all([
    supabase
      .from(
        "public_page_settings",
      )
      .select(
        `
          headline,
          subheadline,
          about_text,
          primary_cta_text,
          published,
          show_products,
          show_business_hours,
          show_social_links,
          show_location,
          show_phone,
          show_email,
          show_whatsapp
        `,
      )
      .eq(
        "business_id",
        business.id,
      )
      .maybeSingle(),

    supabase
      .from("products")
      .select(
        `
          id,
          item_type,
          name,
          slug,
          description,
          price_text,
          featured,
          sort_order,
          created_at,
          image_url
        `,
      )
      .eq(
        "business_id",
        business.id,
      )
      .eq(
        "active",
        true,
      )
      .order(
        "featured",
        {
          ascending: false,
        },
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    supabase
      .from(
        "business_social_links",
      )
      .select(
        `
          platform,
          label,
          url,
          sort_order
        `,
      )
      .eq(
        "business_id",
        business.id,
      )
      .eq(
        "enabled",
        true,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      ),

    supabase
      .from(
        "business_hours",
      )
      .select(
        `
          day_of_week,
          is_closed,
          opens_at,
          closes_at
        `,
      )
      .eq(
        "business_id",
        business.id,
      )
      .order(
        "day_of_week",
        {
          ascending: true,
        },
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${business.id}/logo`,
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${business.id}/cover`,
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${business.id}/products`,
        {
          limit: 1000,
        },
      ),
  ]);

  if (
    settingsResult.error
  ) {
    throw new Error(
      `Unable to load public page settings: ${settingsResult.error.message}`,
    );
  }

  if (
    productResult.error
  ) {
    throw new Error(
      `Unable to load public products: ${productResult.error.message}`,
    );
  }

  if (
    socialResult.error
  ) {
    throw new Error(
      `Unable to load public social links: ${socialResult.error.message}`,
    );
  }

  if (
    hoursResult.error
  ) {
    throw new Error(
      `Unable to load public business hours: ${hoursResult.error.message}`,
    );
  }

  const settings =
    settingsResult.data;

  if (
    !settings ||
    !settings.published
  ) {
    return null;
  }

  const logoFile =
    logoResult.data?.find(
      (file) =>
        file.name ===
        "current",
    );

  const coverFile =
    coverResult.data?.find(
      (file) =>
        file.name ===
        "current",
    );

  const logoUrl =
    logoFile
      ? mediaUrl(
          supabase,
          `${business.id}/logo/current`,
          logoFile.updated_at ??
            logoFile.created_at ??
            "",
        )
      : business.logo_url;

  const coverUrl =
    coverFile
      ? mediaUrl(
          supabase,
          `${business.id}/cover/current`,
          coverFile.updated_at ??
            coverFile.created_at ??
            "",
        )
      : business.cover_url;

  const productMediaMap =
    new Map(
      (
        productMediaResult.data ??
        []
      ).map(
        (file) => [
          file.name,
          file,
        ],
      ),
    );

  const products:
    PublicProduct[] =
      (
        productResult.data ??
        []
      ).map(
        (product) => {
          const media =
            productMediaMap.get(
              product.id,
            );

          const imageUrl =
            media
              ? mediaUrl(
                  supabase,
                  `${business.id}/products/${product.id}`,
                  media.updated_at ??
                    media.created_at ??
                    "",
                )
              : product.image_url;

          return {
            id:
              product.id,

            itemType:
              product.item_type as
                | "PRODUCT"
                | "SERVICE",

            name:
              product.name,

            slug:
              product.slug,

            description:
              product.description,

            priceText:
              product.price_text,

            featured:
              product.featured,

            imageUrl,
          };
        },
      );

  const socials:
    PublicSocialLink[] =
      (
        socialResult.data ??
        []
      ).map(
        (social) => ({
          platform:
            social.platform as
              PublicSocialLink["platform"],

          label:
            social.label ??
            social.platform,

          url:
            social.url,
        }),
      );

  return {
    business: {
      id:
        business.id,

      name:
        business.name,

      slug:
        business.slug,

      category:
        business.category,

      businessType:
        business.business_type,

      description:
        business.description,

      city:
        business.city,

      state:
        business.state,

      country:
        business.country,

      serviceArea:
        business.service_area,

      logoUrl,

      coverUrl,

      businessPhone:
        business.business_phone,

      businessEmail:
        business.business_email,

      whatsappNumber:
        business.whatsapp_number,

      website:
        business.website,
    },

    settings: {
      headline:
        settings.headline,

      subheadline:
        settings.subheadline,

      about:
        settings.about_text,

      primaryCtaText:
        settings.primary_cta_text ??
        "Get in touch",

      showProducts:
        settings.show_products,

      showBusinessHours:
        settings.show_business_hours,

      showSocialLinks:
        settings.show_social_links,

      showLocation:
        settings.show_location,

      showPhone:
        settings.show_phone,

      showEmail:
        settings.show_email,

      showWhatsapp:
        settings.show_whatsapp,
    },

    products,

    socials,

    hours:
      (
        hoursResult.data ??
        []
      ).map(
        (hour) => ({
          dayOfWeek:
            hour.day_of_week,

          isClosed:
            hour.is_closed,

          opensAt:
            hour.opens_at,

          closesAt:
            hour.closes_at,
        }),
      ),

    contactAvailability: {
      whatsapp:
        Boolean(
          business.whatsapp_number,
        ),

      email:
        Boolean(
          business.business_email,
        ),

      phone:
        Boolean(
          business.business_phone,
        ),

      website:
        Boolean(
          business.website,
        ),
    },
  };
}
