"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { loginAction } from "@/actions/auth/login";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginState = Awaited<
  ReturnType<typeof loginAction>
>;

const initialState: LoginState = {
  success: false,
  message: "",
};

export function LoginForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    loginAction,
    initialState,
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

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
          aria-invalid={
            Boolean(
              state.fieldErrors?.email,
            )
          }
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
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="pr-11"
            aria-invalid={
              Boolean(
                state.fieldErrors
                  ?.password,
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current,
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
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}