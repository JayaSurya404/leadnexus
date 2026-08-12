import type {
  Metadata,
} from "next";

import {
  Flame,
  RotateCcw,
} from "lucide-react";

import {
  RecoveryCandidateCard,
} from "@/components/admin/recovery-candidate-card";

import {
  getAdminRecoveryQueue,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title:
    "Recovery Queue | LeadNexus Admin",
};

export default async function AdminRecoveryPage() {
  await requireAdmin();

  const leads =
    await getAdminRecoveryQueue();

  const hotLeads =
    leads.filter(
      (lead) =>
        lead.temperature ===
        "HOT",
    ).length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RotateCcw className="size-4" />
          Lead recovery
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Recovery queue
        </h1>

        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review high-intent leads
          that have not directly
          contacted the business.
          Only you decide whether the
          business owner receives
          them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Recoverable leads
          </p>

          <p className="mt-2 text-3xl font-bold">
            {leads.length}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="size-4" />
            Hot leads
          </p>

          <p className="mt-2 text-3xl font-bold">
            {hotLeads}
          </p>
        </div>
      </div>

      {leads.length ===
      0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <RotateCcw className="mx-auto size-10 text-muted-foreground" />

          <p className="mt-4 font-medium">
            Recovery queue is clear
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Warm or hot abandoned
            leads will appear here
            after LeadNexus analyses
            their behaviour.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {leads.map(
            (lead) => (
              <RecoveryCandidateCard
                key={
                  lead.id
                }
                lead={
                  lead
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}