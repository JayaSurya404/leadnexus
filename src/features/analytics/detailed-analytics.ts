import "server-only";

import {
  format,
  startOfDay,
  subDays,
} from "date-fns";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  AnalyticsDay,
  AnalyticsSource,
  DetailedAnalytics,
  ProductAnalytics,
} from "@/types/detailed-analytics";

export async function getDetailedAnalytics(
  businessId: string,
): Promise<DetailedAnalytics> {
  const supabase =
    createAdminClient();

  const today =
    startOfDay(
      new Date(),
    );

  const thirtyDaysAgo =
    subDays(
      today,
      29,
    );

  const fourteenDaysAgo =
    subDays(
      today,
      13,
    );

  const [
    sessionsResult,
    leadsResult,
    productsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from(
        "visitor_sessions",
      )
      .select(
        `
          id,
          first_seen_at,
          first_source
        `,
      )
      .eq(
        "business_id",
        businessId,
      )
      .gte(
        "first_seen_at",
        thirtyDaysAgo
          .toISOString(),
      )
      .order(
        "first_seen_at",
        {
          ascending: true,
        },
      ),

    supabase
      .from("leads")
      .select(
        `
          id,
          visitor_session_id,
          primary_product_id,
          contact_intent,
          status,
          created_at
        `,
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .is(
        "archived_at",
        null,
      )
      .gte(
        "created_at",
        thirtyDaysAgo
          .toISOString(),
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    supabase
      .from("products")
      .select(
        `
          id,
          name
        `,
      )
      .eq(
        "business_id",
        businessId,
      )
      .order("name"),

    supabase
      .from(
        "activity_events",
      )
      .select(
        `
          id,
          event_type,
          product_id,
          created_at
        `,
      )
      .eq(
        "business_id",
        businessId,
      )
      .in(
        "event_type",
        [
          "PRODUCT_VIEW",
          "PRODUCT_ENGAGED",
        ],
      )
      .gte(
        "created_at",
        thirtyDaysAgo
          .toISOString(),
      ),
  ]);

  if (
    sessionsResult.error
  ) {
    throw new Error(
      `Unable to load visitors: ${sessionsResult.error.message}`,
    );
  }

  if (
    leadsResult.error
  ) {
    throw new Error(
      `Unable to load analytics leads: ${leadsResult.error.message}`,
    );
  }

  if (
    productsResult.error
  ) {
    throw new Error(
      `Unable to load analytics products: ${productsResult.error.message}`,
    );
  }

  if (
    activityResult.error
  ) {
    throw new Error(
      `Unable to load product activity: ${activityResult.error.message}`,
    );
  }

  const sessions =
    sessionsResult.data ??
    [];

  const leads =
    leadsResult.data ??
    [];

  const products =
    productsResult.data ??
    [];

  const activity =
    activityResult.data ??
    [];

  const directContacts =
    leads.filter(
      (lead) =>
        lead.contact_intent ===
        "DIRECT_CONTACT",
    ).length;

  const recoveredLeads =
    leads.filter(
      (lead) =>
        lead.contact_intent ===
        "RECOVERED",
    ).length;

  const qualifiedLeads =
    leads.filter(
      (lead) =>
        lead.status ===
          "QUALIFIED" ||
        lead.status ===
          "CUSTOMER",
    ).length;

  const customers =
    leads.filter(
      (lead) =>
        lead.status ===
        "CUSTOMER",
    ).length;

  const conversionRate =
    sessions.length > 0
      ? Number(
          (
            (
              customers /
              sessions.length
            ) *
            100
          ).toFixed(1),
        )
      : 0;

  const dayMap =
    new Map<
      string,
      AnalyticsDay
    >();

  for (
    let index = 0;
    index < 14;
    index += 1
  ) {
    const day =
      subDays(
        today,
        13 - index,
      );

    const key =
      format(
        day,
        "yyyy-MM-dd",
      );

    dayMap.set(
      key,
      {
        date: key,

        label:
          format(
            day,
            "MMM d",
          ),

        visitors: 0,

        leads: 0,
      },
    );
  }

  for (
    const session of
      sessions
  ) {
    const date =
      new Date(
        session.first_seen_at,
      );

    if (
      date <
      fourteenDaysAgo
    ) {
      continue;
    }

    const key =
      format(
        date,
        "yyyy-MM-dd",
      );

    const day =
      dayMap.get(
        key,
      );

    if (day) {
      day.visitors +=
        1;
    }
  }

  for (
    const lead of
      leads
  ) {
    const date =
      new Date(
        lead.created_at,
      );

    if (
      date <
      fourteenDaysAgo
    ) {
      continue;
    }

    const key =
      format(
        date,
        "yyyy-MM-dd",
      );

    const day =
      dayMap.get(
        key,
      );

    if (day) {
      day.leads +=
        1;
    }
  }

  const sessionSourceMap =
    new Map<
      string,
      string
    >();

  const sourceMap =
    new Map<
      string,
      {
        visitors: number;

        leads: number;
      }
    >();

  for (
    const session of
      sessions
  ) {
    const source =
      session.first_source
        ?.trim() ||
      "Direct";

    sessionSourceMap.set(
      session.id,
      source,
    );

    const current =
      sourceMap.get(
        source,
      ) ?? {
        visitors: 0,
        leads: 0,
      };

    current.visitors +=
      1;

    sourceMap.set(
      source,
      current,
    );
  }

  for (
    const lead of
      leads
  ) {
    if (
      !lead.visitor_session_id
    ) {
      continue;
    }

    const source =
      sessionSourceMap.get(
        lead.visitor_session_id,
      );

    if (!source) {
      continue;
    }

    const current =
      sourceMap.get(
        source,
      );

    if (!current) {
      continue;
    }

    current.leads +=
      1;
  }

  const sources:
    AnalyticsSource[] =
      Array.from(
        sourceMap.entries(),
      )
        .map(
          ([
            source,
            values,
          ]) => ({
            source,

            visitors:
              values.visitors,

            leads:
              values.leads,
          }),
        )
        .sort(
          (a, b) =>
            b.visitors -
            a.visitors,
        )
        .slice(
          0,
          8,
        );

  const productMap =
    new Map<
      string,
      ProductAnalytics
    >();

  for (
    const product of
      products
  ) {
    productMap.set(
      product.id,
      {
        id:
          product.id,

        name:
          product.name,

        views: 0,

        engagements: 0,

        visibleLeads: 0,

        customers: 0,
      },
    );
  }

  for (
    const event of
      activity
  ) {
    if (
      !event.product_id
    ) {
      continue;
    }

    const product =
      productMap.get(
        event.product_id,
      );

    if (!product) {
      continue;
    }

    if (
      event.event_type ===
      "PRODUCT_VIEW"
    ) {
      product.views +=
        1;
    }

    if (
      event.event_type ===
      "PRODUCT_ENGAGED"
    ) {
      product.engagements +=
        1;
    }
  }

  for (
    const lead of
      leads
  ) {
    if (
      !lead.primary_product_id
    ) {
      continue;
    }

    const product =
      productMap.get(
        lead.primary_product_id,
      );

    if (!product) {
      continue;
    }

    product.visibleLeads +=
      1;

    if (
      lead.status ===
      "CUSTOMER"
    ) {
      product.customers +=
        1;
    }
  }

  const productAnalytics =
    Array.from(
      productMap.values(),
    ).sort(
      (a, b) =>
        b.engagements +
          b.visibleLeads -
        (
          a.engagements +
          a.visibleLeads
        ),
    );

  return {
    metrics: {
      visitors:
        sessions.length,

      visibleLeads:
        leads.length,

      directContacts,

      recoveredLeads,

      qualifiedLeads,

      customers,

      conversionRate,
    },

    trend:
      Array.from(
        dayMap.values(),
      ),

    sources,

    products:
      productAnalytics,
  };
}