import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowRight,
  Building2,
  Flame,
  RotateCcw,
  Users,
} from "lucide-react";

import {
  AdminStatCard,
} from "@/components/admin/admin-stat-card";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getAdminBusinesses,
  getAdminLeads,
  getAdminRecoveryQueue,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title:
    "Admin | LeadNexus",
};

export default async function AdminPage() {
  await requireAdmin();

  const [
    businesses,
    leads,
    recovery,
  ] =
    await Promise.all([
      getAdminBusinesses(),
      getAdminLeads(),
      getAdminRecoveryQueue(),
    ]);

  const hotLeads =
    leads.filter(
      (lead) =>
        lead.temperature ===
        "HOT",
    ).length;

  const ownerVisible =
    leads.filter(
      (lead) =>
        lead.visibility ===
        "OWNER_VISIBLE",
    ).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          LeadNexus Platform
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Admin dashboard
        </h1>

        <p className="mt-2 text-muted-foreground">
          Platform-wide business,
          lead intelligence and
          recovery controls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Businesses"
          value={
            businesses.length
          }
          description="Businesses registered on LeadNexus."
          icon={
            <Building2 className="size-5" />
          }
        />

        <AdminStatCard
          label="Total leads"
          value={
            leads.length
          }
          description="All leads across the platform."
          icon={
            <Users className="size-5" />
          }
        />

        <AdminStatCard
          label="Hot leads"
          value={
            hotLeads
          }
          description="High-intent leads detected by LeadNexus."
          icon={
            <Flame className="size-5" />
          }
        />

        <AdminStatCard
          label="Recovery queue"
          value={
            recovery.length
          }
          description="Warm or hot abandoned leads awaiting review."
          icon={
            <RotateCcw className="size-5" />
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Recovery
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">
              {
                recovery.length
              }
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Leads currently waiting
              for an admin recovery
              decision.
            </p>

            <Button
              asChild
              className="mt-5"
            >
              <Link href="/admin/recovery">
                Open recovery queue
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Owner-visible leads
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">
              {ownerVisible}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Leads currently
              accessible to their
              business owners.
            </p>

            <Button
              asChild
              variant="outline"
              className="mt-5"
            >
              <Link href="/admin/leads?visibility=OWNER_VISIBLE">
                View leads
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}