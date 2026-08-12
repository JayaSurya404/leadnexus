import crypto from "node:crypto";

import {
  createClient,
} from "@supabase/supabase-js";


const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const secretKey =
  process.env
    .SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL.",
  );
}

if (!secretKey) {
  throw new Error(
    "Missing SUPABASE_SECRET_KEY.",
  );
}


const supabase =
  createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );


const APP_URL =
  (
    process.env
      .NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(
    /\/$/,
    "",
  );


const DEMO_SLUG =
  "aurora-digital-studio";


const ownerEmail =
  process.env
    .DEMO_OWNER_EMAIL ||
  "leadnexus.demo.owner@example.com";


const adminEmail =
  process.env
    .DEMO_ADMIN_EMAIL ||
  "leadnexus.demo.admin@example.com";


function createPassword(
  prefix,
) {
  return `${prefix}-${crypto
    .randomBytes(12)
    .toString(
      "base64url",
    )}!7a`;
}


const ownerPassword =
  process.env
    .DEMO_OWNER_PASSWORD ||
  createPassword(
    "Owner",
  );


const adminPassword =
  process.env
    .DEMO_ADMIN_PASSWORD ||
  createPassword(
    "Admin",
  );


function atDaysAgo(
  days,
  minutes = 0,
) {
  return new Date(
    Date.now() -
      days *
        24 *
        60 *
        60 *
        1000 +
      minutes *
        60 *
        1000,
  ).toISOString();
}


async function result(
  promise,
  label,
) {
  const {
    data,
    error,
  } =
    await promise;

  if (error) {
    throw new Error(
      `${label}: ${error.message}`,
    );
  }

  return data;
}


async function findUserByEmail(
  email,
) {
  for (
    let page = 1;
    page <= 20;
    page += 1
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .auth
        .admin
        .listUsers({
          page,
          perPage:
            200,
        });

    if (error) {
      throw new Error(
        `Unable to inspect auth users: ${error.message}`,
      );
    }

    const user =
      data.users.find(
        (candidate) =>
          candidate.email
            ?.toLowerCase() ===
          email.toLowerCase(),
      );

    if (user) {
      return user;
    }

    if (
      data.users.length <
      200
    ) {
      break;
    }
  }

  return null;
}


async function ensureAuthUser({
  email,
  password,
  fullName,
}) {
  const existing =
    await findUserByEmail(
      email,
    );

  if (existing) {
    const {
      data,
      error,
    } =
      await supabase
        .auth
        .admin
        .updateUserById(
          existing.id,
          {
            password,

            user_metadata: {
              full_name:
                fullName,
            },
          },
        );

    if (
      error ||
      !data.user
    ) {
      throw new Error(
        `Unable to update ${email}: ${
          error?.message ??
          "Unknown error"
        }`,
      );
    }

    return data.user;
  }

  const {
    data,
    error,
  } =
    await supabase
      .auth
      .admin
      .createUser({
        email,
        password,

        email_confirm:
          true,

        user_metadata: {
          full_name:
            fullName,
        },
      });

  if (
    error ||
    !data.user
  ) {
    throw new Error(
      `Unable to create ${email}: ${
        error?.message ??
        "Unknown error"
      }`,
    );
  }

  return data.user;
}


async function addEvents({
  businessId,
  sessionId,
  leadId = null,
  daysAgo,
  events,
  products,
}) {
  if (
    events.length === 0
  ) {
    return;
  }

  const rows =
    events.map(
      (
        event,
        index,
      ) => {
        const time =
          atDaysAgo(
            daysAgo,
            5 +
              index *
                5,
          );

        const product =
          event.product
            ? products.get(
                event.product,
              )
            : null;

        return {
          business_id:
            businessId,

          session_id:
            sessionId,

          lead_id:
            leadId,

          product_id:
            product?.id ??
            null,

          event_type:
            event.type,

          page_path:
            `/b/${DEMO_SLUG}`,

          occurred_at:
            time,

          created_at:
            time,

          metadata:
            {
              demo:
                true,
            },
        };
      },
    );

  await result(
    supabase
      .from(
        "activity_events",
      )
      .insert(
        rows,
      ),

    "Insert activity events",
  );
}


async function main() {
  console.log(
    "\nLeadNexus Phase 16 demo seed\n",
  );


  // ==========================================================
  // AUTH USERS
  // ==========================================================

  const owner =
    await ensureAuthUser({
      email:
        ownerEmail,

      password:
        ownerPassword,

      fullName:
        "Demo Business Owner",
    });


  const admin =
    await ensureAuthUser({
      email:
        adminEmail,

      password:
        adminPassword,

      fullName:
        "LeadNexus Demo Admin",
    });


  await result(
    supabase
      .from(
        "profiles",
      )
      .upsert(
        {
          id:
            owner.id,

          full_name:
            "Demo Business Owner",

          platform_role:
            "USER",
        },
        {
          onConflict:
            "id",
        },
      ),

    "Owner profile",
  );


  await result(
    supabase
      .from(
        "profiles",
      )
      .upsert(
        {
          id:
            admin.id,

          full_name:
            "LeadNexus Demo Admin",

          platform_role:
            "PLATFORM_ADMIN",
        },
        {
          onConflict:
            "id",
        },
      ),

    "Admin profile",
  );


  // ==========================================================
  // RESET ONLY OUR DEMO BUSINESS
  // ==========================================================

  const existingBusiness =
    await result(
      supabase
        .from(
          "businesses",
        )
        .select(
          "id",
        )
        .eq(
          "slug",
          DEMO_SLUG,
        )
        .maybeSingle(),

      "Find existing demo business",
    );


  if (
    existingBusiness
  ) {
    await result(
      supabase
        .from(
          "businesses",
        )
        .delete()
        .eq(
          "id",
          existingBusiness.id,
        ),

      "Reset demo business",
    );
  }


  // ==========================================================
  // BUSINESS
  // ==========================================================

  const business =
    await result(
      supabase
        .from(
          "businesses",
        )
        .insert({
          created_by:
            owner.id,

          name:
            "Aurora Digital Studio",

          slug:
            DEMO_SLUG,

          category:
            "Software & Digital Services",

          business_type:
            "Service Business",

          description:
            "Aurora Digital Studio builds modern websites, AI automation and digital growth systems for growing businesses.",

          business_email:
            "aurora.digital@example.com",

          business_phone:
            "+91 98765 43210",

          whatsapp_number:
            "+91 98765 43210",

          website:
            "https://example.com",

          address_line_1:
            "Avinashi Road",

          city:
            "Coimbatore",

          state:
            "Tamil Nadu",

          country:
            "India",

          postal_code:
            "641004",

          service_area:
            "Coimbatore and Tamil Nadu",

          status:
            "ACTIVE",

          onboarding_step:
            6,

          onboarding_completed_at:
            atDaysAgo(
              30,
            ),

          created_at:
            atDaysAgo(
              60,
            ),
        })
        .select(
          "id, name, slug",
        )
        .single(),

      "Create demo business",
    );


  await result(
    supabase
      .from(
        "business_members",
      )
      .upsert(
        {
          business_id:
            business.id,

          user_id:
            owner.id,

          role:
            "OWNER",
        },
        {
          onConflict:
            "business_id,user_id",
        },
      ),

    "Owner membership",
  );


  // ==========================================================
  // PUBLIC PAGE
  // ==========================================================

  await result(
    supabase
      .from(
        "public_page_settings",
      )
      .upsert(
        {
          business_id:
            business.id,

          headline:
            "Grow your business with better digital systems",

          subheadline:
            "Web development, automation and digital growth solutions built for modern businesses.",

          about_text:
            "Aurora Digital Studio helps businesses improve their digital presence, capture more leads and automate repetitive workflows.",

          primary_cta_text:
            "Start an enquiry",

          show_products:
            true,

          show_business_hours:
            true,

          show_social_links:
            true,

          show_location:
            true,

          show_phone:
            true,

          show_email:
            true,

          show_whatsapp:
            true,

          lead_form_title:
            "Tell us what you need",

          lead_form_description:
            "Share your details and choose the service you are interested in.",

          published:
            true,
        },
        {
          onConflict:
            "business_id",
        },
      ),

    "Public page settings",
  );


  await result(
    supabase
      .from(
        "lead_form_settings",
      )
      .upsert(
        {
          business_id:
            business.id,

          collect_email:
            true,

          collect_location:
            true,

          collect_message:
            true,

          consent_text:
            "I agree that Aurora Digital Studio may contact me regarding my enquiry.",

          consent_text_version:
            "1.0",

          success_message:
            "Thanks! Your enquiry has been received.",
        },
        {
          onConflict:
            "business_id",
        },
      ),

    "Lead form settings",
  );


  // ==========================================================
  // HOURS
  // ==========================================================

  const hours =
    [
      {
        day:
          0,

        closed:
          true,
      },
      {
        day:
          1,

        opens:
          "09:00",

        closes:
          "18:00",
      },
      {
        day:
          2,

        opens:
          "09:00",

        closes:
          "18:00",
      },
      {
        day:
          3,

        opens:
          "09:00",

        closes:
          "18:00",
      },
      {
        day:
          4,

        opens:
          "09:00",

        closes:
          "18:00",
      },
      {
        day:
          5,

        opens:
          "09:00",

        closes:
          "18:00",
      },
      {
        day:
          6,

        opens:
          "10:00",

        closes:
          "16:00",
      },
    ].map(
      (item) => ({
        business_id:
          business.id,

        day_of_week:
          item.day,

        is_closed:
          item.closed ??
          false,

        opens_at:
          item.closed
            ? null
            : item.opens,

        closes_at:
          item.closed
            ? null
            : item.closes,
      }),
    );


  await result(
    supabase
      .from(
        "business_hours",
      )
      .upsert(
        hours,
        {
          onConflict:
            "business_id,day_of_week",
        },
      ),

    "Business hours",
  );


  // ==========================================================
  // SOCIAL LINKS
  // ==========================================================

  await result(
    supabase
      .from(
        "business_social_links",
      )
      .insert([
        {
          business_id:
            business.id,

          platform:
            "INSTAGRAM",

          label:
            "Instagram",

          url:
            "https://www.instagram.com/",

          sort_order:
            1,
        },
        {
          business_id:
            business.id,

          platform:
            "FACEBOOK",

          label:
            "Facebook",

          url:
            "https://www.facebook.com/",

          sort_order:
            2,
        },
        {
          business_id:
            business.id,

          platform:
            "LINKEDIN",

          label:
            "LinkedIn",

          url:
            "https://www.linkedin.com/",

          sort_order:
            3,
        },
      ]),

    "Social links",
  );


  // ==========================================================
  // PRODUCTS / SERVICES
  // ==========================================================

  const productRows =
    await result(
      supabase
        .from(
          "products",
        )
        .insert([
          {
            business_id:
              business.id,

            item_type:
              "SERVICE",

            name:
              "AI Website Starter",

            slug:
              "ai-website-starter",

            short_description:
              "A modern business website with lead capture.",

            description:
              "Responsive business website, contact flows and conversion-focused pages.",

            price_text:
              "From ₹25,000",

            featured:
              true,

            sort_order:
              1,
          },
          {
            business_id:
              business.id,

            item_type:
              "SERVICE",

            name:
              "Lead Automation Setup",

            slug:
              "lead-automation-setup",

            short_description:
              "Automate lead handling and follow-up workflows.",

            description:
              "Structured lead capture, workflow automation and business process integration.",

            price_text:
              "From ₹18,000",

            featured:
              true,

            sort_order:
              2,
          },
          {
            business_id:
              business.id,

            item_type:
              "SERVICE",

            name:
              "Local SEO Growth",

            slug:
              "local-seo-growth",

            short_description:
              "Improve local discoverability and search visibility.",

            description:
              "Technical SEO, content structure and local business search optimization.",

            price_text:
              "From ₹12,000/month",

            featured:
              false,

            sort_order:
              3,
          },
          {
            business_id:
              business.id,

            item_type:
              "SERVICE",

            name:
              "Business CRM Setup",

            slug:
              "business-crm-setup",

            short_description:
              "Organize leads and customer follow-up.",

            description:
              "CRM setup designed around real business sales and customer workflows.",

            price_text:
              "From ₹20,000",

            featured:
              false,

            sort_order:
              4,
          },
        ])
        .select(
          "id, slug, name",
        ),

      "Products",
    );


  const products =
    new Map(
      productRows.map(
        (product) => [
          product.slug,
          product,
        ],
      ),
    );


  // ==========================================================
  // CONTACT TEMPLATES
  // ==========================================================

  await result(
    supabase
      .from(
        "contact_templates",
      )
      .insert([
        {
          business_id:
            business.id,

          product_id:
            null,

          channel:
            "WHATSAPP",

          title:
            "General WhatsApp enquiry",

          message_template:
            "Hi {{business_name}}, I'm interested in {{product_name}}. Could you please share more information?",

          active:
            true,
        },
        {
          business_id:
            business.id,

          product_id:
            null,

          channel:
            "EMAIL",

          title:
            "General email enquiry",

          message_template:
            "Hello {{business_name}}, I'm interested in {{product_name}}. Please share more information.",

          active:
            true,
        },
      ]),

    "Contact templates",
  );


  // ==========================================================
  // SEO
  // ==========================================================

  const canonicalUrl =
    `${APP_URL}/b/${DEMO_SLUG}`;


  await result(
    supabase
      .from(
        "seo_settings",
      )
      .upsert(
        {
          business_id:
            business.id,

          seo_title:
            "Aurora Digital Studio | Web & AI Automation",

          title:
            "Aurora Digital Studio | Web & AI Automation",

          meta_description:
            "Web development, AI automation and digital growth solutions for businesses in Coimbatore.",

          description:
            "Web development, AI automation and digital growth solutions for businesses in Coimbatore.",

          keywords: [
            "web development Coimbatore",
            "AI automation",
            "lead automation",
            "digital services",
          ],

          canonical_override:
            canonicalUrl,

          canonical_url:
            canonicalUrl,

          og_title:
            "Aurora Digital Studio",

          og_description:
            "Modern digital systems for growing businesses.",

          allow_indexing:
            true,

          indexable:
            true,
        },
        {
          onConflict:
            "business_id",
        },
      ),

    "SEO settings",
  );


  // ==========================================================
  // TRACKING LINKS
  // ==========================================================

  const trackingRows =
    await result(
      supabase
        .from(
          "tracking_links",
        )
        .insert([
          {
            business_id:
              business.id,

            product_id:
              products.get(
                "ai-website-starter",
              ).id,

            name:
              "Instagram Bio",

            code:
              "demoig01",

            source:
              "instagram",

            medium:
              "social",

            campaign:
              "evergreen",

            content:
              "bio",

            destination_path:
              `/b/${DEMO_SLUG}`,

            active:
              true,

            click_count:
              24,

            last_clicked_at:
              atDaysAgo(
                1,
              ),
          },
          {
            business_id:
              business.id,

            product_id:
              products.get(
                "lead-automation-setup",
              ).id,

            name:
              "Google AI Automation Ad",

            code:
              "demogads1",

            source:
              "google",

            medium:
              "cpc",

            campaign:
              "ai-automation",

            content:
              "search-ad",

            destination_path:
              `/b/${DEMO_SLUG}`,

            active:
              true,

            click_count:
              18,

            last_clicked_at:
              atDaysAgo(
                2,
              ),
          },
          {
            business_id:
              business.id,

            product_id:
              products.get(
                "local-seo-growth",
              ).id,

            name:
              "Coimbatore Expo QR",

            code:
              "demoqr01",

            source:
              "offline",

            medium:
              "qr",

            campaign:
              "coimbatore-expo",

            destination_path:
              `/b/${DEMO_SLUG}`,

            active:
              true,

            click_count:
              9,

            last_clicked_at:
              atDaysAgo(
                4,
              ),
          },
        ])
        .select(
          "id, code, source, medium, campaign",
        ),

      "Tracking links",
    );


  const tracking =
    new Map(
      trackingRows.map(
        (link) => [
          link.code,
          link,
        ],
      ),
    );


  async function createSession(
    definition,
  ) {
    const link =
      definition.trackingCode
        ? tracking.get(
            definition.trackingCode,
          )
        : null;

    const created =
      atDaysAgo(
        definition.daysAgo,
      );

    const landing =
      `/b/${DEMO_SLUG}`;


    return result(
      supabase
        .from(
          "visitor_sessions",
        )
        .insert({
          business_id:
            business.id,

          anonymous_id:
            crypto.randomUUID(),

          tracking_link_id:
            link?.id ??
            null,

          first_tracking_link_id:
            link?.id ??
            null,

          last_tracking_link_id:
            link?.id ??
            null,

          landing_path:
            landing,

          last_landing_path:
            landing,

          initial_referrer:
            definition.referrer ??
            null,

          first_referrer:
            definition.referrer ??
            null,

          last_referrer:
            definition.referrer ??
            null,

          first_source:
            definition.source,

          first_medium:
            definition.medium ??
            null,

          first_campaign:
            definition.campaign ??
            null,

          last_source:
            definition.source,

          last_medium:
            definition.medium ??
            null,

          last_campaign:
            definition.campaign ??
            null,

          device_type:
            definition.device ??
            "mobile",

          browser:
            definition.browser ??
            "Chrome",

          operating_system:
            definition.os ??
            "Android",

          country:
            "India",

          region:
            "Tamil Nadu",

          city:
            "Coimbatore",

          first_seen_at:
            created,

          last_seen_at:
            created,

          last_activity_at:
            created,

          visit_count:
            1,

          created_at:
            created,

          updated_at:
            created,
        })
        .select(
          "id",
        )
        .single(),

      "Visitor session",
    );
  }


  // ==========================================================
  // LEAD JOURNEYS
  // ==========================================================

  const journeys = [
    {
      name:
        "Priya Raman",

      phone:
        "+91 90000 10001",

      email:
        "priya.demo@example.com",

      product:
        "ai-website-starter",

      source:
        "instagram",

      medium:
        "social",

      campaign:
        "evergreen",

      trackingCode:
        "demoig01",

      daysAgo:
        1,

      status:
        "NEW",

      recovery:
        null,

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "ai-website-starter",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "ai-website-starter",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
        {
          type:
            "WHATSAPP_CLICK",

          product:
            "ai-website-starter",
        },
      ],
    },

    {
      name:
        "Karthik S",

      phone:
        "+91 90000 10002",

      email:
        "karthik.demo@example.com",

      product:
        "lead-automation-setup",

      source:
        "google",

      medium:
        "cpc",

      campaign:
        "ai-automation",

      trackingCode:
        "demogads1",

      daysAgo:
        2,

      status:
        "CONTACTED",

      recovery:
        "SENT",

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "lead-automation-setup",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "business-crm-setup",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "lead-automation-setup",
        },
        {
          type:
            "RETURN_VISIT",
        },
        {
          type:
            "CTA_CLICK",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
      ],
    },

    {
      name:
        "Nandhini P",

      phone:
        "+91 90000 10003",

      email:
        "nandhini.demo@example.com",

      product:
        "local-seo-growth",

      source:
        "offline",

      medium:
        "qr",

      campaign:
        "coimbatore-expo",

      trackingCode:
        "demoqr01",

      daysAgo:
        3,

      status:
        "QUALIFIED",

      recovery:
        null,

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "local-seo-growth",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
        {
          type:
            "EMAIL_CLICK",

          product:
            "local-seo-growth",
        },
      ],
    },

    {
      name:
        "Rahul M",

      phone:
        "+91 90000 10004",

      email:
        "rahul.demo@example.com",

      product:
        "business-crm-setup",

      source:
        "Direct",

      medium:
        null,

      campaign:
        null,

      trackingCode:
        null,

      daysAgo:
        4,

      status:
        "CUSTOMER",

      recovery:
        null,

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "business-crm-setup",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "business-crm-setup",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
        {
          type:
            "PHONE_CLICK",

          product:
            "business-crm-setup",
        },
      ],
    },

    {
      name:
        "Divya K",

      phone:
        "+91 90000 10005",

      email:
        "divya.demo@example.com",

      product:
        "ai-website-starter",

      source:
        "instagram",

      medium:
        "social",

      campaign:
        "evergreen",

      trackingCode:
        "demoig01",

      daysAgo:
        5,

      status:
        "NO_RESPONSE",

      recovery:
        null,

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
        {
          type:
            "WEBSITE_CLICK",

          product:
            "ai-website-starter",
        },
      ],
    },

    {
      name:
        "Senthil R",

      phone:
        "+91 90000 10006",

      email:
        "senthil.demo@example.com",

      product:
        "local-seo-growth",

      source:
        "google",

      medium:
        "cpc",

      campaign:
        "ai-automation",

      trackingCode:
        "demogads1",

      daysAgo:
        6,

      status:
        "RESPONDED",

      recovery:
        "SENT",

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "local-seo-growth",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "local-seo-growth",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
      ],
    },

    {
      name:
        "Meena V",

      phone:
        "+91 90000 10007",

      email:
        "meena.demo@example.com",

      product:
        "lead-automation-setup",

      source:
        "instagram",

      medium:
        "social",

      campaign:
        "evergreen",

      trackingCode:
        "demoig01",

      daysAgo:
        7,

      status:
        "NEW",

      recovery:
        "PENDING",

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "lead-automation-setup",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "business-crm-setup",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "lead-automation-setup",
        },
        {
          type:
            "RETURN_VISIT",
        },
        {
          type:
            "CTA_CLICK",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
      ],
    },

    {
      name:
        "Arjun T",

      phone:
        "+91 90000 10008",

      email:
        "arjun.demo@example.com",

      product:
        "business-crm-setup",

      source:
        "offline",

      medium:
        "qr",

      campaign:
        "coimbatore-expo",

      trackingCode:
        "demoqr01",

      daysAgo:
        8,

      status:
        "NEW",

      recovery:
        "PENDING",

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PAGE_VIEW",
        },
        {
          type:
            "PRODUCT_VIEW",

          product:
            "business-crm-setup",
        },
        {
          type:
            "PRODUCT_ENGAGED",

          product:
            "business-crm-setup",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
      ],
    },

    {
      name:
        "Lakshmi G",

      phone:
        "+91 90000 10009",

      email:
        "lakshmi.demo@example.com",

      product:
        "local-seo-growth",

      source:
        "Direct",

      medium:
        null,

      campaign:
        null,

      trackingCode:
        null,

      daysAgo:
        10,

      status:
        "NOT_INTERESTED",

      recovery:
        "IGNORED",

      pre: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
      ],

      post: [
        {
          type:
            "LEAD_FORM_SUBMITTED",
        },
      ],
    },
  ];


  const createdLeads =
    new Map();


  for (
    const journey
    of journeys
  ) {
    const session =
      await createSession(
        journey,
      );


    await addEvents({
      businessId:
        business.id,

      sessionId:
        session.id,

      daysAgo:
        journey.daysAgo,

      events:
        journey.pre,

      products,
    });


    const submittedAt =
      atDaysAgo(
        journey.daysAgo,
        55,
      );


    const lead =
      await result(
        supabase
          .from(
            "leads",
          )
          .insert({
            business_id:
              business.id,

            visitor_session_id:
              session.id,

            primary_product_id:
              products.get(
                journey.product,
              ).id,

            name:
              journey.name,

            phone:
              journey.phone,

            email:
              journey.email,

            city:
              "Coimbatore",

            state:
              "Tamil Nadu",

            country:
              "India",

            consent_given:
              true,

            consent_text_version:
              "1.0",

            consent_at:
              submittedAt,

            form_submitted_at:
              submittedAt,

            created_at:
              submittedAt,
          })
          .select(
            "id, name",
          )
          .single(),

        `Create lead ${journey.name}`,
      );


    await addEvents({
      businessId:
        business.id,

      sessionId:
        session.id,

      leadId:
        lead.id,

      daysAgo:
        journey.daysAgo,

      events:
        journey.post,

      products,
    });


    if (
      journey.recovery ===
      "SENT"
    ) {
      const reviewedAt =
        atDaysAgo(
          journey.daysAgo,
          100,
        );


      await result(
        supabase
          .from(
            "leads",
          )
          .update({
            visibility:
              "OWNER_VISIBLE",

            contact_intent:
              "RECOVERED",

            owner_visible_at:
              reviewedAt,
          })
          .eq(
            "id",
            lead.id,
          ),

        "Expose recovered lead",
      );


      await result(
        supabase
          .from(
            "lead_recovery_reviews",
          )
          .upsert(
            {
              lead_id:
                lead.id,

              decision:
                "SENT_TO_OWNER",

              reviewed_by:
                admin.id,

              admin_note:
                "Demo recovery: meaningful engagement without direct contact.",

              reviewed_at:
                reviewedAt,

              sent_at:
                reviewedAt,
            },
            {
              onConflict:
                "lead_id",
            },
          ),

        "Recovered lead review",
      );
    }


    if (
      journey.recovery ===
      "PENDING"
    ) {
      await result(
        supabase
          .from(
            "lead_recovery_reviews",
          )
          .upsert(
            {
              lead_id:
                lead.id,

              decision:
                "PENDING",
            },
            {
              onConflict:
                "lead_id",
            },
          ),

        "Pending recovery review",
      );
    }


    if (
      journey.recovery ===
      "IGNORED"
    ) {
      await result(
        supabase
          .from(
            "lead_recovery_reviews",
          )
          .upsert(
            {
              lead_id:
                lead.id,

              decision:
                "IGNORED",

              reviewed_by:
                admin.id,

              admin_note:
                "Demo lead with low purchase intent.",

              reviewed_at:
                atDaysAgo(
                  journey.daysAgo,
                  90,
                ),
            },
            {
              onConflict:
                "lead_id",
            },
          ),

        "Ignored recovery review",
      );
    }


    if (
      journey.status !==
      "NEW"
    ) {
      await result(
        supabase
          .from(
            "leads",
          )
          .update({
            status:
              journey.status,
          })
          .eq(
            "id",
            lead.id,
          ),

        "Update lead status",
      );
    }


    await result(
      supabase.rpc(
        "analyze_lead_rules",
        {
          p_lead_id:
            lead.id,
        },
      ),

      "Analyze lead",
    );


    createdLeads.set(
      journey.name,
      lead,
    );
  }


  // ==========================================================
  // VISITOR-ONLY SESSIONS
  // ==========================================================

  const visitorOnly = [
    {
      source:
        "instagram",

      medium:
        "social",

      campaign:
        "evergreen",

      trackingCode:
        "demoig01",

      daysAgo:
        9,
    },
    {
      source:
        "google",

      medium:
        "cpc",

      campaign:
        "ai-automation",

      trackingCode:
        "demogads1",

      daysAgo:
        11,
    },
    {
      source:
        "Direct",

      medium:
        null,

      campaign:
        null,

      trackingCode:
        null,

      daysAgo:
        12,
    },
    {
      source:
        "offline",

      medium:
        "qr",

      campaign:
        "coimbatore-expo",

      trackingCode:
        "demoqr01",

      daysAgo:
        13,
    },
  ];


  for (
    const visitor
    of visitorOnly
  ) {
    const session =
      await createSession(
        visitor,
      );

    await addEvents({
      businessId:
        business.id,

      sessionId:
        session.id,

      daysAgo:
        visitor.daysAgo,

      events: [
        {
          type:
            "SESSION_STARTED",
        },
        {
          type:
            "PAGE_VIEW",
        },
      ],

      products,
    });
  }


  // ==========================================================
  // OWNER NOTES
  // ==========================================================

  const qualifiedLead =
    createdLeads.get(
      "Nandhini P",
    );


  const recoveredLead =
    createdLeads.get(
      "Karthik S",
    );


  if (
    qualifiedLead
  ) {
    await result(
      supabase
        .from(
          "lead_notes",
        )
        .insert({
          lead_id:
            qualifiedLead.id,

          author_user_id:
            owner.id,

          note:
            "Requested a detailed Local SEO proposal. Follow up with scope and timeline.",
        }),

      "Qualified lead note",
    );
  }


  if (
    recoveredLead
  ) {
    await result(
      supabase
        .from(
          "lead_notes",
        )
        .insert({
          lead_id:
            recoveredLead.id,

          author_user_id:
            owner.id,

          note:
            "Recovered by LeadNexus after strong automation-service engagement.",
        }),

      "Recovered lead note",
    );
  }


  // ==========================================================
  // FINAL VERIFICATION
  // ==========================================================

  const leads =
    await result(
      supabase
        .from(
          "leads",
        )
        .select(
          "id, visibility, contact_intent, status",
        )
        .eq(
          "business_id",
          business.id,
        ),

      "Verify leads",
    );


  const intelligence =
    await result(
      supabase
        .from(
          "lead_intelligence",
        )
        .select(
          "lead_id, temperature, score",
        )
        .eq(
          "business_id",
          business.id,
        ),

      "Verify intelligence",
    );


  const sessions =
    await result(
      supabase
        .from(
          "visitor_sessions",
        )
        .select(
          "id",
          {
            count:
              "exact",
          },
        )
        .eq(
          "business_id",
          business.id,
        ),

      "Verify sessions",
    );


  const temperatures =
    intelligence.reduce(
      (
        totals,
        item,
      ) => {
        totals[
          item.temperature
        ] =
          (
            totals[
              item.temperature
            ] ??
            0
          ) + 1;

        return totals;
      },
      {},
    );


  console.log(
    "\nDemo seed complete ✅\n",
  );

  console.log(
    `Business: ${business.name}`,
  );

  console.log(
    `Public page: ${APP_URL}/b/${business.slug}`,
  );

  console.log(
    `Instagram tracking: ${APP_URL}/l/demoig01`,
  );

  console.log(
    `Google tracking: ${APP_URL}/l/demogads1`,
  );

  console.log(
    `QR tracking: ${APP_URL}/l/demoqr01`,
  );


  console.log(
    "\nOWNER LOGIN",
  );

  console.log(
    `Email: ${ownerEmail}`,
  );

  console.log(
    `Password: ${ownerPassword}`,
  );


  console.log(
    "\nADMIN LOGIN",
  );

  console.log(
    `Email: ${adminEmail}`,
  );

  console.log(
    `Password: ${adminPassword}`,
  );


  console.log(
    "\nDATA SUMMARY",
  );

  console.log({
    visitorSessions:
      sessions.length,

    leads:
      leads.length,

    ownerVisible:
      leads.filter(
        (lead) =>
          lead.visibility ===
          "OWNER_VISIBLE",
      ).length,

    adminOnly:
      leads.filter(
        (lead) =>
          lead.visibility ===
          "ADMIN_ONLY",
      ).length,

    directContacts:
      leads.filter(
        (lead) =>
          lead.contact_intent ===
          "DIRECT_CONTACT",
      ).length,

    recovered:
      leads.filter(
        (lead) =>
          lead.contact_intent ===
          "RECOVERED",
      ).length,

    temperatures,
  });


  if (
    !temperatures.HOT ||
    !temperatures.WARM ||
    !temperatures.COLD
  ) {
    throw new Error(
      "Demo intelligence did not produce HOT, WARM and COLD examples.",
    );
  }


  console.log(
    "\nSave the login credentials from this terminal for local QA.\n",
  );
}


main().catch(
  (error) => {
    console.error(
      "\nLeadNexus demo seed failed:",
      error,
    );

    process.exitCode =
      1;
  },
);