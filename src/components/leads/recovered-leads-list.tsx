import Link from "next/link";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  ArrowRight,
  RefreshCcw,
} from "lucide-react";

import {
  LeadStatusBadge,
} from "@/components/leads/lead-status-badge";

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

import type {
  OwnerLeadSummary,
} from "@/types/leads";

type RecoveredLeadsListProps = {
  leads:
    OwnerLeadSummary[];
};

export function RecoveredLeadsList({
  leads,
}: RecoveredLeadsListProps) {
  if (
    leads.length === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <RefreshCcw className="mx-auto size-10 text-muted-foreground" />

        <p className="mt-4 font-medium">
          No recovered leads yet
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Leads reviewed and released
          to your business by the
          LeadNexus recovery workflow
          will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {leads.map(
        (lead) => (
          <Card
            key={
              lead.id
            }
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">
                      {
                        lead.name
                      }
                    </h2>

                    <Badge variant="outline">
                      Recovered
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {
                      lead.phone
                    }
                  </p>

                  {lead.email ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {
                        lead.email
                      }
                    </p>
                  ) : null}
                </div>

                <LeadStatusBadge
                  status={
                    lead.status
                  }
                />
              </div>

              <div className="mt-5 rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Interest
                </p>

                <p className="mt-1 text-sm font-medium">
                  {lead.productName ??
                    "General enquiry"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Released{" "}
                  {formatDistanceToNow(
                    new Date(
                      lead.ownerVisibleAt ??
                        lead.createdAt,
                    ),
                    {
                      addSuffix:
                        true,
                    },
                  )}
                </p>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                >
                  <Link
                    href={`/leads/${lead.id}`}
                  >
                    Open lead
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}