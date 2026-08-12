import Link from "next/link";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  ArrowUpRight,
  Flame,
  Snowflake,
  Thermometer,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  LeadTemperature,
  OwnerLeadSummary,
} from "@/types/leads";

type OwnerLeadsTableProps = {
  leads:
    OwnerLeadSummary[];
};

function TemperatureBadge({
  temperature,
  score,
}: {
  temperature:
    LeadTemperature;

  score:
    number | null;
}) {
  if (
    temperature ===
    "HOT"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      >
        <Flame className="size-3" />
        Hot
        {score !== null
          ? ` · ${score}`
          : ""}
      </Badge>
    );
  }

  if (
    temperature ===
    "WARM"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        <Thermometer className="size-3" />
        Warm
        {score !== null
          ? ` · ${score}`
          : ""}
      </Badge>
    );
  }

  if (
    temperature ===
    "COLD"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      >
        <Snowflake className="size-3" />
        Cold
        {score !== null
          ? ` · ${score}`
          : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      Not analysed
    </Badge>
  );
}

function intentLabel(
  intent:
    OwnerLeadSummary["contactIntent"],
) {
  if (
    intent ===
    "DIRECT_CONTACT"
  ) {
    return "Direct contact";
  }

  if (
    intent ===
    "RECOVERED"
  ) {
    return "Recovered";
  }

  return "Lead";
}

export function OwnerLeadsTable({
  leads,
}: OwnerLeadsTableProps) {
  if (
    leads.length === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="font-medium">
          No matching leads
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Owner-visible leads will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
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
              Intelligence
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Added
            </TableHead>

            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {leads.map(
            (lead) => (
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

                  {lead.email ? (
                    <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                      {
                        lead.email
                      }
                    </p>
                  ) : null}
                </TableCell>

                <TableCell>
                  {
                    lead.productName ??
                    "General enquiry"
                  }
                </TableCell>

                <TableCell>
                  <Badge variant="outline">
                    {intentLabel(
                      lead.contactIntent,
                    )}
                  </Badge>
                </TableCell>

                <TableCell>
                  <TemperatureBadge
                    temperature={
                      lead.temperature
                    }
                    score={
                      lead.score
                    }
                  />
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

                <TableCell>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                  >
                    <Link
                      href={`/leads/${lead.id}`}
                      aria-label={`Open ${lead.name}`}
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}