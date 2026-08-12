import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowUpRight,
  Building2,
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
} from "@/components/ui/card";

import {
  getAdminBusinesses,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title:
    "Businesses | LeadNexus Admin",
};

export default async function AdminBusinessesPage() {
  await requireAdmin();

  const businesses =
    await getAdminBusinesses();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Building2 className="size-4" />
          Platform businesses
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Businesses
        </h1>

        <p className="mt-2 text-muted-foreground">
          View businesses and their
          LeadNexus performance.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {businesses.map(
          (business) => (
            <Card
              key={
                business.id
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {
                          business.name
                        }
                      </h2>

                      <Badge variant="outline">
                        {
                          business.status
                        }
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {business.category ??
                        business.businessType ??
                        "Business"}
                    </p>

                    {business.location ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          business.location
                        }
                      </p>
                    ) : null}
                  </div>

                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                  >
                    <Link
                      href={`/admin/businesses/${business.id}`}
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric
                    label="Leads"
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
                    label="Recovered"
                    value={
                      business.recoveredLeads
                    }
                  />

                  <Metric
                    label="Customers"
                    value={
                      business.customers
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
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
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}