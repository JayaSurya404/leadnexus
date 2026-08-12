import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  OwnerTrackingLink,
} from "@/types/tracking-links";

export async function getOwnerTrackingLinks(
  businessId: string,
): Promise<
  OwnerTrackingLink[]
> {
  const supabase =
    createAdminClient();

  const {
    data: links,
    error: linkError,
  } = await supabase
    .from(
      "tracking_links",
    )
    .select(
      `
        id,
        name,
        code,
        source,
        medium,
        campaign,
        content,
        term,
        product_id,
        destination_path,
        active,
        click_count,
        last_clicked_at,
        created_at
      `,
    )
    .eq(
      "business_id",
      businessId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (linkError) {
    throw new Error(
      `Unable to load tracking links: ${linkError.message}`,
    );
  }

  const rows =
    links ?? [];

  const linkIds =
    rows.map(
      (link) =>
        link.id,
    );

  const productIds =
    Array.from(
      new Set(
        rows
          .map(
            (link) =>
              link.product_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
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

  const visitorCount =
    new Map<
      string,
      number
    >();

  const sessionToLink =
    new Map<
      string,
      string
    >();

  if (
    linkIds.length > 0
  ) {
    const {
      data: sessions,
      error:
        sessionError,
    } = await supabase
      .from(
        "visitor_sessions",
      )
      .select(
        `
          id,
          first_tracking_link_id
        `,
      )
      .eq(
        "business_id",
        businessId,
      )
      .in(
        "first_tracking_link_id",
        linkIds,
      );

    if (sessionError) {
      throw new Error(
        `Unable to load link visitors: ${sessionError.message}`,
      );
    }

    for (
      const session of
        sessions ?? []
    ) {
      if (
        !session.first_tracking_link_id
      ) {
        continue;
      }

      sessionToLink.set(
        session.id,
        session.first_tracking_link_id,
      );

      visitorCount.set(
        session.first_tracking_link_id,
        (
          visitorCount.get(
            session.first_tracking_link_id,
          ) ?? 0
        ) + 1,
      );
    }
  }

  const leadCount =
    new Map<
      string,
      number
    >();

  const sessionIds =
    Array.from(
      sessionToLink.keys(),
    );

  if (
    sessionIds.length > 0
  ) {
    const {
      data: leads,
      error:
        leadError,
    } = await supabase
      .from("leads")
      .select(
        `
          id,
          visitor_session_id
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
      .in(
        "visitor_session_id",
        sessionIds,
      );

    if (leadError) {
      throw new Error(
        `Unable to load link leads: ${leadError.message}`,
      );
    }

    for (
      const lead of
        leads ?? []
    ) {
      if (
        !lead.visitor_session_id
      ) {
        continue;
      }

      const linkId =
        sessionToLink.get(
          lead.visitor_session_id,
        );

      if (!linkId) {
        continue;
      }

      leadCount.set(
        linkId,
        (
          leadCount.get(
            linkId,
          ) ?? 0
        ) + 1,
      );
    }
  }

  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  return rows.map(
    (link) => ({
      id:
        link.id,

      name:
        link.name ??
        link.source ??
        "Tracking link",

      code:
        link.code ?? "",

      source:
        link.source ??
        "Direct",

      medium:
        link.medium,

      campaign:
        link.campaign,

      content:
        link.content,

      term:
        link.term,

      productId:
        link.product_id,

      productName:
        link.product_id
          ? productMap.get(
              link.product_id,
            ) ??
            null
          : null,

      destinationPath:
        link.destination_path,

      active:
        link.active,

      clickCount:
        Number(
          link.click_count ??
            0,
        ),

      visitors:
        visitorCount.get(
          link.id,
        ) ?? 0,

      ownerVisibleLeads:
        leadCount.get(
          link.id,
        ) ?? 0,

      lastClickedAt:
        link.last_clicked_at,

      createdAt:
        link.created_at,

      publicUrl:
        `${appUrl}/l/${link.code}`,
    }),
  );
}