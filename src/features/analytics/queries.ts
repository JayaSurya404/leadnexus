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
  LeadFunnelPoint,
  OwnerDashboardData,
  RecentLeadItem,
  RecoveredLeadItem,
  SourcePerformancePoint,
  VisitorTrendPoint,
} from "@/types/analytics";

const TREND_DAYS = 14;

const SOURCE_WINDOW_DAYS = 30;

const MAX_ANALYTICS_ROWS =
  1000;

function ensureNoError(
  label: string,
  error:
    | {
        message: string;
      }
    | null,
) {
  if (error) {
    throw new Error(
      `${label}: ${error.message}`,
    );
  }
}

function cleanSource(
  value: string | null,
) {
  const source =
    value?.trim();

  if (!source) {
    return "Direct";
  }

  return source;
}

export async function getOwnerDashboardData(
  businessId: string,
): Promise<OwnerDashboardData> {
  const supabase =
    createAdminClient();

  const now =
    new Date();

  const trendStart =
    startOfDay(
      subDays(
        now,
        TREND_DAYS - 1,
      ),
    );

  const sourceStart =
    startOfDay(
      subDays(
        now,
        SOURCE_WINDOW_DAYS - 1,
      ),
    );

  const [
    visitorCountResult,

    visibleLeadCountResult,

    directContactCountResult,

    recoveredCountResult,

    newCountResult,

    contactedCountResult,

    respondedCountResult,

    qualifiedCountResult,

    customerCountResult,

    visitorTrendResult,

    sourceResult,

    recentLeadsResult,

    recoveredLeadsResult,
  ] = await Promise.all([
    supabase
      .from(
        "visitor_sessions",
      )
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
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
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "contact_intent",
        "DIRECT_CONTACT",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "contact_intent",
        "RECOVERED",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "status",
        "NEW",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "status",
        "CONTACTED",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "status",
        "RESPONDED",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "status",
        "QUALIFIED",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from("leads")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "visibility",
        "OWNER_VISIBLE",
      )
      .eq(
        "status",
        "CUSTOMER",
      )
      .is(
        "archived_at",
        null,
      ),

    supabase
      .from(
        "visitor_sessions",
      )
      .select(
        "first_seen_at",
      )
      .eq(
        "business_id",
        businessId,
      )
      .gte(
        "first_seen_at",
        trendStart.toISOString(),
      )
      .order(
        "first_seen_at",
        {
          ascending: false,
        },
      )
      .limit(
        MAX_ANALYTICS_ROWS,
      ),

    supabase
      .from(
        "visitor_sessions",
      )
      .select(
        "first_source, first_seen_at",
      )
      .eq(
        "business_id",
        businessId,
      )
      .gte(
        "first_seen_at",
        sourceStart.toISOString(),
      )
      .order(
        "first_seen_at",
        {
          ascending: false,
        },
      )
      .limit(
        MAX_ANALYTICS_ROWS,
      ),

    supabase
      .from("leads")
      .select(
        `
          id,
          name,
          phone,
          email,
          status,
          contact_intent,
          primary_product_id,
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
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(8),

    supabase
      .from("leads")
      .select(
        `
          id,
          name,
          status,
          primary_product_id,
          owner_visible_at
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
      .eq(
        "contact_intent",
        "RECOVERED",
      )
      .is(
        "archived_at",
        null,
      )
      .not(
        "owner_visible_at",
        "is",
        null,
      )
      .order(
        "owner_visible_at",
        {
          ascending: false,
        },
      )
      .limit(5),
  ]);

  ensureNoError(
    "Visitor count query failed",
    visitorCountResult.error,
  );

  ensureNoError(
    "Lead count query failed",
    visibleLeadCountResult.error,
  );

  ensureNoError(
    "Direct contact count query failed",
    directContactCountResult.error,
  );

  ensureNoError(
    "Recovered lead count query failed",
    recoveredCountResult.error,
  );

  ensureNoError(
    "New lead count query failed",
    newCountResult.error,
  );

  ensureNoError(
    "Contacted lead count query failed",
    contactedCountResult.error,
  );

  ensureNoError(
    "Responded lead count query failed",
    respondedCountResult.error,
  );

  ensureNoError(
    "Qualified lead count query failed",
    qualifiedCountResult.error,
  );

  ensureNoError(
    "Customer count query failed",
    customerCountResult.error,
  );

  ensureNoError(
    "Visitor trend query failed",
    visitorTrendResult.error,
  );

  ensureNoError(
    "Traffic source query failed",
    sourceResult.error,
  );

  ensureNoError(
    "Recent leads query failed",
    recentLeadsResult.error,
  );

  ensureNoError(
    "Recovered leads query failed",
    recoveredLeadsResult.error,
  );

  /*
   * ----------------------------------------------------------
   * PRODUCT NAME LOOKUP
   * ----------------------------------------------------------
   */

  const productIds =
    Array.from(
      new Set(
        [
          ...(
            recentLeadsResult.data ??
            []
          ),

          ...(
            recoveredLeadsResult.data ??
            []
          ),
        ]
          .map(
            (row) =>
              row.primary_product_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                "string" &&
              value.length > 0,
          ),
      ),
    );

  const productNameMap =
    new Map<
      string,
      string
    >();

  if (
    productIds.length > 0
  ) {
    const {
      data:
        productRows,
      error:
        productError,
    } = await supabase
      .from("products")
      .select(
        "id, name",
      )
      .eq(
        "business_id",
        businessId,
      )
      .in(
        "id",
        productIds,
      );

    ensureNoError(
      "Product lookup failed",
      productError,
    );

    for (
      const product of
        productRows ?? []
    ) {
      productNameMap.set(
        product.id,
        product.name,
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * VISITOR TREND
   * ----------------------------------------------------------
   */

  const visitorTrendMap =
    new Map<
      string,
      VisitorTrendPoint
    >();

  for (
    let offset = 0;
    offset <
    TREND_DAYS;
    offset += 1
  ) {
    const date =
      subDays(
        startOfDay(now),
        TREND_DAYS -
          1 -
          offset,
      );

    const key =
      format(
        date,
        "yyyy-MM-dd",
      );

    visitorTrendMap.set(
      key,
      {
        date: key,

        label:
          format(
            date,
            "MMM d",
          ),

        visitors: 0,
      },
    );
  }

  for (
    const row of
      visitorTrendResult.data ??
      []
  ) {
    const key =
      format(
        new Date(
          row.first_seen_at,
        ),
        "yyyy-MM-dd",
      );

    const point =
      visitorTrendMap.get(
        key,
      );

    if (point) {
      point.visitors += 1;
    }
  }

  /*
   * ----------------------------------------------------------
   * TRAFFIC SOURCES
   * ----------------------------------------------------------
   */

  const sourceMap =
    new Map<
      string,
      number
    >();

  for (
    const row of
      sourceResult.data ??
      []
  ) {
    const source =
      cleanSource(
        row.first_source,
      );

    sourceMap.set(
      source,
      (
        sourceMap.get(
          source,
        ) ?? 0
      ) + 1,
    );
  }

  const sources:
    SourcePerformancePoint[] =
      Array.from(
        sourceMap.entries(),
      )
        .map(
          ([
            source,
            visitors,
          ]) => ({
            source,
            visitors,
          }),
        )
        .sort(
          (a, b) =>
            b.visitors -
            a.visitors,
        )
        .slice(0, 6);

  /*
   * ----------------------------------------------------------
   * FUNNEL
   * ----------------------------------------------------------
   */

  const funnel:
    LeadFunnelPoint[] = [
    {
      status: "NEW",
      label: "New",
      value:
        newCountResult.count ??
        0,
    },

    {
      status:
        "CONTACTED",
      label:
        "Contacted",
      value:
        contactedCountResult.count ??
        0,
    },

    {
      status:
        "RESPONDED",
      label:
        "Responded",
      value:
        respondedCountResult.count ??
        0,
    },

    {
      status:
        "QUALIFIED",
      label:
        "Qualified",
      value:
        qualifiedCountResult.count ??
        0,
    },

    {
      status:
        "CUSTOMER",
      label:
        "Customer",
      value:
        customerCountResult.count ??
        0,
    },
  ];

  /*
   * ----------------------------------------------------------
   * RECENT LEADS
   * ----------------------------------------------------------
   */

  const recentLeads:
    RecentLeadItem[] =
      (
        recentLeadsResult.data ??
        []
      ).map(
        (row) => ({
          id: row.id,

          name: row.name,

          phone: row.phone,

          email:
            row.email,

          status:
            row.status,

          contactIntent:
            row.contact_intent,

          productName:
            row.primary_product_id
              ? productNameMap.get(
                  row.primary_product_id,
                ) ??
                null
              : null,

          createdAt:
            row.created_at,
        }),
      );

  /*
   * ----------------------------------------------------------
   * RECOVERED LEADS
   * ----------------------------------------------------------
   */

  const recoveredLeads:
    RecoveredLeadItem[] =
      (
        recoveredLeadsResult.data ??
        []
      ).flatMap(
        (row) => {
          if (
            !row.owner_visible_at
          ) {
            return [];
          }

          return [
            {
              id: row.id,

              name:
                row.name,

              status:
                row.status,

              productName:
                row.primary_product_id
                  ? productNameMap.get(
                      row.primary_product_id,
                    ) ??
                    null
                  : null,

              ownerVisibleAt:
                row.owner_visible_at,
            },
          ];
        },
      );

  return {
    metrics: {
      visitors:
        visitorCountResult.count ??
        0,

      visibleLeads:
        visibleLeadCountResult.count ??
        0,

      directContacts:
        directContactCountResult.count ??
        0,

      recoveredLeads:
        recoveredCountResult.count ??
        0,

      qualifiedLeads:
        qualifiedCountResult.count ??
        0,

      customers:
        customerCountResult.count ??
        0,
    },

    visitorTrend:
      Array.from(
        visitorTrendMap.values(),
      ),

    funnel,

    sources,

    recentLeads,

    recoveredLeads,
  };
}