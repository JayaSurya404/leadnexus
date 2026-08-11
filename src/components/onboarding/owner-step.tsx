"use client";

import {
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

export function OwnerStep() {
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
          Your details
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Confirm who owns and manages
          this business.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerFullName">
            Full name
          </Label>

          <Input
            id="ownerFullName"
            autoComplete="name"
            {...register(
              "ownerFullName",
            )}
          />

          {errors
            .ownerFullName
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .ownerFullName
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerPhone">
            Phone number
          </Label>

          <Input
            id="ownerPhone"
            type="tel"
            autoComplete="tel"
            {...register(
              "ownerPhone",
            )}
          />

          {errors
            .ownerPhone
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .ownerPhone
                  .message
              }
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}