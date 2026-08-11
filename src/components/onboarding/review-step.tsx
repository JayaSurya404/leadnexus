"use client";

import {
  useFormContext,
} from "react-hook-form";

import type {
  OnboardingInput,
} from "@/lib/validation/onboarding";

export function ReviewStep() {
  const {
    getValues,
  } =
    useFormContext<OnboardingInput>();

  const values =
    getValues();

  const socialCount = [
    values.instagramUrl,
    values.facebookUrl,
    values.linkedinUrl,
    values.youtubeUrl,
    values.xUrl,
  ].filter(
    (value) =>
      value.trim().length > 0,
  ).length;

  const openDays =
    values.hours.filter(
      (hour) =>
        !hour.isClosed,
    ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          Review & finish
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Check the main details before
          LeadNexus creates your business
          workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard
          label="Business"
          value={
            values.businessName ||
            "Not entered"
          }
        />

        <ReviewCard
          label="Category"
          value={
            values.category ||
            "Not entered"
          }
        />

        <ReviewCard
          label="Location"
          value={[
            values.city,
            values.state,
            values.country,
          ]
            .filter(Boolean)
            .join(", ")}
        />

        <ReviewCard
          label="Products / services"
          value={`${values.products.length}`}
        />

        <ReviewCard
          label="Social channels"
          value={`${socialCount}`}
        />

        <ReviewCard
          label="Open days"
          value={`${openDays} / 7`}
        />

        <ReviewCard
          label="Business phone"
          value={
            values.businessPhone
          }
        />

        <ReviewCard
          label="Public page"
          value={
            values.publicPublished
              ? "Publish after onboarding"
              : "Keep unpublished"
          }
        />
      </div>

      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="font-medium">
          What happens next?
        </p>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          LeadNexus will create your
          business workspace, products,
          contact settings and public
          page. You can edit everything
          later from your dashboard.
        </p>
      </div>
    </div>
  );
}

function ReviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 font-medium">
        {value || "Not provided"}
      </p>
    </div>
  );
}