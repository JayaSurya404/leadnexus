import type {
  Metadata,
} from "next";

import {
  Download,
  Search,
  Users,
} from "lucide-react";

import {
  OwnerLeadsTable,
} from "@/components/leads/owner-leads-table";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  getOwnerLeads,
} from "@/features/leads/owner-lead-data";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import type {
  LeadStatus,
} from "@/types/leads";

export const metadata: Metadata = {
  title:
    "Leads | LeadNexus",
};

type LeadsPageProps = {
  searchParams: Promise<{
    q?: string;

    status?: string;
  }>;
};

const validStatuses =
  new Set<LeadStatus>([
    "NEW",
    "CONTACTED",
    "RESPONDED",
    "QUALIFIED",
    "CUSTOMER",
    "NO_RESPONSE",
    "NOT_INTERESTED",
    "LOST",
  ]);

export default async function LeadsPage({
  searchParams,
}: LeadsPageProps) {
  const context =
    await requireOwner();

  const params =
    await searchParams;

  const allLeads =
    await getOwnerLeads(
      context.business.id,
    );

  const query =
    params.q
      ?.trim()
      .toLowerCase() ??
    "";

  const selectedStatus =
    params.status &&
    validStatuses.has(
      params.status as
        LeadStatus,
    )
      ? (params.status as
          LeadStatus)
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
          lead.phone
            .toLowerCase()
            .includes(
              query,
            ) ||
          (
            lead.email ??
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

        const matchesStatus =
          !selectedStatus ||
          lead.status ===
            selectedStatus;

        return (
          matchesQuery &&
          matchesStatus
        );
      },
    );

  const exportParams =
    new URLSearchParams();

  if (
    params.q?.trim()
  ) {
    exportParams.set(
      "q",
      params.q.trim(),
    );
  }

  if (
    selectedStatus
  ) {
    exportParams.set(
      "status",
      selectedStatus,
    );
  }

  const exportQuery =
    exportParams.toString();

  const exportHref =
    exportQuery
      ? `/api/leads/export?${exportQuery}`
      : "/api/leads/export";

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="size-4" />
            Lead management
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Leads
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage direct-contact and
            recovered leads visible to{" "}
            <span className="font-medium text-foreground">
              {
                context.business
                  .name
              }
            </span>
            .
          </p>
        </div>

        <Button
          asChild
          variant="outline"
        >
          <a
            href={
              exportHref
            }
          >
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <form className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            name="q"
            defaultValue={
              params.q ??
              ""
            }
            placeholder="Search name, phone, email or product..."
            className="pl-9"
          />
        </div>

        <select
          name="status"
          defaultValue={
            selectedStatus ??
            ""
          }
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">
            All statuses
          </option>

          <option value="NEW">
            New
          </option>

          <option value="CONTACTED">
            Contacted
          </option>

          <option value="RESPONDED">
            Responded
          </option>

          <option value="QUALIFIED">
            Qualified
          </option>

          <option value="CUSTOMER">
            Customer
          </option>

          <option value="NO_RESPONSE">
            No response
          </option>

          <option value="NOT_INTERESTED">
            Not interested
          </option>

          <option value="LOST">
            Lost
          </option>
        </select>

        <Button type="submit">
          Filter
        </Button>
      </form>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {leads.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {
              allLeads.length
            }
          </span>{" "}
          leads
        </p>

        <p className="hidden text-xs text-muted-foreground sm:block">
          CSV export follows the
          current filters.
        </p>
      </div>

      <OwnerLeadsTable
        leads={
          leads
        }
      />
    </div>
  );
}