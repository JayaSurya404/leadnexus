import {
  formatDistanceToNow,
} from "date-fns";

import {
  Eye,
  MousePointerClick,
  Power,
  Users,
} from "lucide-react";

import {
  toggleTrackingLinkAction,
} from "@/actions/links/toggle-tracking-link";

import {
  TrackingLinkTools,
} from "@/components/links/tracking-link-tools";

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
  OwnerTrackingLink,
} from "@/types/tracking-links";

type TrackingLinkCardProps = {
  link:
    OwnerTrackingLink;
};

export function TrackingLinkCard({
  link,
}: TrackingLinkCardProps) {
  const toggleAction =
    toggleTrackingLinkAction.bind(
      null,
      link.id,
      !link.active,
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                {
                  link.name
                }
              </CardTitle>

              <Badge
                variant={
                  link.active
                    ? "default"
                    : "secondary"
                }
              >
                {link.active
                  ? "Active"
                  : "Paused"}
              </Badge>
            </div>

            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {
                link.publicUrl
              }
            </p>
          </div>

          <form
            action={
              toggleAction
            }
          >
            <Button
              type="submit"
              size="sm"
              variant="outline"
            >
              <Power className="size-4" />

              {link.active
                ? "Pause"
                : "Activate"}
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            icon={
              <MousePointerClick className="size-4" />
            }
            label="Clicks"
            value={
              link.clickCount
            }
          />

          <Metric
            icon={
              <Eye className="size-4" />
            }
            label="Visitors"
            value={
              link.visitors
            }
          />

          <Metric
            icon={
              <Users className="size-4" />
            }
            label="Visible leads"
            value={
              link.ownerVisibleLeads
            }
          />
        </div>

        <div className="grid gap-4 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <Info
            label="Source"
            value={
              link.source
            }
          />

          <Info
            label="Medium"
            value={
              link.medium ??
              "—"
            }
          />

          <Info
            label="Campaign"
            value={
              link.campaign ??
              "—"
            }
          />

          <Info
            label="Product"
            value={
              link.productName ??
              "General"
            }
          />
        </div>

        {link.lastClickedAt ? (
          <p className="text-xs text-muted-foreground">
            Last clicked{" "}
            {formatDistanceToNow(
              new Date(
                link.lastClickedAt,
              ),
              {
                addSuffix:
                  true,
              },
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No clicks yet.
          </p>
        )}

        <TrackingLinkTools
          url={
            link.publicUrl
          }
        />
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label: string;

  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
  );
}