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

export function LocationStep() {
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
          Business location
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Help visitors understand where
          you operate.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine1">
            Address line 1
          </Label>

          <Input
            id="addressLine1"
            {...register(
              "addressLine1",
            )}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine2">
            Address line 2
          </Label>

          <Input
            id="addressLine2"
            {...register(
              "addressLine2",
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">
            City
          </Label>

          <Input
            id="city"
            {...register(
              "city",
            )}
          />

          {errors.city
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors.city
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">
            State
          </Label>

          <Input
            id="state"
            {...register(
              "state",
            )}
          />

          {errors.state
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors.state
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">
            Postal code
          </Label>

          <Input
            id="postalCode"
            {...register(
              "postalCode",
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">
            Country
          </Label>

          <Input
            id="country"
            {...register(
              "country",
            )}
          />

          {errors.country
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors.country
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="serviceArea">
            Service area
          </Label>

          <Input
            id="serviceArea"
            placeholder="Example: Coimbatore, Tiruppur and nearby areas"
            {...register(
              "serviceArea",
            )}
          />
        </div>
      </div>
    </div>
  );
}