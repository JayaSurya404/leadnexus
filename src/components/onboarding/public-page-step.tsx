"use client";

import {
  Controller,
  useFormContext,
} from "react-hook-form";

import type {
  OnboardingInput,
} from "@/lib/validation/onboarding";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Switch,
} from "@/components/ui/switch";

import {
  Textarea,
} from "@/components/ui/textarea";

const switches = [
  {
    name:
      "showProducts",
    label:
      "Show products & services",
  },

  {
    name:
      "showBusinessHours",
    label:
      "Show business hours",
  },

  {
    name:
      "showSocialLinks",
    label:
      "Show social links",
  },

  {
    name:
      "showLocation",
    label:
      "Show location",
  },

  {
    name:
      "showPhone",
    label:
      "Show phone",
  },

  {
    name:
      "showEmail",
    label:
      "Show email",
  },

  {
    name:
      "showWhatsapp",
    label:
      "Show WhatsApp",
  },
] as const;

export function PublicPageStep() {
  const {
    control,
    register,
    formState: {
      errors,
    },
  } =
    useFormContext<OnboardingInput>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          Public business page
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose what customers will see
          when they open your LeadNexus
          link.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicHeadline">
          Headline
        </Label>

        <Input
          id="publicHeadline"
          placeholder="A clear headline for your business"
          {...register(
            "publicHeadline",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicSubheadline">
          Subheadline
        </Label>

        <Input
          id="publicSubheadline"
          {...register(
            "publicSubheadline",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicAbout">
          About
        </Label>

        <Textarea
          id="publicAbout"
          rows={5}
          {...register(
            "publicAbout",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryCtaText">
          Primary CTA
        </Label>

        <Input
          id="primaryCtaText"
          {...register(
            "primaryCtaText",
          )}
        />

        {errors
          .primaryCtaText
          ?.message ? (
          <p className="text-sm text-destructive">
            {
              errors
                .primaryCtaText
                .message
            }
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border">
        {switches.map(
          ({
            name,
            label,
          }) => (
            <div
              key={name}
              className="flex items-center justify-between border-b p-4 last:border-b-0"
            >
              <Label htmlFor={name}>
                {label}
              </Label>

              <Controller
                name={name}
                control={control}
                render={({
                  field,
                }) => (
                  <Switch
                    id={name}
                    checked={
                      field.value
                    }
                    onCheckedChange={
                      field.onChange
                    }
                  />
                )}
              />
            </div>
          ),
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border p-4">
        <div>
          <Label htmlFor="publicPublished">
            Publish page
          </Label>

          <p className="mt-1 text-xs text-muted-foreground">
            Your page can be disabled
            later from Business settings.
          </p>
        </div>

        <Controller
          name="publicPublished"
          control={control}
          render={({
            field,
          }) => (
            <Switch
              id="publicPublished"
              checked={
                field.value
              }
              onCheckedChange={
                field.onChange
              }
            />
          )}
        />
      </div>
    </div>
  );
}