import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

type TrackingRouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: TrackingRouteContext,
) {
  const {
    code,
  } =
    await context.params;

  const supabase =
    createAdminClient();

  const {
    data: link,
    error:
      linkError,
  } = await supabase
    .from(
      "tracking_links",
    )
    .select(
      `
        id,
        business_id,
        code,
        source,
        medium,
        campaign,
        content,
        term,
        product_id,
        destination_path,
        active,
        click_count
      `,
    )
    .eq(
      "code",
      code,
    )
    .eq(
      "active",
      true,
    )
    .limit(1)
    .maybeSingle();

  if (
    linkError ||
    !link
  ) {
    return NextResponse.redirect(
      new URL(
        "/",
        request.url,
      ),
    );
  }

  const [
    businessResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from(
        "businesses",
      )
      .select(
        `
          id,
          slug,
          status
        `,
      )
      .eq(
        "id",
        link.business_id,
      )
      .eq(
        "status",
        "ACTIVE",
      )
      .maybeSingle(),

    supabase
      .from(
        "public_page_settings",
      )
      .select(
        "published",
      )
      .eq(
        "business_id",
        link.business_id,
      )
      .maybeSingle(),
  ]);

  const business =
    businessResult.data;

  if (
    businessResult.error ||
    !business ||
    settingsResult.error ||
    !settingsResult.data
      ?.published
  ) {
    return NextResponse.redirect(
      new URL(
        "/",
        request.url,
      ),
    );
  }

  await supabase
    .from(
      "tracking_links",
    )
    .update({
      click_count:
        Number(
          link.click_count ??
            0,
        ) + 1,

      last_clicked_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      link.id,
    );

  let path =
    link.destination_path ??
    `/b/${business.slug}`;

  if (
    !path.startsWith(
      "/",
    ) ||
    path.startsWith(
      "//",
    )
  ) {
    path =
      `/b/${business.slug}`;
  }

  const destination =
    new URL(
      path,
      request.url,
    );

  destination.searchParams.set(
    "ln_tracking",
    link.id,
  );

  destination.searchParams.set(
    "utm_source",
    link.source ??
      "leadnexus",
  );

  if (link.medium) {
    destination.searchParams.set(
      "utm_medium",
      link.medium,
    );
  }

  if (link.campaign) {
    destination.searchParams.set(
      "utm_campaign",
      link.campaign,
    );
  }

  if (link.content) {
    destination.searchParams.set(
      "utm_content",
      link.content,
    );
  }

  if (link.term) {
    destination.searchParams.set(
      "utm_term",
      link.term,
    );
  }

  if (link.product_id) {
    destination.searchParams.set(
      "product",
      link.product_id,
    );
  }

  return NextResponse.redirect(
    destination,
  );
}