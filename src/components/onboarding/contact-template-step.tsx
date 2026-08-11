"use client";

import {
  useFormContext,
} from "react-hook-form";

import type {
  OnboardingInput,
} from "@/lib/validation/onboarding";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

export function ContactTemplateStep() {
  const {
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
          Contact messages
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          LeadNexus can prepare these
          messages when a visitor chooses
          a contact channel. The visitor
          still decides whether to send
          the message.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Supported placeholders:{" "}
        <code>
          {"{{business_name}}"}
        </code>{" "}
        and{" "}
        <code>
          {"{{product_name}}"}
        </code>
        .
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsappMessage">
          WhatsApp message
        </Label>

        <Textarea
          id="whatsappMessage"
          rows={6}
          {...register(
            "whatsappMessage",
          )}
        />

        {errors
          .whatsappMessage
          ?.message ? (
          <p className="text-sm text-destructive">
            {
              errors
                .whatsappMessage
                .message
            }
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailMessage">
          Email message
        </Label>

        <Textarea
          id="emailMessage"
          rows={6}
          {...register(
            "emailMessage",
          )}
        />
      </div>
    </div>
  );
}