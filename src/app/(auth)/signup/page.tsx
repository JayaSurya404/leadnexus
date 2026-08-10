import type { Metadata } from "next";

import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create account | LeadNexus",
  description:
    "Create your LeadNexus business owner account.",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            Create your account
          </CardTitle>

          <CardDescription>
            Start building your business
            presence and capturing leads.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <SignupForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}