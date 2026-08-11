import Link from "next/link";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  ArrowRight,
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

import {
  Badge,
} from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  RecentLeadItem,
} from "@/types/analytics";

type RecentLeadsProps = {
  leads:
    RecentLeadItem[];
};

function intentLabel(
  intent:
    RecentLeadItem["contactIntent"],
) {
  switch (intent) {
    case "DIRECT_CONTACT":
      return "Direct contact";

    case "RECOVERED":
      return "Recovered";

    default:
      return null;
  }
}

export function RecentLeads({
  leads,
}: RecentLeadsProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>
            Recent leads
          </CardTitle>

          <CardDescription className="mt-1">
            Latest leads visible to your
            business.
          </CardDescription>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
        >
          <Link href="/leads">
            View all
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed px-5 py-12 text-center">
            <p className="font-medium">
              No visible leads yet
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Direct-contact and
              recovered leads will
              appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Lead
                  </TableHead>

                  <TableHead>
                    Interest
                  </TableHead>

                  <TableHead>
                    Intent
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Added
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {leads.map(
                  (lead) => {
                    const intent =
                      intentLabel(
                        lead.contactIntent,
                      );

                    return (
                      <TableRow
                        key={
                          lead.id
                        }
                      >
                        <TableCell>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-medium hover:underline"
                          >
                            {
                              lead.name
                            }
                          </Link>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              lead.phone
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          {
                            lead.productName ??
                            "General enquiry"
                          }
                        </TableCell>

                        <TableCell>
                          {intent ? (
                            <Badge
                              variant="outline"
                            >
                              {
                                intent
                              }
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <LeadStatusBadge
                            status={
                              lead.status
                            }
                          />
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(
                              lead.createdAt,
                            ),
                            {
                              addSuffix:
                                true,
                            },
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}