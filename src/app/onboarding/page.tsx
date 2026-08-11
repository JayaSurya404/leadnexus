import type {
  Metadata,
} from "next";

import {
  redirect,
} from "next/navigation";

import {
  Sparkles,
} from "lucide-react";

import OnboardingWizard from "@/components/onboarding/onboarding-wizard";

import {
  requireUser,
} from "@/lib/auth/require-user";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "Set up your business | LeadNexus",

  description:
    "Create your LeadNexus business workspace and public lead page.",
};

export default async function OnboardingPage() {
  const user =
    await requireUser();

  const supabase =
    await createClient();

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, platform_role",
    )
    .eq(
      "id",
      user.id,
    )
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to load your LeadNexus profile: ${profileError.message}`,
    );
  }

  if (
    profile?.platform_role ===
    "PLATFORM_ADMIN"
  ) {
    redirect("/admin");
  }

  const {
    data: membership,
    error:
      membershipError,
  } = await supabase
    .from("business_members")
    .select(
      "business_id",
    )
    .eq(
      "user_id",
      user.id,
    )
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `Unable to load business membership: ${membershipError.message}`,
    );
  }

  if (membership) {
    const {
      data: business,
      error:
        businessError,
    } = await supabase
      .from("businesses")
      .select(
        "onboarding_completed_at",
      )
      .eq(
        "id",
        membership.business_id,
      )
      .maybeSingle();

    if (businessError) {
      throw new Error(
        `Unable to load business onboarding status: ${businessError.message}`,
      );
    }

    if (
      business
        ?.onboarding_completed_at
    ) {
      redirect(
        "/dashboard",
      );
    }
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>

          <div>
            <p className="font-semibold">
              LeadNexus
            </p>

            <p className="text-xs text-muted-foreground">
              Business setup
            </p>
          </div>
        </header>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Build your business
            workspace
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Configure your business,
            products, contact options and
            public LeadNexus page.
          </p>
        </div>

        <OnboardingWizard
          initialProfile={{
            fullName:
              profile
                ?.full_name ??
              "",

            phone:
              profile
                ?.phone ??
              "",

            email:
              user.email ??
              "",
          }}
        />
      </div>
    </main>
  );
}