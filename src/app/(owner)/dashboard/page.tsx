import type {
  Metadata,
} from "next";

import {
  CheckCircle2,
  Eye,
  MessageCircle,
  RefreshCcw,
  UserCheck,
  Users,
} from "lucide-react";

import {
  LeadFunnel,
} from "@/components/dashboard/lead-funnel";

import {
  MetricCard,
} from "@/components/dashboard/metric-card";

import {
  RecentLeads,
} from "@/components/dashboard/recent-leads";

import {
  RecoveredLeadsCard,
} from "@/components/dashboard/recovered-leads-card";

import {
  SourceChart,
} from "@/components/dashboard/source-chart";

import {
  VisitorChart,
} from "@/components/dashboard/visitor-chart";

import {
  getOwnerDashboardData,
} from "@/features/analytics/queries";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "Dashboard | LeadNexus",

  description:
    "LeadNexus business owner dashboard.",
};

export default async function DashboardPage() {
  const context =
    await requireOwner();

  const data =
    await getOwnerDashboardData(
      context.business.id,
    );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-muted-foreground">
          Track visitors, visible leads,
          recovery and conversions for{" "}
          <span className="font-medium text-foreground">
            {
              context.business
                .name
            }
          </span>
          .
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Visitors"
          value={
            data.metrics
              .visitors
          }
          description="Visitor sessions recorded on your LeadNexus pages."
          icon={
            <Eye className="size-5" />
          }
        />

        <MetricCard
          label="Visible Leads"
          value={
            data.metrics
              .visibleLeads
          }
          description="Leads currently available to your business."
          icon={
            <Users className="size-5" />
          }
        />

        <MetricCard
          label="Direct Contact"
          value={
            data.metrics
              .directContacts
          }
          description="Leads that showed direct contact intent."
          icon={
            <MessageCircle className="size-5" />
          }
        />

        <MetricCard
          label="Recovered"
          value={
            data.metrics
              .recoveredLeads
          }
          description="High-intent leads recovered and released by LeadNexus."
          icon={
            <RefreshCcw className="size-5" />
          }
        />

        <MetricCard
          label="Qualified"
          value={
            data.metrics
              .qualifiedLeads
          }
          description="Leads currently marked as qualified."
          icon={
            <UserCheck className="size-5" />
          }
        />

        <MetricCard
          label="Customers"
          value={
            data.metrics
              .customers
          }
          description="Leads successfully converted into customers."
          icon={
            <CheckCircle2 className="size-5" />
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <VisitorChart
          data={
            data.visitorTrend
          }
        />

        <LeadFunnel
          data={
            data.funnel
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <RecentLeads
          leads={
            data.recentLeads
          }
        />

        <RecoveredLeadsCard
          leads={
            data.recoveredLeads
          }
        />
      </section>

      <section>
        <SourceChart
          data={
            data.sources
          }
        />
      </section>
    </div>
  );
}