import { redirect } from "next/navigation";

import AppHeader from "@/components/layout/app-header";
import { OwnerSidebar } from "@/components/layout/owner-sidebar";

import { requireOwner } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireOwner();

  if (!context.business.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", context.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to load owner profile: ${profileError.message}`,
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <OwnerSidebar
        businessName={context.business.name}
        publicSlug={context.business.slug}
      />

      <div className="lg:pl-64">
        <AppHeader
          businessName={context.business.name}
          businessSlug={context.business.slug}
          fullName={profile?.full_name ?? null}
          email={context.email}
          avatarUrl={profile?.avatar_url ?? null}
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}