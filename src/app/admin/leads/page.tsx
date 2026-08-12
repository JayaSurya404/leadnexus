import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowUpRight,
  Search,
  Users,
} from "lucide-react";

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

export const metadata: Metadata = {
  title:
    "All Leads | LeadNexus Admin",
};

type AdminLeadsPageProps = {
  searchParams: Promise<{
    q?: string;

    visibility?: string;
  }>;
};

export default async function AdminLeadsPage({
  searchParams,
}: AdminLeadsPageProps) {
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

  const visibility =
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
          lead.phone.includes(
            query,
          ) ||
          (
            lead.email ??
            ""
          )
            .toLowerCase()
            .includes(
              query,
            );

        const matchesVisibility =
          !visibility ||
          lead.visibility ===
            visibility;

        return (
          matchesQuery &&
          matchesVisibility
        );
      },
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Users className="size-4" />
          Platform leads
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          All leads
        </h1>

        <p className="mt-2 text-muted-foreground">
          Complete platform-level
          lead visibility across all
          businesses.
        </p>
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
            placeholder="Search lead or business..."
            className="pl-9"
          />
        </div>

        <select
          name="visibility"
          defaultValue={
            visibility ??
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

      <div className="overflow-x-auto rounded-xl border">
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
                Visibility
              </TableHead>

              <TableHead>
                Intent
              </TableHead>

              <TableHead>
                Intelligence
              </TableHead>

              <TableHead>
                Source
              </TableHead>

              <TableHead />
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
                    {
                      lead.businessName
                    }
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        lead.visibility ===
                        "OWNER_VISIBLE"
                          ? "default"
                          : "outline"
                      }
                    >
                      {lead.visibility ===
                      "OWNER_VISIBLE"
                        ? "Owner visible"
                        : "Admin only"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {
                      lead.contactIntent
                    }
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {
                        lead.temperature
                      }

                      {lead.score !==
                      null
                        ? ` · ${lead.score}`
                        : ""}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {lead.source ??
                      "Direct"}
                  </TableCell>

                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}