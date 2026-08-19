"use client";

import type {
  UseFormRegisterReturn,
} from "react-hook-form";

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

export function SocialStep() {
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
          Social presence
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Add only the channels your
          business actually uses.
        </p>
      </div>

      <div className="space-y-5">
        <SocialField
          id="instagramUrl"
          label="Instagram"
          badge="IG"
          error={
            errors.instagramUrl
              ?.message
          }
          inputProps={register(
            "instagramUrl",
          )}
        />

        <SocialField
          id="facebookUrl"
          label="Facebook"
          badge="FB"
          error={
            errors.facebookUrl
              ?.message
          }
          inputProps={register(
            "facebookUrl",
          )}
        />

        <SocialField
          id="linkedinUrl"
          label="LinkedIn"
          badge="in"
          error={
            errors.linkedinUrl
              ?.message
          }
          inputProps={register(
            "linkedinUrl",
          )}
        />

        <SocialField
          id="youtubeUrl"
          label="YouTube"
          badge="YT"
          error={
            errors.youtubeUrl
              ?.message
          }
          inputProps={register(
            "youtubeUrl",
          )}
        />

        <SocialField
          id="telegramUrl"
          label="Telegram"
          badge="TG"
          error={
            errors.telegramUrl
              ?.message
          }
          inputProps={register(
            "telegramUrl",
          )}
        />

        <SocialField
          id="xUrl"
          label="X / Twitter"
          badge="X"
          error={
            errors.xUrl
              ?.message
          }
          inputProps={register(
            "xUrl",
          )}
        />
      </div>
    </div>
  );
}

type SocialFieldProps = {
  id: string;
  label: string;
  badge: string;
  error?: string;
  inputProps:
    UseFormRegisterReturn;
};

function SocialField({
  id,
  label,
  badge,
  error,
  inputProps,
}: SocialFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-2"
      >
        <span className="flex size-6 items-center justify-center rounded-md border bg-muted text-[10px] font-bold text-muted-foreground">
          {badge}
        </span>

        {label}
      </Label>

      <Input
        id={id}
        type="url"
        placeholder="https://..."
        {...inputProps}
      />

      {error ? (
        <p className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}