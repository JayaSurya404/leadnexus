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
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  RecoveredLeadItem,
} from "@/types/analytics";

type RecoveredLeadsCardProps = {
  leads:
    RecoveredLeadItem[];
};

export function RecoveredLeadsCard({
  leads,
}: RecoveredLeadsCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="size-4" />
            Recovered leads
          </CardTitle>

          <CardDescription className="mt-1">
            High-intent leads released
            to you by LeadNexus.
          </CardDescription>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
        >
          <Link href="/recovered-leads">
            View all
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed px-5 py-10 text-center">
            <p className="font-medium">
              No recovered leads yet
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              When LeadNexus identifies
              and approves a recoverable
              high-intent lead, it will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(
              (lead) => (
                <Link
                  key={
                    lead.id
                  }
                  href={`/leads/${lead.id}`}
                  className="block rounded-xl border p-4 transition hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {
                          lead.name
                        }
                      </p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {lead.productName ??
                          "General enquiry"}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Recovered{" "}
                        {formatDistanceToNow(
                          new Date(
                            lead.ownerVisibleAt,
                          ),
                          {
                            addSuffix:
                              true,
                          },
                        )}
                      </p>
                    </div>

                    <LeadStatusBadge
                      status={
                        lead.status
                      }
                    />
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}