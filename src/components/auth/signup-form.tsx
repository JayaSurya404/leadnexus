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

import { signupAction } from "@/actions/auth/signup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupState = Awaited<
  ReturnType<typeof signupAction>
>;

const initialState: SignupState = {
  success: false,
  message: "",
};

export function SignupForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    signupAction,
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

        <div className="space-y-2">
          <h2 className="font-semibold">
            Check your email
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            {state.message}
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <Link href="/login">
            Back to sign in
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
        <Label htmlFor="fullName">
          Full name
        </Label>

        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Your full name"
          required
        />

        {state.fieldErrors
          ?.fullName?.[0] ? (
          <p className="text-sm text-destructive">
            {
              state.fieldErrors
                .fullName[0]
            }
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone number
        </Label>

        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          required
        />

        {state.fieldErrors?.phone?.[0] ? (
          <p className="text-sm text-destructive">
            {
              state.fieldErrors
                .phone[0]
            }
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email
        </Label>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        {state.fieldErrors?.email?.[0] ? (
          <p className="text-sm text-destructive">
            {
              state.fieldErrors
                .email[0]
            }
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
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
          Confirm password
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}