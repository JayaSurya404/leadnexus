import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Users,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

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
  getAdminBusiness,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title:
    "Business Detail | LeadNexus Admin",
};

type AdminBusinessPageProps = {
  params: Promise<{
    businessId: string;
  }>;
};

export default async function AdminBusinessPage({
  params,
}: AdminBusinessPageProps) {
  await requireAdmin();

  const {
    businessId,
  } =
    await params;

  const result =
    await getAdminBusiness(
      businessId,
    );

  if (!result) {
    notFound();
  }

  const {
    business,
    leads,
  } = result;

  return (
    <div className="space-y-8">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-3 mb-3"
        >
          <Link href="/admin/businesses">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {business.name}
          </h1>

          <Badge variant="outline">
            {
              business.status
            }
          </Badge>
        </div>

        <p className="mt-2 text-muted-foreground">
          Platform-level business
          performance and leads.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric
          label="Total leads"
          value={
            business.totalLeads
          }
        />

        <Metric
          label="Admin only"
          value={
            business.adminOnlyLeads
          }
        />

        <Metric
          label="Owner visible"
          value={
            business.ownerVisibleLeads
          }
        />

        <Metric
          label="Customers"
          value={
            business.customers
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Business details
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info
            label="Slug"
            value={
              business.slug
            }
          />

          <Info
            label="Category"
            value={
              business.category ??
              "—"
            }
          />

          <Info
            label="Email"
            value={
              business.email ??
              "—"
            }
          />

          <Info
            label="Phone"
            value={
              business.phone ??
              "—"
            }
          />

          <Info
            label="Location"
            value={
              business.location ??
              "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Leads
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {leads.length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              No leads yet.
            </p>
          ) : (
            leads.map(
              (lead) => (
                <div
                  key={
                    lead.id
                  }
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {
                          lead.name
                        }
                      </p>

                      <Badge variant="outline">
                        {
                          lead.visibility
                        }
                      </Badge>

                      <Badge variant="secondary">
                        {
                          lead.temperature
                        }

                        {lead.score !==
                        null
                          ? ` · ${lead.score}`
                          : ""}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {
                        lead.phone
                      }
                    </p>
                  </div>

                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                  >
                    <Link
                      href={`/admin/leads/${lead.id}`}
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
  );
}