import type {
  Metadata,
} from "next";

import {
  RefreshCcw,
} from "lucide-react";

import {
  RecoveredLeadsList,
} from "@/components/leads/recovered-leads-list";

import {
  getOwnerRecoveredLeads,
} from "@/features/leads/owner-lead-data";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "Recovered Leads | LeadNexus",
};

export default async function RecoveredLeadsPage() {
  const context =
    await requireOwner();

  const leads =
    await getOwnerRecoveredLeads(
      context.business.id,
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RefreshCcw className="size-4" />
          Lead recovery
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Recovered leads
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          High-intent leads reviewed
          and released to your business
          through LeadNexus recovery.
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <p className="text-sm text-muted-foreground">
          Total recovered leads
        </p>

        <p className="mt-1 text-3xl font-bold">
          {
            leads.length
          }
        </p>
      </div>

      <RecoveredLeadsList
        leads={leads}
      />
    </div>
  );
}