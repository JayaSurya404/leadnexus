import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  RotateCcw,
  Target,
  UserRoundCheck,
} from "lucide-react";

import {
  ignoreRecoveryLeadAction,
} from "@/actions/recovery/ignore-lead";

import {
  sendLeadToOwnerAction,
} from "@/actions/recovery/send-to-owner";

import {
  LeadActivityTimeline,
} from "@/components/leads/lead-activity-timeline";

import {
  LeadIntelligenceCard,
} from "@/components/leads/lead-intelligence-card";

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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getAdminLeadDetail,
} from "@/features/admin/queries";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title:
    "Admin Lead Detail | LeadNexus",
};

type AdminLeadPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

export default async function AdminLeadPage({
  params,
}: AdminLeadPageProps) {
  await requireAdmin();

  const {
    leadId,
  } =
    await params;

  const lead =
    await getAdminLeadDetail(
      leadId,
    );

  if (!lead) {
    notFound();
  }

  const sendAction =
    sendLeadToOwnerAction.bind(
      null,
      lead.id,
    );

  const ignoreAction =
    ignoreRecoveryLeadAction.bind(
      null,
      lead.id,
    );

  const recoverable =
    lead.visibility ===
      "ADMIN_ONLY" &&
    lead.recoveryDecision !==
      "SENT_TO_OWNER";

  return (
    <div className="space-y-8">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-3 mb-3"
        >
          <Link href="/admin/leads">
            <ArrowLeft className="size-4" />
            Back to all leads
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.name}
          </h1>

          <LeadStatusBadge
            status={
              lead.status
            }
          />

          <Badge variant="outline">
            {lead.visibility ===
            "OWNER_VISIBLE"
              ? "Owner visible"
              : "Admin only"}
          </Badge>
        </div>

        <p className="mt-2 text-muted-foreground">
          Platform-level lead
          inspection.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Lead details
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Info
                icon={
                  <Building2 className="size-4" />
                }
                label="Business"
                value={
                  lead.businessName
                }
              />

              <Info
                icon={
                  <Phone className="size-4" />
                }
                label="Phone"
                value={
                  lead.phone
                }
              />

              <Info
                icon={
                  <Mail className="size-4" />
                }
                label="Email"
                value={
                  lead.email ??
                  "Not provided"
                }
              />

              <Info
                icon={
                  <Target className="size-4" />
                }
                label="Interest"
                value={
                  lead.primaryInterest ??
                  lead.productName ??
                  "General enquiry"
                }
              />
            </CardContent>
          </Card>

          <LeadIntelligenceCard
            intelligence={
              lead.intelligence
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>
                Behaviour timeline
              </CardTitle>

              <CardDescription>
                Complete recorded
                activity linked to this
                lead.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <LeadActivityTimeline
                activity={
                  lead.activity
                }
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          {recoverable ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="size-5" />
                  Recovery decision
                </CardTitle>

                <CardDescription>
                  This lead remains
                  hidden from the
                  business owner until
                  you send it.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <form
                  action={
                    sendAction
                  }
                >
                  <Button
                    type="submit"
                    className="w-full"
                  >
                    <UserRoundCheck className="size-4" />
                    Send to owner
                  </Button>
                </form>

                <form
                  action={
                    ignoreAction
                  }
                >
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                  >
                    Ignore recovery
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>
                Platform data
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <Row
                label="Visibility"
                value={
                  lead.visibility
                }
              />

              <Row
                label="Contact intent"
                value={
                  lead.contactIntent
                }
              />

              <Row
                label="Source"
                value={
                  lead.source ??
                  "Direct"
                }
              />

              <Row
                label="Campaign"
                value={
                  lead.campaign ??
                  "—"
                }
              />

              <Row
                label="Recovery"
                value={
                  lead.recoveryDecision ??
                  "Pending"
                }
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label: string;

  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="text-right font-medium">
        {value}
      </span>
    </div>
  );
}