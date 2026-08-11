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

import {
  Textarea,
} from "@/components/ui/textarea";

export function BusinessStep() {
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
          Business profile
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          This information powers your
          LeadNexus public business page.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessName">
            Business name
          </Label>

          <Input
            id="businessName"
            placeholder="Acme Solutions"
            {...register(
              "businessName",
            )}
          />

          {errors.businessName
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .businessName
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            Category
          </Label>

          <Input
            id="category"
            placeholder="Solar Energy"
            {...register(
              "category",
            )}
          />

          {errors.category
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors.category
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">
            Business type
          </Label>

          <Input
            id="businessType"
            placeholder="Service Provider"
            {...register(
              "businessType",
            )}
          />

          {errors
            .businessType
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .businessType
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessDescription">
            Description
          </Label>

          <Textarea
            id="businessDescription"
            rows={5}
            placeholder="Tell customers what your business does and what makes it useful."
            {...register(
              "businessDescription",
            )}
          />

          {errors
            .businessDescription
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .businessDescription
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessEmail">
            Business email
          </Label>

          <Input
            id="businessEmail"
            type="email"
            {...register(
              "businessEmail",
            )}
          />

          {errors
            .businessEmail
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .businessEmail
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessPhone">
            Business phone
          </Label>

          <Input
            id="businessPhone"
            type="tel"
            {...register(
              "businessPhone",
            )}
          />

          {errors
            .businessPhone
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .businessPhone
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">
            WhatsApp number
          </Label>

          <Input
            id="whatsappNumber"
            type="tel"
            placeholder="+91..."
            {...register(
              "whatsappNumber",
            )}
          />

          {errors
            .whatsappNumber
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors
                  .whatsappNumber
                  .message
              }
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">
            Website
          </Label>

          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            {...register(
              "website",
            )}
          />

          {errors.website
            ?.message ? (
            <p className="text-sm text-destructive">
              {
                errors.website
                  .message
              }
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}