"use client";

import Link from "next/link";

import {
  useActionState,
  useState,
} from "react";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { resetPasswordAction } from "@/actions/auth/password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetState = Awaited<
  ReturnType<
    typeof resetPasswordAction
  >
>;

const initialState: ResetState = {
  success: false,
  message: "",
};

export function ResetPasswordForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    resetPasswordAction,
    initialState,
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  if (state.success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-6 text-emerald-600" />
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {state.message}
        </p>

        <Button
          asChild
          className="w-full"
        >
          <Link href="/login">
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="password">
          New password
        </Label>

        <div className="relative">
          <Input
            id="password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            required
            className="pr-11"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (value) => !value,
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {state.fieldErrors
          ?.password?.[0] ? (
          <p className="text-sm text-destructive">
            {
              state.fieldErrors
                .password[0]
            }
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm new password
        </Label>

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={
            showPassword
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
        />

        {state.fieldErrors
          ?.confirmPassword?.[0] ? (
          <p className="text-sm text-destructive">
            {
              state.fieldErrors
                .confirmPassword[0]
            }
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating password...
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}