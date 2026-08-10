import type { Metadata } from "next";

import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in | LeadNexus",
  description:
    "Sign in to your LeadNexus account.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            Welcome back
          </CardTitle>

          <CardDescription>
            Sign in to manage your
            business, leads and intelligence.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <LoginForm />

          <div className="flex flex-col gap-3 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Forgot your password?
            </Link>

            <p className="text-muted-foreground">
              New to LeadNexus?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}