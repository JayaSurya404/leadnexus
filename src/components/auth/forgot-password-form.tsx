"use client";

import Link from "next/link";

import { useActionState } from "react";

import {
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { forgotPasswordAction } from "@/actions/auth/password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotState = Awaited<
  ReturnType<
    typeof forgotPasswordAction
  >
>;

const initialState: ForgotState = {
  success: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    forgotPasswordAction,
    initialState,
  );

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

      {state.message ? (
        <p className="text-sm text-destructive">
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
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}