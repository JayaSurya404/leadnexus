import {
  format,
} from "date-fns";

import {
  Activity,
} from "lucide-react";

import type {
  LeadActivityItem,
} from "@/types/leads";

const labels:
  Record<
    string,
    string
  > = {
  SESSION_STARTED:
    "Visitor session started",

  PAGE_VIEW:
    "Viewed business page",

  LEAD_FORM_VIEW:
    "Viewed lead form",

  LEAD_FORM_STARTED:
    "Started entering contact details",

  LEAD_FORM_SUBMITTED:
    "Submitted lead details",

  PRODUCT_VIEW:
    "Viewed a product",

  PRODUCT_ENGAGED:
    "Showed interest in a product",

  CTA_CLICK:
    "Clicked call to action",

  WHATSAPP_CLICK:
    "Clicked WhatsApp",

  INSTAGRAM_CLICK:
    "Clicked Instagram",

  FACEBOOK_CLICK:
    "Clicked Facebook",

  LINKEDIN_CLICK:
    "Clicked LinkedIn",

  PHONE_CLICK:
    "Clicked phone",

  EMAIL_CLICK:
    "Clicked email",

  WEBSITE_CLICK:
    "Clicked website",

  RETURN_VISIT:
    "Returned to the page",

  PAGE_EXIT:
    "Left the page",
};

type LeadActivityTimelineProps = {
  activity:
    LeadActivityItem[];
};

export function LeadActivityTimeline({
  activity,
}: LeadActivityTimelineProps) {
  if (
    activity.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No activity recorded for
        this lead yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activity.map(
        (event) => (
          <div
            key={
              event.id
            }
            className="flex gap-4 py-3"
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Activity className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {labels[
                  event.eventType
                ] ??
                  event.eventType
                    .replaceAll(
                      "_",
                      " ",
                    )
                    .toLowerCase()}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {format(
                  new Date(
                    event.createdAt,
                  ),
                  "MMM d, yyyy · h:mm a",
                )}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}