import type {
  Metadata,
} from "next";

import {
  Link2,
  MousePointerClick,
  Users,
} from "lucide-react";

import {
  CreateTrackingLinkForm,
} from "@/components/links/create-tracking-link-form";

import {
  TrackingLinkCard,
} from "@/components/links/tracking-link-card";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  getOwnerTrackingLinks,
} from "@/features/tracking/owner-tracking-links";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title:
    "Tracking Links | LeadNexus",
};

export default async function LinksPage() {
  const context =
    await requireOwner();

  const supabase =
    createAdminClient();

  const [
    links,
    productResult,
  ] = await Promise.all([
    getOwnerTrackingLinks(
      context.business.id,
    ),

    supabase
      .from("products")
      .select(
        "id, name",
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .eq(
        "active",
        true,
      )
      .order(
        "name",
      ),
  ]);

  if (
    productResult.error
  ) {
    throw new Error(
      `Unable to load products: ${productResult.error.message}`,
    );
  }

  const totalClicks =
    links.reduce(
      (
        total,
        link,
      ) =>
        total +
        link.clickCount,
      0,
    );

  const totalVisitors =
    links.reduce(
      (
        total,
        link,
      ) =>
        total +
        link.visitors,
      0,
    );

  const totalVisibleLeads =
    links.reduce(
      (
        total,
        link,
      ) =>
        total +
        link.ownerVisibleLeads,
      0,
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link2 className="size-4" />
          Attribution
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Tracking links
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Create links for social
          media, campaigns, ads and QR
          codes, then measure the
          traffic they generate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary
          icon={
            <MousePointerClick className="size-5" />
          }
          label="Total clicks"
          value={
            totalClicks
          }
        />

        <Summary
          icon={
            <Users className="size-5" />
          }
          label="Visitors"
          value={
            totalVisitors
          }
        />

        <Summary
          icon={
            <Link2 className="size-5" />
          }
          label="Owner-visible leads"
          value={
            totalVisibleLeads
          }
        />
      </div>

      <CreateTrackingLinkForm
        products={
          productResult.data ??
          []
        }
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Your links
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {links.length} tracking{" "}
            {links.length === 1
              ? "link"
              : "links"}
          </p>
        </div>

        {links.length ===
        0 ? (
          <div className="rounded-xl border border-dashed px-6 py-16 text-center">
            <Link2 className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No tracking links yet
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Create your first link
              using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {links.map(
              (link) => (
                <TrackingLinkCard
                  key={
                    link.id
                  }
                  link={
                    link
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label: string;

  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>

        <p className="mt-2 text-3xl font-bold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}