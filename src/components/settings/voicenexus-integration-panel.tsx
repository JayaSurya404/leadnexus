import type {
  ReactNode,
} from "react";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  PhoneCall,
  Send,
  ServerCog,
} from "lucide-react";

import {
  queueVoiceNexusLeadAction,
  retryVoiceNexusHandoffAction,
} from "@/actions/integrations/queue-voicenexus-lead";

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

import type {
  VoiceNexusIntegrationStatus,
} from "@/types/integrations";

type VoiceNexusIntegrationPanelProps = {
  data:
    VoiceNexusIntegrationStatus;
};

export function VoiceNexusIntegrationPanel({
  data,
}: VoiceNexusIntegrationPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="size-5" />
                VoiceNexus
              </CardTitle>

              <CardDescription className="mt-2">
                Structured lead-data
                handoff only. Calling
                functionality remains
                inside VoiceNexus.
              </CardDescription>
            </div>

            <Badge
              variant={
                data.connected
                  ? "default"
                  : "outline"
              }
            >
              {data.connected ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <CircleAlert className="size-3" />
              )}

              {data.connectionStatus.replaceAll("_", " ")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Consumer endpoint
            </p>

            <p className="mt-2 break-all font-mono text-sm">
              {
                data.apiEndpoint
              }
            </p>
          </div>

          {!data.configured ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm font-medium">
                Integration secret
                missing
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Add VOICENEXUS_SHARED_SECRET and VOICENEXUS_IMPORT_URL
                to the LeadNexus server
                environment before
                VoiceNexus can consume
                handoff events.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              icon={
                <Clock3 className="size-4" />
              }
              label="Pending"
              value={
                data.pending
              }
            />

            <Metric
              icon={
                <CheckCircle2 className="size-4" />
              }
              label="Sent"
              value={
                data.sent
              }
            />

            <Metric
              icon={
                <CircleAlert className="size-4" />
              }
              label="Failed"
              value={
                data.failed
              }
            />
          </div>

          {data.lastConnectedAt ? (
            <p className="text-sm text-muted-foreground">
              Last successful
              VoiceNexus acknowledgement{" "}
              {formatDistanceToNow(
                new Date(
                  data.lastConnectedAt,
                ),
                {
                  addSuffix:
                    true,
                },
              )}
              .
            </p>
          ) : null}

          {data.lastError ? (
            <div className="rounded-xl border border-destructive/30 p-4 text-sm">
              <span className="font-medium">
                Last integration error:
              </span>{" "}
              {
                data.lastError
              }
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Send lead to VoiceNexus
          </CardTitle>

          <CardDescription>
            Queue only leads already
            visible to this business.
            Admin-only leads are never
            exposed through this
            workflow.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {data.leads.length ===
          0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No owner-visible leads
              are available.
            </div>
          ) : (
            <div className="space-y-3">
              {data.leads.map(
                (lead) => {
                  const retry = lead.handoffStatus === "FAILED" && lead.handoffEventId;
                  const action = retry
                    ? retryVoiceNexusHandoffAction.bind(null, lead.handoffEventId as string)
                    : queueVoiceNexusLeadAction.bind(null, lead.id);
                  const processing = lead.handoffStatus === "PENDING" || lead.handoffStatus === "PROCESSING";
                  const label = retry ? "Retry" : processing ? "Pending" : lead.handoffStatus === "SENT" ? "Send update" : "Send to VoiceNexus";

                  return (
                    <div
                      key={
                        lead.id
                      }
                      className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {
                            lead.name
                          }
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            lead.phone
                          }

                          {lead.productName
                            ? ` · ${lead.productName}`
                            : ""}
                        </p>

                        {lead.doNotCall ? <Badge variant="destructive" className="mt-2">DO NOT CALL</Badge> : null}
                      </div>

                      <form
                        action={
                          action
                        }
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={processing}
                        >
                          <Send className="size-4" />
                          {label}
                        </Button>
                      </form>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerCog className="size-5" />
            Recent handoffs
          </CardTitle>
        </CardHeader>

        <CardContent>
          {data.events.length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              No VoiceNexus handoff
              events yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.events.map(
                (event) => (
                  <div
                    key={
                      event.id
                    }
                    className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {
                          event.leadName
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Created{" "}
                        {formatDistanceToNow(
                          new Date(
                            event.createdAt,
                          ),
                          {
                            addSuffix:
                              true,
                          },
                        )}
                      </p>

                      {event.lastError ? (
                        <p className="mt-2 text-xs text-destructive">
                          {
                            event.lastError
                          }
                        </p>
                      ) : null}

                    </div>

                    <Badge
                      variant={
                        event.status ===
                        "SENT"
                          ? "default"
                          : event.status ===
                              "FAILED"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {
                        event.status
                      }
                    </Badge>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon:
    ReactNode;

  label: string;

  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}
