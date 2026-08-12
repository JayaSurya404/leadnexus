import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";

import {
  BadgeCheck,
  Flame,
  MousePointerClick,
  RefreshCcw,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  DetailedAnalyticsCharts,
} from "@/components/analytics/detailed-analytics-charts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getDetailedAnalytics,
} from "@/features/analytics/detailed-analytics";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "Analytics | LeadNexus",
};

export default async function AnalyticsPage() {
  const context =
    await requireOwner();

  const analytics =
    await getDetailedAnalytics(
      context.business.id,
    );

  const {
    metrics,
  } = analytics;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Business intelligence
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Analytics
        </h1>

        <p className="mt-2 text-muted-foreground">
          Last 30 days of real
          visitor and owner-visible
          lead activity for{" "}
          <span className="font-medium text-foreground">
            {
              context.business
                .name
            }
          </span>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={
            <Users className="size-5" />
          }
          label="Visitors"
          value={
            metrics.visitors
          }
          description="Public page visitors"
        />

        <Metric
          icon={
            <MousePointerClick className="size-5" />
          }
          label="Direct contact"
          value={
            metrics.directContacts
          }
          description="Leads that used a contact action"
        />

        <Metric
          icon={
            <RefreshCcw className="size-5" />
          }
          label="Recovered"
          value={
            metrics.recoveredLeads
          }
          description="Leads released by admin recovery"
        />

        <Metric
          icon={
            <ShoppingCart className="size-5" />
          }
          label="Customers"
          value={
            metrics.customers
          }
          description={`${metrics.conversionRate}% visitor-to-customer conversion`}
        />
      </div>

      <DetailedAnalyticsCharts
        trend={
          analytics.trend
        }
        sources={
          analytics.sources
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Funnel
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FunnelItem
              icon={
                <Users className="size-5" />
              }
              label="Visitors"
              value={
                metrics.visitors
              }
            />

            <FunnelItem
              icon={
                <Flame className="size-5" />
              }
              label="Visible leads"
              value={
                metrics.visibleLeads
              }
            />

            <FunnelItem
              icon={
                <BadgeCheck className="size-5" />
              }
              label="Qualified"
              value={
                metrics.qualifiedLeads
              }
            />

            <FunnelItem
              icon={
                <ShoppingCart className="size-5" />
              }
              label="Customers"
              value={
                metrics.customers
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Product performance
          </CardTitle>
        </CardHeader>

        <CardContent>
          {analytics.products.length ===
          0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No products or services
              available for analytics.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Product /
                      service
                    </TableHead>

                    <TableHead>
                      Views
                    </TableHead>

                    <TableHead>
                      Engagements
                    </TableHead>

                    <TableHead>
                      Visible leads
                    </TableHead>

                    <TableHead>
                      Customers
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {analytics.products.map(
                    (product) => (
                      <TableRow
                        key={
                          product.id
                        }
                      >
                        <TableCell className="font-medium">
                          {
                            product.name
                          }
                        </TableCell>

                        <TableCell>
                          {
                            product.views
                          }
                        </TableCell>

                        <TableCell>
                          {
                            product.engagements
                          }
                        </TableCell>

                        <TableCell>
                          {
                            product.visibleLeads
                          }
                        </TableCell>

                        <TableCell>
                          {
                            product.customers
                          }
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  description,
}: {
  icon:
    ReactNode;

  label: string;

  value:
    string | number;

  description:
    string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        </div>

        <p className="mt-3 text-3xl font-bold">
          {value}
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelItem({
  icon,
  label,
  value,
}: {
  icon:
    ReactNode;

  label: string;

  value: number;
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}