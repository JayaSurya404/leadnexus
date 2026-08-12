import {
  NextRequest,
} from "next/server";

import {
  getOwnerLeads,
} from "@/features/leads/owner-lead-data";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  toCsv,
} from "@/lib/csv";

import type {
  LeadStatus,
} from "@/types/leads";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

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

export async function GET(
  request: NextRequest,
) {
  const context =
    await requireOwner();

  const allLeads =
    await getOwnerLeads(
      context.business.id,
    );

  const query =
    request.nextUrl.searchParams
      .get("q")
      ?.trim()
      .toLowerCase() ??
    "";

  const requestedStatus =
    request.nextUrl.searchParams.get(
      "status",
    );

  const selectedStatus =
    requestedStatus &&
    validStatuses.has(
      requestedStatus as
        LeadStatus,
    )
      ? (requestedStatus as
          LeadStatus)
      : null;

  const leads =
    allLeads.filter(
      (lead) => {
        const matchesSearch =
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
          matchesSearch &&
          matchesStatus
        );
      },
    );

  const rows: unknown[][] = [
    [
      "Lead ID",
      "Name",
      "Phone",
      "Email",
      "Status",
      "Contact Intent",
      "Product / Service",
      "Temperature",
      "Score",
      "Created At",
      "Owner Visible At",
    ],

    ...leads.map(
      (lead) => [
        lead.id,
        lead.name,
        lead.phone,
        lead.email ?? "",
        lead.status,
        lead.contactIntent,
        lead.productName ?? "",
        lead.temperature,
        lead.score ?? "",
        lead.createdAt,
        lead.ownerVisibleAt ??
          "",
      ],
    ),
  ];

  const csv =
    toCsv(rows);

  const date =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

  const safeSlug =
    context.business.slug.replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    );

  return new Response(
    `\uFEFF${csv}`,
    {
      status: 200,

      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",

        "Content-Disposition":
          `attachment; filename="leadnexus-${safeSlug}-leads-${date}.csv"`,

        "Cache-Control":
          "private, no-store",
      },
    },
  );
}