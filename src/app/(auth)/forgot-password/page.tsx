import type { Metadata } from "next";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title:
    "Forgot password | LeadNexus",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            Reset your password
          </CardTitle>

          <CardDescription>
            Enter your account email and
            we&apos;ll send you a secure reset
            link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ForgotPasswordForm />

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}