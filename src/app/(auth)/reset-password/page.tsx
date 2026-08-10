import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCurrentUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title:
    "Set new password | LeadNexus",
};

export default async function ResetPasswordPage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            Create a new password
          </CardTitle>

          <CardDescription>
            Choose a new secure password
            for your LeadNexus account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}