import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowUpRight,
  BrainCircuit,
  CircleHelp,
  Flame,
  RefreshCw,
  Search,
  Thermometer,
} from "lucide-react";

import {
  intelligenceAnalyzeLead,
} from "@/actions/intelligence/analyze-lead";

import {
  AdminStatCard,
} from "@/components/admin/admin-stat-card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getAdminLeads,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import type {
  LeadTemperature,
} from "@/types/leads";

export const metadata: Metadata = {
  title:
    "Lead Intelligence",
};

type IntelligencePageProps = {
  searchParams: Promise<{
    q?: string;

    temperature?: string;

    visibility?: string;
  }>;
};

const temperatures =
  new Set<LeadTemperature>([
    "HOT",
    "WARM",
    "COLD",
    "UNKNOWN",
  ]);

export default async function AdminIntelligencePage({
  searchParams,
}: IntelligencePageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const allLeads =
    await getAdminLeads();

  const query =
    params.q
      ?.trim()
      .toLowerCase() ??
    "";

  const selectedTemperature =
    params.temperature &&
    temperatures.has(
      params.temperature as
        LeadTemperature,
    )
      ? (params.temperature as
          LeadTemperature)
      : null;

  const selectedVisibility =
    params.visibility ===
      "ADMIN_ONLY" ||
    params.visibility ===
      "OWNER_VISIBLE"
      ? params.visibility
      : null;

  const leads =
    allLeads.filter(
      (lead) => {
        const matchesQuery =
          !query ||
          lead.name
            .toLowerCase()
            .includes(
              query,
            ) ||
          lead.businessName
            .toLowerCase()
            .includes(
              query,
            ) ||
          (
            lead.primaryInterest ??
            ""
          )
            .toLowerCase()
            .includes(
              query,
            ) ||
          (
            lead.productName ??
            ""
          )
            .toLowerCase()
            .includes(
              query,
            );

        const matchesTemperature =
          !selectedTemperature ||
          lead.temperature ===
            selectedTemperature;

        const matchesVisibility =
          !selectedVisibility ||
          lead.visibility ===
            selectedVisibility;

        return (
          matchesQuery &&
          matchesTemperature &&
          matchesVisibility
        );
      },
    );

  const hot =
    allLeads.filter(
      (lead) =>
        lead.temperature ===
        "HOT",
    ).length;

  const warm =
    allLeads.filter(
      (lead) =>
        lead.temperature ===
        "WARM",
    ).length;

  const cold =
    allLeads.filter(
      (lead) =>
        lead.temperature ===
        "COLD",
    ).length;

  const unknown =
    allLeads.filter(
      (lead) =>
        lead.temperature ===
        "UNKNOWN",
    ).length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BrainCircuit className="size-4" />

          Platform intelligence
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Lead intelligence
        </h1>

        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review intent scores,
          temperature, primary
          interests, buying intent and
          recommended actions across
          all LeadNexus businesses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Hot"
          value={hot}
          description="High-intent leads requiring priority attention."
          icon={
            <Flame className="size-5" />
          }
        />

        <AdminStatCard
          label="Warm"
          value={warm}
          description="Interested leads with meaningful engagement."
          icon={
            <Thermometer className="size-5" />
          }
        />

        <AdminStatCard
          label="Cold"
          value={cold}
          description="Low-intent leads currently showing limited engagement."
          icon={
            <Thermometer className="size-5" />
          }
        />

        <AdminStatCard
          label="Unknown"
          value={unknown}
          description="Leads without a completed intelligence classification."
          icon={
            <CircleHelp className="size-5" />
          }
        />
      </div>

      <form className="grid gap-3 rounded-xl border bg-background p-4 lg:grid-cols-[1fr_180px_190px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            name="q"
            defaultValue={
              params.q ??
              ""
            }
            placeholder="Search lead, business or interest..."
            className="pl-9"
          />
        </div>

        <select
          name="temperature"
          defaultValue={
            selectedTemperature ??
            ""
          }
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">
            All temperatures
          </option>

          <option value="HOT">
            Hot
          </option>

          <option value="WARM">
            Warm
          </option>

          <option value="COLD">
            Cold
          </option>

          <option value="UNKNOWN">
            Unknown
          </option>
        </select>

        <select
          name="visibility"
          defaultValue={
            selectedVisibility ??
            ""
          }
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">
            All visibility
          </option>

          <option value="ADMIN_ONLY">
            Admin only
          </option>

          <option value="OWNER_VISIBLE">
            Owner visible
          </option>
        </select>

        <Button type="submit">
          Filter
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {leads.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {allLeads.length}
          </span>{" "}
          platform leads
        </p>
      </div>

      {leads.length ===
      0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <BrainCircuit className="mx-auto size-10 text-muted-foreground" />

          <p className="mt-4 font-medium">
            No matching intelligence
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Intelligence records will
            appear as LeadNexus
            analyzes visitor and lead
            activity.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Lead
                </TableHead>

                <TableHead>
                  Business
                </TableHead>

                <TableHead>
                  Intelligence
                </TableHead>

                <TableHead>
                  Interest
                </TableHead>

                <TableHead>
                  Buying intent
                </TableHead>

                <TableHead>
                  Visibility
                </TableHead>

                <TableHead>
                  Recommended action
                </TableHead>

                <TableHead className="text-right">
                  Actions
                </TableHead>
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
                      <p className="font-medium">
                        {
                          lead.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          lead.phone
                        }
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="font-medium">
                        {
                          lead.businessName
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          lead.businessSlug
                        }
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            lead.temperature ===
                            "HOT"
                              ? "default"
                              : lead.temperature ===
                                  "WARM"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {
                            lead.temperature
                          }
                        </Badge>

                        <span className="text-sm font-semibold">
                          {lead.score ??
                            "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {lead.primaryInterest ??
                        lead.productName ??
                        "General enquiry"}
                    </TableCell>

                    <TableCell>
                      {lead.buyingIntent ??
                        "—"}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {lead.visibility ===
                        "OWNER_VISIBLE"
                          ? "Owner visible"
                          : "Admin only"}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-72">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {lead.recommendedAction ??
                          "No recommendation yet."}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <form
                          action={
                            intelligenceAnalyzeLead
                          }
                        >
                          <input
                            type="hidden"
                            name="leadId"
                            value={
                              lead.id
                            }
                          />

                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            title="Recalculate intelligence"
                          >
                            <RefreshCw className="size-4" />

                            <span className="sr-only">
                              Recalculate intelligence
                            </span>
                          </Button>
                        </form>

                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                        >
                          <Link
                            href={`/admin/leads/${lead.id}`}
                          >
                            <ArrowUpRight className="size-4" />

                            <span className="sr-only">
                              Open lead
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}