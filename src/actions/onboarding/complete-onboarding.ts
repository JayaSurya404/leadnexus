"use server";

import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/onboarding";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type CompleteOnboardingResult = {
  success: boolean;
  message: string;
};

function nullable(
  value: string,
) {
  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function slugify(
  value: string,
) {
  const slug = value
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
    );

  if (slug.length < 2) {
    return "business";
  }

  return slug;
}

function productSlugs(
  products:
    OnboardingInput["products"],
) {
  const used =
    new Map<string, number>();

  return products.map(
    (product) => {
      const base =
        slugify(
          product.name,
        ).slice(0, 108);

      const count =
        used.get(base) ?? 0;

      used.set(
        base,
        count + 1,
      );

      if (count === 0) {
        return base;
      }

      return `${base}-${count + 1}`;
    },
  );
}

function businessSlugCandidate(
  businessName: string,
  attempt: number,
) {
  const base =
    slugify(
      businessName,
    ).slice(0, 90);

  if (attempt === 0) {
    return base;
  }

  const suffix =
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 6);

  return `${base}-${suffix}`;
}

export async function completeOnboardingAction(
  input: OnboardingInput,
): Promise<CompleteOnboardingResult> {
  const parsed =
    onboardingSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        "Some onboarding information is incomplete or invalid. Please review the form.",
    };
  }

  const values =
    parsed.data;

  const user =
    await requireUser();

  const supabase =
    await createClient();

  try {
    /*
     * Update the authenticated owner's
     * normal profile information.
     */

    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .update({
        full_name:
          values.ownerFullName,

        phone:
          values.ownerPhone,
      })
      .eq(
        "id",
        user.id,
      );

    if (profileError) {
      throw new Error(
        `Profile update failed: ${profileError.message}`,
      );
    }

    /*
     * Check whether onboarding was
     * partially started previously.
     *
     * This makes retrying onboarding
     * safe without creating another
     * business.
     */

    const {
      data: membership,
      error:
        membershipError,
    } = await supabase
      .from(
        "business_members",
      )
      .select(
        "business_id, role",
      )
      .eq(
        "user_id",
        user.id,
      )
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new Error(
        `Membership lookup failed: ${membershipError.message}`,
      );
    }

    let businessId:
      | string
      | null = null;

    let existingSlug:
      | string
      | null = null;

    if (membership) {
      if (
        membership.role !==
        "OWNER"
      ) {
        return {
          success: false,
          message:
            "Only the business owner can complete business onboarding.",
        };
      }

      const {
        data:
          existingBusiness,
        error:
          existingBusinessError,
      } = await supabase
        .from("businesses")
        .select(
          "id, slug, onboarding_completed_at",
        )
        .eq(
          "id",
          membership.business_id,
        )
        .maybeSingle();

      if (
        existingBusinessError
      ) {
        throw new Error(
          `Business lookup failed: ${existingBusinessError.message}`,
        );
      }

      if (existingBusiness) {
        if (
          existingBusiness
            .onboarding_completed_at
        ) {
          return {
            success: true,
            message:
              "Business onboarding is already complete.",
          };
        }

        businessId =
          existingBusiness.id;

        existingSlug =
          existingBusiness.slug;
      }
    }

    /*
     * Create the business on the first
     * onboarding attempt.
     *
     * The database trigger automatically
     * creates:
     *
     * - OWNER membership
     * - public page settings
     * - lead form settings
     * - SEO settings
     * - 7 business-hour rows
     */

    if (!businessId) {
      let lastInsertError:
        | string
        | null = null;

      for (
        let attempt = 0;
        attempt < 5;
        attempt += 1
      ) {
        const slug =
          businessSlugCandidate(
            values.businessName,
            attempt,
          );

        const {
          error:
            createBusinessError,
        } = await supabase
          .from("businesses")
          .insert({
            created_by:
              user.id,

            name:
              values.businessName,

            slug,

            category:
              values.category,

            business_type:
              values.businessType,

            description:
              values.businessDescription,

            business_email:
              nullable(
                values.businessEmail,
              ),

            business_phone:
              values.businessPhone,

            whatsapp_number:
              nullable(
                values.whatsappNumber,
              ),

            website:
              nullable(
                values.website,
              ),

            address_line_1:
              nullable(
                values.addressLine1,
              ),

            address_line_2:
              nullable(
                values.addressLine2,
              ),

            city:
              values.city,

            state:
              values.state,

            country:
              values.country,

            postal_code:
              nullable(
                values.postalCode,
              ),

            service_area:
              nullable(
                values.serviceArea,
              ),

            status:
              "DRAFT",

            onboarding_step:
              1,
          });

        if (!createBusinessError) {
          /*
           * Do not chain .select() onto the INSERT.
           *
           * The businesses SELECT policy allows rows only
           * after the OWNER membership exists. That
           * membership is created by the database trigger
           * after the business is inserted. A separate
           * request therefore lets the trigger finish first
           * before RLS evaluates this SELECT.
           */

          const {
            data:
              createdBusiness,
            error:
              createdBusinessError,
          } = await supabase
            .from("businesses")
            .select(
              "id, slug",
            )
            .eq(
              "slug",
              slug,
            )
            .eq(
              "created_by",
              user.id,
            )
            .maybeSingle();

          if (
            createdBusinessError ||
            !createdBusiness
          ) {
            throw new Error(
              `Created business could not be loaded: ${
                createdBusinessError
                  ?.message ??
                "Business row was not visible after creation."
              }`,
            );
          }

          businessId =
            createdBusiness.id;

          existingSlug =
            createdBusiness.slug;

          break;
        }

        lastInsertError =
          createBusinessError
            .message;

        /*
         * 23505 = unique violation.
         *
         * Retry with a suffix when the
         * public business slug is already
         * taken.
         */

        if (
          createBusinessError
            ?.code !== "23505"
        ) {
          throw new Error(
            `Business creation failed: ${
              createBusinessError
                ?.message ??
              "Unknown error"
            }`,
          );
        }
      }

      if (!businessId) {
        throw new Error(
          `Unable to generate a unique business URL. ${
            lastInsertError ?? ""
          }`,
        );
      }
    }

    if (!existingSlug) {
      throw new Error(
        "Business slug could not be resolved.",
      );
    }

    /*
     * Synchronize the business record.
     *
     * If onboarding was retried after a
     * partial failure, this refreshes the
     * saved business information.
     */

    const {
      error:
        businessUpdateError,
    } = await supabase
      .from("businesses")
      .update({
        name:
          values.businessName,

        category:
          values.category,

        business_type:
          values.businessType,

        description:
          values.businessDescription,

        business_email:
          nullable(
            values.businessEmail,
          ),

        business_phone:
          values.businessPhone,

        whatsapp_number:
          nullable(
            values.whatsappNumber,
          ),

        website:
          nullable(
            values.website,
          ),

        address_line_1:
          nullable(
            values.addressLine1,
          ),

        address_line_2:
          nullable(
            values.addressLine2,
          ),

        city:
          values.city,

        state:
          values.state,

        country:
          values.country,

        postal_code:
          nullable(
            values.postalCode,
          ),

        service_area:
          nullable(
            values.serviceArea,
          ),

        status:
          "DRAFT",

        onboarding_step:
          4,
      })
      .eq(
        "id",
        businessId,
      );

    if (
      businessUpdateError
    ) {
      throw new Error(
        `Business update failed: ${businessUpdateError.message}`,
      );
    }

    /*
     * SOCIAL LINKS
     */

    const {
      error:
        socialDeleteError,
    } = await supabase
      .from(
        "business_social_links",
      )
      .delete()
      .eq(
        "business_id",
        businessId,
      );

    if (
      socialDeleteError
    ) {
      throw new Error(
        `Social link cleanup failed: ${socialDeleteError.message}`,
      );
    }

    const socialEntries = [
      [
        "INSTAGRAM",
        values.instagramUrl,
        "Instagram",
      ],
      [
        "FACEBOOK",
        values.facebookUrl,
        "Facebook",
      ],
      [
        "LINKEDIN",
        values.linkedinUrl,
        "LinkedIn",
      ],
      [
        "YOUTUBE",
        values.youtubeUrl,
        "YouTube",
      ],
      [
        "X",
        values.xUrl,
        "X",
      ],
    ] as const;

    const socialRows =
      socialEntries
        .filter(
          ([, url]) =>
            url.trim()
              .length > 0,
        )
        .map(
          (
            [
              platform,
              url,
              label,
            ],
            index,
          ) => ({
            business_id:
              businessId,

            platform,

            label,

            url: url.trim(),

            sort_order:
              index,

            enabled: true,
          }),
        );

    if (
      socialRows.length > 0
    ) {
      const {
        error:
          socialInsertError,
      } = await supabase
        .from(
          "business_social_links",
        )
        .insert(
          socialRows,
        );

      if (
        socialInsertError
      ) {
        throw new Error(
          `Social links could not be saved: ${socialInsertError.message}`,
        );
      }
    }

    /*
     * BUSINESS HOURS
     */

    const hourRows =
      values.hours.map(
        (hour) => ({
          business_id:
            businessId,

          day_of_week:
            hour.dayOfWeek,

          is_closed:
            hour.isClosed,

          opens_at:
            hour.isClosed
              ? null
              : hour.opensAt,

          closes_at:
            hour.isClosed
              ? null
              : hour.closesAt,
        }),
      );

    const {
      error: hoursError,
    } = await supabase
      .from("business_hours")
      .upsert(
        hourRows,
        {
          onConflict:
            "business_id,day_of_week",
        },
      );

    if (hoursError) {
      throw new Error(
        `Business hours could not be saved: ${hoursError.message}`,
      );
    }

    /*
     * PRODUCTS / SERVICES
     *
     * During onboarding we replace the
     * draft catalog completely.
     *
     * This also makes retries
     * deterministic.
     */

    const {
      error:
        templatesDeleteError,
    } = await supabase
      .from(
        "contact_templates",
      )
      .delete()
      .eq(
        "business_id",
        businessId,
      );

    if (
      templatesDeleteError
    ) {
      throw new Error(
        `Contact template cleanup failed: ${templatesDeleteError.message}`,
      );
    }

    const {
      error:
        productsDeleteError,
    } = await supabase
      .from("products")
      .delete()
      .eq(
        "business_id",
        businessId,
      );

    if (
      productsDeleteError
    ) {
      throw new Error(
        `Product cleanup failed: ${productsDeleteError.message}`,
      );
    }

    const generatedSlugs =
      productSlugs(
        values.products,
      );

    const productRows =
      values.products.map(
        (
          product,
          index,
        ) => ({
          business_id:
            businessId,

          item_type:
            product.itemType,

          name:
            product.name,

          slug:
            generatedSlugs[
              index
            ],

          description:
            nullable(
              product.description,
            ),

          price_text:
            nullable(
              product.priceText,
            ),

          active: true,

          featured: false,

          sort_order:
            index,
        }),
      );

    const {
      error:
        productsInsertError,
    } = await supabase
      .from("products")
      .insert(
        productRows,
      );

    if (
      productsInsertError
    ) {
      throw new Error(
        `Products could not be saved: ${productsInsertError.message}`,
      );
    }

    /*
     * DEFAULT CONTACT TEMPLATES
     */

    const templateRows = [
      {
        business_id:
          businessId,

        product_id: null,

        channel:
          "WHATSAPP",

        title:
          "WhatsApp enquiry",

        message_template:
          values.whatsappMessage,

        active: true,
      },
    ];

    if (
      values.emailMessage
        .trim()
        .length > 0
    ) {
      templateRows.push({
        business_id:
          businessId,

        product_id: null,

        channel:
          "EMAIL",

        title:
          "Email enquiry",

        message_template:
          values.emailMessage,

        active: true,
      });
    }

    const {
      error:
        templateInsertError,
    } = await supabase
      .from(
        "contact_templates",
      )
      .insert(
        templateRows,
      );

    if (
      templateInsertError
    ) {
      throw new Error(
        `Contact templates could not be saved: ${templateInsertError.message}`,
      );
    }

    /*
     * PUBLIC BUSINESS PAGE
     */

    const {
      error:
        publicPageError,
    } = await supabase
      .from(
        "public_page_settings",
      )
      .update({
        headline:
          nullable(
            values.publicHeadline,
          ) ??
          values.businessName,

        subheadline:
          nullable(
            values.publicSubheadline,
          ),

        about_text:
          nullable(
            values.publicAbout,
          ) ??
          values.businessDescription,

        primary_cta_text:
          values.primaryCtaText,

        show_products:
          values.showProducts,

        show_business_hours:
          values.showBusinessHours,

        show_social_links:
          values.showSocialLinks,

        show_location:
          values.showLocation,

        show_phone:
          values.showPhone,

        show_email:
          values.showEmail,

        show_whatsapp:
          values.showWhatsapp,

        published:
          values.publicPublished,
      })
      .eq(
        "business_id",
        businessId,
      );

    if (
      publicPageError
    ) {
      throw new Error(
        `Public page settings could not be saved: ${publicPageError.message}`,
      );
    }

    /*
     * MARK ONBOARDING COMPLETE LAST.
     *
     * If any earlier operation fails,
     * the business remains DRAFT and the
     * owner can safely retry onboarding.
     */

    const {
      error:
        completeError,
    } = await supabase
      .from("businesses")
      .update({
        status:
          "ACTIVE",

        onboarding_step:
          9,

        onboarding_completed_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        businessId,
      );

    if (completeError) {
      throw new Error(
        `Unable to complete onboarding: ${completeError.message}`,
      );
    }

    return {
      success: true,
      message:
        "Your LeadNexus business is ready.",
    };
  } catch (error) {
    console.error(
      "LeadNexus onboarding error:",
      error,
    );

    return {
      success: false,
      message:
        "We couldn't finish onboarding. Your progress is still safe, so please try again.",
    };
  }
}