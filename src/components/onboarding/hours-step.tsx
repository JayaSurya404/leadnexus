"use client";

import {
  Controller,
  useFormContext,
  useWatch,
} from "react-hook-form";

import type {
  OnboardingInput,
} from "@/lib/validation/onboarding";

import {
  Input,
} from "@/components/ui/input";

import {
  Switch,
} from "@/components/ui/switch";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function HoursStep() {
  const {
    control,
    register,
    formState: {
      errors,
    },
  } =
    useFormContext<OnboardingInput>();

  const hours =
    useWatch({
      control,
      name: "hours",
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          Business hours
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Turn on the days your business
          is available.
        </p>
      </div>

      <div className="divide-y rounded-xl border">
        {dayNames.map(
          (day, index) => {
            const isClosed =
              hours?.[index]
                ?.isClosed ??
              true;

            return (
              <div
                key={day}
                className="grid gap-4 p-4 sm:grid-cols-[150px_100px_1fr_1fr] sm:items-center"
              >
                <div>
                  <p className="font-medium">
                    {day}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {isClosed
                      ? "Closed"
                      : "Open"}
                  </p>
                </div>

                <Controller
                  control={control}
                  name={`hours.${index}.isClosed`}
                  render={({
                    field,
                  }) => (
                    <Switch
                      checked={
                        !field.value
                      }
                      onCheckedChange={(
                        checked,
                      ) => {
                        field.onChange(
                          !checked,
                        );
                      }}
                      aria-label={`Toggle ${day}`}
                    />
                  )}
                />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Opens
                  </p>

                  <Input
                    type="time"
                    disabled={
                      isClosed
                    }
                    {...register(
                      `hours.${index}.opensAt`,
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Closes
                  </p>

                  <Input
                    type="time"
                    disabled={
                      isClosed
                    }
                    {...register(
                      `hours.${index}.closesAt`,
                    )}
                  />
                </div>

                {errors.hours?.[
                  index
                ] ? (
                  <div className="text-sm text-destructive sm:col-start-3 sm:col-span-2">
                    {errors.hours[
                      index
                    ]?.opensAt
                      ?.message ??
                      errors.hours[
                        index
                      ]?.closesAt
                        ?.message}
                  </div>
                ) : null}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}