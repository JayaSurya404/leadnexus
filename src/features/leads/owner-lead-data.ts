import "server-only";

import {
  createClient,
} from "@/lib/supabase/server";

import type {
  LeadContactIntent,
  LeadIntelligenceView,
  LeadNoteItem,
  LeadStatus,
  LeadTemperature,
  OwnerLeadDetail,
  OwnerLeadSummary,
} from "@/types/leads";

function normalizeTemperature(
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

function normalizeScore(
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

function normalizeReasons(
  value: unknown,
): string[] {
  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          const record =
            item as Record<
              string,
              unknown
            >;

          const reason =
            record.reason ??
            record.label ??
            record.text;

          if (
            typeof reason ===
            "string"
          ) {
            return reason;
          }
        }

        return null;
      })
      .filter(
        (
          item,
        ): item is string =>
          Boolean(item),
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

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object.entries(
      value,
    )
      .map(
        ([
          key,
          item,
        ]) => {
          if (
            typeof item ===
            "string"
          ) {
            return `${key}: ${item}`;
          }

          if (
            typeof item ===
            "number"
          ) {
            return `${key}: ${item}`;
          }

          if (
            item === true
          ) {
            return key;
          }

          return null;
        },
      )
      .filter(
        (
          item,
        ): item is string =>
          Boolean(item),
      );
  }

  return [];
}

function noteText(
  row: Record<
    string,
    unknown
  >,
) {
  const candidates = [
    row.note,
    row.note_text,
    row.body,
    row.content,
  ];

  for (
    const candidate of
      candidates
  ) {
    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      return candidate;
    }
  }

  return "";
}

function noteAuthor(
  row: Record<
    string,
    unknown
  >,
) {
  const candidate =
    row.author_user_id ??
    row.author_id ??
    row.created_by;

  return typeof candidate ===
    "string"
    ? candidate
    : null;
}

function valueAsString(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value
    : null;
}

export async function getOwnerLeads(
  businessId: string,
): Promise<
  OwnerLeadSummary[]
> {
  const supabase =
    await createClient();

  const {
    data: leadRows,
    error: leadError,
  } = await supabase
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
        created_at,
        owner_visible_at,
        do_not_call
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
    .limit(200);

  if (leadError) {
    throw new Error(
      `Unable to load leads: ${leadError.message}`,
    );
  }

  const rows =
    leadRows ?? [];

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
              id,
            ): id is string =>
              typeof id ===
                "string" &&
              id.length > 0,
          ),
      ),
    );

  const productMap =
    new Map<
      string,
      string
    >();

  if (
    productIds.length > 0
  ) {
    const {
      data: products,
      error: productError,
    } = await supabase
      .from("products")
      .select("id, name")
      .eq(
        "business_id",
        businessId,
      )
      .in(
        "id",
        productIds,
      );

    if (productError) {
      throw new Error(
        `Unable to load lead products: ${productError.message}`,
      );
    }

    for (
      const product of
        products ?? []
    ) {
      productMap.set(
        product.id,
        product.name,
      );
    }
  }

  const intelligenceMap =
    new Map<
      string,
      {
        temperature:
          LeadTemperature;

        score:
          number | null;
      }
    >();

  const leadIds =
    rows.map(
      (lead) =>
        lead.id,
    );

  if (
    leadIds.length > 0
  ) {
    const {
      data:
        intelligenceRows,
    } = await supabase
      .from(
        "lead_intelligence",
      )
      .select(
        "lead_id, temperature, score",
      )
      .eq(
        "business_id",
        businessId,
      )
      .in(
        "lead_id",
        leadIds,
      );

    for (
      const intelligence of
        intelligenceRows ??
        []
    ) {
      intelligenceMap.set(
        intelligence.lead_id,
        {
          temperature:
            normalizeTemperature(
              intelligence.temperature,
            ),

          score:
            normalizeScore(
              intelligence.score,
            ),
        },
      );
    }
  }

  return rows.map(
    (lead) => {
      const intelligence =
        intelligenceMap.get(
          lead.id,
        );

      return {
        id:
          lead.id,

        name:
          lead.name,

        phone:
          lead.phone,

        email:
          lead.email,

        status:
          lead.status as
            LeadStatus,

        contactIntent:
          lead.contact_intent as
            LeadContactIntent,

        productName:
          lead.primary_product_id
            ? productMap.get(
                lead.primary_product_id,
              ) ??
              null
            : null,

        temperature:
          intelligence
            ?.temperature ??
          "UNKNOWN",

        score:
          intelligence
            ?.score ??
          null,

        createdAt:
          lead.created_at,

        ownerVisibleAt:
          lead.owner_visible_at,
      };
    },
  );
}

export async function getOwnerRecoveredLeads(
  businessId: string,
) {
  const leads =
    await getOwnerLeads(
      businessId,
    );

  return leads.filter(
    (lead) =>
      lead.contactIntent ===
      "RECOVERED",
  );
}

export async function getOwnerLeadDetail(
  businessId: string,
  leadId: string,
): Promise<
  OwnerLeadDetail | null
> {
  const supabase =
    await createClient();

  const {
    data: lead,
    error: leadError,
  } = await supabase
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
        created_at,
        owner_visible_at,
        do_not_call
      `,
    )
    .eq(
      "id",
      leadId,
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
    .maybeSingle();

  if (leadError) {
    throw new Error(
      `Unable to load lead: ${leadError.message}`,
    );
  }

  if (!lead) {
    return null;
  }

  let productName:
    | string
    | null = null;

  if (
    lead.primary_product_id
  ) {
    const {
      data: product,
    } = await supabase
      .from("products")
      .select("name")
      .eq(
        "id",
        lead.primary_product_id,
      )
      .eq(
        "business_id",
        businessId,
      )
      .maybeSingle();

    productName =
      product?.name ??
      null;
  }

  const [
    notesResult,
    activityResult,
    intelligenceResult,
  ] = await Promise.all([
    supabase
      .from("lead_notes")
      .select("*")
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "lead_id",
        leadId,
      ),

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
      .eq(
        "lead_id",
        leadId,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(100),

    supabase
      .from(
        "lead_intelligence",
      )
      .select("*")
      .eq(
        "business_id",
        businessId,
      )
      .eq(
        "lead_id",
        leadId,
      )
      .maybeSingle(),
  ]);

  const notes:
    LeadNoteItem[] =
      (
        notesResult.data ??
        []
      )
        .map(
          (raw) => {
            const row =
              raw as Record<
                string,
                unknown
              >;

            return {
              id:
                valueAsString(
                  row.id,
                ) ??
                crypto.randomUUID(),

              text:
                noteText(
                  row,
                ),

              createdAt:
                valueAsString(
                  row.created_at,
                ) ??
                new Date(
                  0,
                ).toISOString(),

              authorId:
                noteAuthor(
                  row,
                ),
            };
          },
        )
        .filter(
          (note) =>
            note.text
              .trim()
              .length > 0,
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        );

  const intelligenceRow =
    intelligenceResult.data
      ? (
          intelligenceResult.data as Record<
            string,
            unknown
          >
        )
      : null;

  let intelligence:
    LeadIntelligenceView | null =
      null;

  if (intelligenceRow) {
    intelligence = {
      temperature:
        normalizeTemperature(
          intelligenceRow.temperature,
        ),

      score:
        normalizeScore(
          intelligenceRow.score,
        ),

      primaryInterest:
        valueAsString(
          intelligenceRow.primary_interest,
        ),

      reasons:
        normalizeReasons(
          intelligenceRow.reasons,
        ),

      recommendedAction:
        valueAsString(
          intelligenceRow.recommended_action,
        ),

      analyzedAt:
        valueAsString(
          intelligenceRow.analyzed_at,
        ) ??
        valueAsString(
          intelligenceRow.updated_at,
        ),
    };
  }

  return {
    id:
      lead.id,

    name:
      lead.name,

    phone:
      lead.phone,

    email:
      lead.email,

    status:
      lead.status as
        LeadStatus,

    doNotCall:
      Boolean(lead.do_not_call),

    contactIntent:
      lead.contact_intent as
        LeadContactIntent,

    productId:
      lead.primary_product_id,

    productName,

    createdAt:
      lead.created_at,

    ownerVisibleAt:
      lead.owner_visible_at,

    notes,

    activity:
      (
        activityResult.data ??
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
