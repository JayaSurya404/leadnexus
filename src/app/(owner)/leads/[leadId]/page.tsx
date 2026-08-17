import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  format,
} from "date-fns";

import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
  Target,
} from "lucide-react";

import Link from "next/link";

import {
  LeadActivityTimeline,
} from "@/components/leads/lead-activity-timeline";

import {
  LeadIntelligenceCard,
} from "@/components/leads/lead-intelligence-card";

import {
  LeadNoteForm,
} from "@/components/leads/lead-note-form";

import {
  LeadStatusBadge,
} from "@/components/leads/lead-status-badge";

import {
  LeadStatusForm,
} from "@/components/leads/lead-status-form";

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
  getOwnerLeadDetail,
} from "@/features/leads/owner-lead-data";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "Lead Details | LeadNexus",
};

type LeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

function intentName(
  value:
    | "NONE"
    | "DIRECT_CONTACT"
    | "RECOVERED",
) {
  if (
    value ===
    "DIRECT_CONTACT"
  ) {
    return "Direct contact";
  }

  if (
    value ===
    "RECOVERED"
  ) {
    return "Recovered";
  }

  return "Lead";
}

export default async function LeadDetailPage({
  params,
}: LeadDetailPageProps) {
  const {
    leadId,
  } =
    await params;

  const context =
    await requireOwner();

  const lead =
    await getOwnerLeadDetail(
      context.business.id,
      leadId,
    );

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-3 mb-3"
        >
          <Link href="/leads">
            <ArrowLeft className="size-4" />
            Back to leads
          </Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {
                  lead.name
                }
              </h1>

              <LeadStatusBadge
                status={
                  lead.status
                }
              />

              <Badge variant="outline">
                {intentName(
                  lead.contactIntent,
                )}
              </Badge>
            </div>

            <p className="mt-2 text-muted-foreground">
              Lead details and
              engagement history.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Contact details
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Phone className="size-4" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Phone
                  </p>

                  <a
                    href={`tel:${lead.phone}`}
                    className="mt-1 block font-medium hover:underline"
                  >
                    {
                      lead.phone
                    }
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="size-4" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Email
                  </p>

                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="mt-1 block break-all font-medium hover:underline"
                    >
                      {
                        lead.email
                      }
                    </a>
                  ) : (
                    <p className="mt-1 font-medium">
                      Not provided
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Target className="size-4" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Interest
                  </p>

                  <p className="mt-1 font-medium">
                    {lead.productName ??
                      "General enquiry"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <CalendarDays className="size-4" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Created
                  </p>

                  <p className="mt-1 font-medium">
                    {format(
                      new Date(
                        lead.createdAt,
                      ),
                      "MMM d, yyyy · h:mm a",
                    )}
                  </p>
                </div>
              </div>

              {lead.contactIntent ===
              "DIRECT_CONTACT" ? (
                <div className="sm:col-span-2">
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                    <MessageCircle className="mt-0.5 size-4 shrink-0" />

                    <div>
                      <p className="text-sm font-medium">
                        Direct contact intent
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        This lead became
                        owner-visible after
                        using a direct
                        contact option.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
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
                Activity
              </CardTitle>

              <CardDescription>
                Recorded behaviour for
                this lead.
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

          <Card>
            <CardHeader>
              <CardTitle>
                Notes
              </CardTitle>

              <CardDescription>
                Keep follow-up context
                about this lead.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <LeadNoteForm
                leadId={
                  lead.id
                }
              />

              <div className="border-t pt-5">
                {lead.notes.length ===
                0 ? (
                  <p className="text-sm text-muted-foreground">
                    No notes yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lead.notes.map(
                      (note) => (
                        <div
                          key={
                            note.id
                          }
                          className="rounded-xl border bg-muted/20 p-4"
                        >
                          <p className="whitespace-pre-line text-sm leading-6">
                            {
                              note.text
                            }
                          </p>

                          <p className="mt-3 text-xs text-muted-foreground">
                            {format(
                              new Date(
                                note.createdAt,
                              ),
                              "MMM d, yyyy · h:mm a",
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Lead status
              </CardTitle>

              <CardDescription>
                Keep the lead lifecycle
                updated.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <LeadStatusForm
                leadId={
                  lead.id
                }
                currentStatus={
                  lead.status
                }
                doNotCall={
                  lead.doNotCall
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Lead information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Source type
                </span>

                <span className="text-right font-medium">
                  {intentName(
                    lead.contactIntent,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Interest
                </span>

                <span className="text-right font-medium">
                  {lead.productName ??
                    "General enquiry"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Activity events
                </span>

                <span className="font-medium">
                  {
                    lead.activity.length
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Notes
                </span>

                <span className="font-medium">
                  {
                    lead.notes.length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
