import Link from "next/link";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  ArrowUpRight,
  Building2,
  Flame,
  Mail,
  MousePointerClick,
  Phone,
  RotateCcw,
  Target,
  Thermometer,
  UserRoundCheck,
} from "lucide-react";

import {
  ignoreRecoveryLeadAction,
} from "@/actions/recovery/ignore-lead";

import {
  sendLeadToOwnerAction,
} from "@/actions/recovery/send-to-owner";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  AdminRecoveryCandidate,
} from "@/types/admin";

type RecoveryCandidateCardProps = {
  lead:
    AdminRecoveryCandidate;
};

export function RecoveryCandidateCard({
  lead,
}: RecoveryCandidateCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                {lead.name}
              </CardTitle>

              <Badge
                variant={
                  lead.temperature ===
                  "HOT"
                    ? "default"
                    : "secondary"
                }
              >
                {lead.temperature ===
                "HOT" ? (
                  <Flame className="size-3" />
                ) : (
                  <Thermometer className="size-3" />
                )}

                {
                  lead.temperature
                }

                {lead.score !==
                null
                  ? ` · ${lead.score}`
                  : ""}
              </Badge>

              <Badge variant="outline">
                Admin only
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-4" />
                {
                  lead.businessName
                }
              </span>

              <span className="flex items-center gap-1.5">
                <Phone className="size-4" />
                {lead.phone}
              </span>

              {lead.email ? (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4" />

                  {
                    lead.email
                  }
                </span>
              ) : null}
            </div>
          </div>

          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link
              href={`/admin/leads/${lead.id}`}
            >
              Inspect
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Info
            icon={
              <Target className="size-4" />
            }
            label="Primary interest"
            value={
              lead.primaryInterest ??
              lead.productName ??
              "General enquiry"
            }
          />

          <Info
            icon={
              <MousePointerClick className="size-4" />
            }
            label="Activity events"
            value={String(
              lead.activityCount,
            )}
          />

          <Info
            icon={
              <RotateCcw className="size-4" />
            }
            label="Last activity"
            value={
              lead.lastActivityAt
                ? formatDistanceToNow(
                    new Date(
                      lead.lastActivityAt,
                    ),
                    {
                      addSuffix:
                        true,
                    },
                  )
                : "Unknown"
            }
          />
        </div>

        {lead.reasons.length >
        0 ? (
          <div>
            <p className="text-sm font-medium">
              Why this lead matters
            </p>

            <ul className="mt-3 space-y-2">
              {lead.reasons.map(
                (
                  reason,
                  index,
                ) => (
                  <li
                    key={`${reason}-${index}`}
                    className="flex gap-2 text-sm leading-6 text-muted-foreground"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                    {reason}
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}

        {lead.recommendedAction ? (
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">
              Recommended action
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {
                lead.recommendedAction
              }
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t pt-5">
          <form
            action={
              sendAction
            }
          >
            <Button type="submit">
              <UserRoundCheck className="size-4" />
              Send to business owner
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
            >
              Ignore
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
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
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}