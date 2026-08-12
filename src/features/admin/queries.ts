import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  AdminBusinessSummary,
  AdminLeadDetail,
  AdminLeadSummary,
  AdminRecoveryCandidate,
  RecoveryDecision,
} from "@/types/admin";

import type {
  LeadContactIntent,
  LeadIntelligenceView,
  LeadStatus,
  LeadTemperature,
} from "@/types/leads";

function temperature(
  value: unknown,
): LeadTemperature {
  if (
    value === "HOT" ||
    value === "WARM" ||
    value === "COLD" ||
    value === "UNKNOWN"
  ) {
    return value;
  }

  return "UNKNOWN";
}

function numberValue(
  value: unknown,
) {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    const converted =
      Number(value);

    if (
      Number.isFinite(
        converted,
      )
    ) {
      return converted;
    }
  }

  return null;
}

function stringValue(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value
    : null;
}

function reasonsValue(
  value: unknown,
): string[] {
  if (
    Array.isArray(value)
  ) {
    return value.filter(
      (
        item,
      ): item is string =>
        typeof item ===
        "string",
    );
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    return [
      value.trim(),
    ];
  }

  return [];
}

function recoveryDecision(
  value: unknown,
): RecoveryDecision | null {
  if (
    value === "PENDING" ||
    value ===
      "SENT_TO_OWNER" ||
    value === "IGNORED"
  ) {
    return value;
  }

  return null;
}

export async function getAdminLeads(): Promise<
  AdminLeadSummary[]
> {
  const supabase =
    createAdminClient();

  const {
    data: leads,
    error: leadError,
  } = await supabase
    .from("leads")
    .select(
      `
        id,
        business_id,
        name,
        phone,
        email,
        status,
        visibility,
        contact_intent,
        primary_product_id,
        visitor_session_id,
        created_at,
        owner_visible_at,
        archived_at
      `,
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
    .limit(1000);

  if (leadError) {
    throw new Error(
      `Unable to load admin leads: ${leadError.message}`,
    );
  }

  const rows =
    leads ?? [];

  if (
    rows.length === 0
  ) {
    return [];
  }

  const businessIds =
    Array.from(
      new Set(
        rows.map(
          (lead) =>
            lead.business_id,
        ),
      ),
    );

  const productIds =
    Array.from(
      new Set(
        rows
          .map(
            (lead) =>
              lead.primary_product_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    );

  const sessionIds =
    Array.from(
      new Set(
        rows
          .map(
            (lead) =>
              lead.visitor_session_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    );

  const leadIds =
    rows.map(
      (lead) =>
        lead.id,
    );

  const [
    businessesResult,
    productsResult,
    intelligenceResult,
    recoveryResult,
    sessionsResult,
  ] = await Promise.all([
    supabase
      .from(
        "businesses",
      )
      .select(
        "id, name, slug",
      )
      .in(
        "id",
        businessIds,
      ),

    productIds.length >
    0
      ? supabase
          .from(
            "products",
          )
          .select(
            "id, name",
          )
          .in(
            "id",
            productIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    supabase
      .from(
        "lead_intelligence",
      )
      .select(
        `
          lead_id,
          temperature,
          score,
          primary_interest,
          buying_intent,
          reasons,
          recommended_action
        `,
      )
      .in(
        "lead_id",
        leadIds,
      ),

    supabase
      .from(
        "lead_recovery_reviews",
      )
      .select("*")
      .in(
        "lead_id",
        leadIds,
      ),

    sessionIds.length >
    0
      ? supabase
          .from(
            "visitor_sessions",
          )
          .select(
            `
              id,
              first_source,
              first_campaign,
              last_source,
              last_campaign
            `,
          )
          .in(
            "id",
            sessionIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (
    businessesResult.error
  ) {
    throw new Error(
      businessesResult
        .error.message,
    );
  }

  const businessMap =
    new Map<
      string,
      {
        name: string;
        slug: string;
      }
    >();

  for (
    const business of
      businessesResult.data ??
      []
  ) {
    businessMap.set(
      business.id,
      {
        name:
          business.name,

        slug:
          business.slug,
      },
    );
  }

  const productMap =
    new Map<
      string,
      string
    >();

  for (
    const product of
      productsResult.data ??
      []
  ) {
    productMap.set(
      product.id,
      product.name,
    );
  }

  const intelligenceMap =
    new Map<
      string,
      Record<
        string,
        unknown
      >
    >();

  for (
    const item of
      intelligenceResult.data ??
      []
  ) {
    intelligenceMap.set(
      item.lead_id,
      item as Record<
        string,
        unknown
      >,
    );
  }

  const recoveryMap =
    new Map<
      string,
      RecoveryDecision | null
    >();

  for (
    const raw of
      recoveryResult.data ??
      []
  ) {
    const row =
      raw as Record<
        string,
        unknown
      >;

    const leadId =
      stringValue(
        row.lead_id,
      );

    if (!leadId) {
      continue;
    }

    recoveryMap.set(
      leadId,
      recoveryDecision(
        row.decision,
      ),
    );
  }

  const sessionMap =
    new Map<
      string,
      Record<
        string,
        unknown
      >
    >();

  for (
    const session of
      sessionsResult.data ??
      []
  ) {
    sessionMap.set(
      session.id,
      session as Record<
        string,
        unknown
      >,
    );
  }

  return rows.map(
    (lead) => {
      const business =
        businessMap.get(
          lead.business_id,
        );

      const intelligence =
        intelligenceMap.get(
          lead.id,
        );

      const session =
        lead.visitor_session_id
          ? sessionMap.get(
              lead.visitor_session_id,
            )
          : undefined;

      return {
        id:
          lead.id,

        businessId:
          lead.business_id,

        businessName:
          business?.name ??
          "Unknown business",

        businessSlug:
          business?.slug ??
          "",

        name:
          lead.name,

        phone:
          lead.phone,

        email:
          lead.email,

        status:
          lead.status as
            LeadStatus,

        visibility:
          lead.visibility as
            | "ADMIN_ONLY"
            | "OWNER_VISIBLE",

        contactIntent:
          lead.contact_intent as
            LeadContactIntent,

        productId:
          lead.primary_product_id,

        productName:
          lead.primary_product_id
            ? productMap.get(
                lead.primary_product_id,
              ) ??
              null
            : null,

        visitorSessionId:
          lead.visitor_session_id,

        source:
          stringValue(
            session?.last_source,
          ) ??
          stringValue(
            session?.first_source,
          ),

        campaign:
          stringValue(
            session?.last_campaign,
          ) ??
          stringValue(
            session?.first_campaign,
          ),

        temperature:
          temperature(
            intelligence
              ?.temperature,
          ),

        score:
          numberValue(
            intelligence?.score,
          ),

        primaryInterest:
          stringValue(
            intelligence
              ?.primary_interest,
          ),

        buyingIntent:
          stringValue(
            intelligence
              ?.buying_intent,
          ),

        reasons:
          reasonsValue(
            intelligence?.reasons,
          ),

        recommendedAction:
          stringValue(
            intelligence
              ?.recommended_action,
          ),

        recoveryDecision:
          recoveryMap.get(
            lead.id,
          ) ??
          null,

        createdAt:
          lead.created_at,

        ownerVisibleAt:
          lead.owner_visible_at,
      };
    },
  );
}

export async function getAdminRecoveryQueue(): Promise<
  AdminRecoveryCandidate[]
> {
  const leads =
    await getAdminLeads();

  const candidates =
    leads.filter(
      (lead) => {
        if (
          lead.visibility !==
          "ADMIN_ONLY"
        ) {
          return false;
        }

        if (
          lead.recoveryDecision ===
            "IGNORED" ||
          lead.recoveryDecision ===
            "SENT_TO_OWNER"
        ) {
          return false;
        }

        return (
          lead.temperature ===
            "HOT" ||
          lead.temperature ===
            "WARM" ||
          (
            lead.score !==
              null &&
            lead.score >=
              40
          )
        );
      },
    );

  const supabase =
    createAdminClient();

  const activityMap =
    new Map<
      string,
      {
        count: number;

        lastActivityAt:
          | string
          | null;
      }
    >();

  if (
    candidates.length >
    0
  ) {
    const {
      data: activities,
      error,
    } = await supabase
      .from(
        "activity_events",
      )
      .select(
        `
          lead_id,
          created_at
        `,
      )
      .in(
        "lead_id",
        candidates.map(
          (lead) =>
            lead.id,
        ),
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {
      throw new Error(
        `Unable to load recovery activity: ${error.message}`,
      );
    }

    for (
      const activity of
        activities ?? []
    ) {
      if (
        !activity.lead_id
      ) {
        continue;
      }

      const current =
        activityMap.get(
          activity.lead_id,
        ) ?? {
          count: 0,
          lastActivityAt:
            null,
        };

      activityMap.set(
        activity.lead_id,
        {
          count:
            current.count +
            1,

          lastActivityAt:
            current.lastActivityAt ??
            activity.created_at,
        },
      );
    }
  }

  return candidates
    .map(
      (lead) => {
        const activity =
          activityMap.get(
            lead.id,
          );

        return {
          ...lead,

          activityCount:
            activity?.count ??
            0,

          lastActivityAt:
            activity
              ?.lastActivityAt ??
            null,
        };
      },
    )
    .sort(
      (a, b) =>
        (
          b.score ??
          0
        ) -
        (
          a.score ??
          0
        ),
    );
}

export async function getAdminLeadDetail(
  leadId: string,
): Promise<
  AdminLeadDetail | null
> {
  const leads =
    await getAdminLeads();

  const lead =
    leads.find(
      (item) =>
        item.id ===
        leadId,
    );

  if (!lead) {
    return null;
  }

  const supabase =
    createAdminClient();

  const {
    data: activities,
    error,
  } = await supabase
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
      "lead_id",
      leadId,
    )
    .eq(
      "business_id",
      lead.businessId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(150);

  if (error) {
    throw new Error(
      `Unable to load lead activity: ${error.message}`,
    );
  }

  let intelligence:
    LeadIntelligenceView | null =
      null;

  if (
    lead.score !== null ||
    lead.temperature !==
      "UNKNOWN"
  ) {
    intelligence = {
      temperature:
        lead.temperature,

      score:
        lead.score,

      primaryInterest:
        lead.primaryInterest,

      reasons:
        lead.reasons,

      recommendedAction:
        lead.recommendedAction,

      analyzedAt:
        null,
    };
  }

  return {
    ...lead,

    activity:
      (
        activities ??
        []
      ).map(
        (event) => ({
          id:
            event.id,

          eventType:
            event.event_type,

          productId:
            event.product_id,

          createdAt:
            event.created_at,
        }),
      ),

    intelligence,
  };
}

export async function getAdminBusinesses(): Promise<
  AdminBusinessSummary[]
> {
  const supabase =
    createAdminClient();

  const {
    data: businesses,
    error,
  } = await supabase
    .from(
      "businesses",
    )
    .select("*")
    .order(
      "name",
    );

  if (error) {
    throw new Error(
      `Unable to load businesses: ${error.message}`,
    );
  }

  const leads =
    await getAdminLeads();

  return (
    businesses ?? []
  ).map(
    (raw) => {
      const business =
        raw as Record<
          string,
          unknown
        >;

      const id =
        String(
          business.id,
        );

      const businessLeads =
        leads.filter(
          (lead) =>
            lead.businessId ===
            id,
        );

      const city =
        stringValue(
          business.city,
        );

      const state =
        stringValue(
          business.state,
        );

      const country =
        stringValue(
          business.country,
        );

      const location =
        [
          city,
          state,
          country,
        ]
          .filter(Boolean)
          .join(", ") ||
        null;

      return {
        id,

        name:
          stringValue(
            business.name,
          ) ??
          "Unnamed business",

        slug:
          stringValue(
            business.slug,
          ) ??
          "",

        status:
          stringValue(
            business.status,
          ) ??
          "UNKNOWN",

        category:
          stringValue(
            business.category,
          ),

        businessType:
          stringValue(
            business
              .business_type,
          ),

        email:
          stringValue(
            business
              .business_email,
          ),

        phone:
          stringValue(
            business
              .business_phone,
          ),

        location,

        totalLeads:
          businessLeads.length,

        adminOnlyLeads:
          businessLeads.filter(
            (lead) =>
              lead.visibility ===
              "ADMIN_ONLY",
          ).length,

        ownerVisibleLeads:
          businessLeads.filter(
            (lead) =>
              lead.visibility ===
              "OWNER_VISIBLE",
          ).length,

        recoveredLeads:
          businessLeads.filter(
            (lead) =>
              lead.contactIntent ===
              "RECOVERED",
          ).length,

        customers:
          businessLeads.filter(
            (lead) =>
              lead.status ===
              "CUSTOMER",
          ).length,
      };
    },
  );
}

export async function getAdminBusiness(
  businessId: string,
) {
  const businesses =
    await getAdminBusinesses();

  const business =
    businesses.find(
      (item) =>
        item.id ===
        businessId,
    );

  if (!business) {
    return null;
  }

  const leads =
    (
      await getAdminLeads()
    ).filter(
      (lead) =>
        lead.businessId ===
        businessId,
    );

  return {
    business,
    leads,
  };
}