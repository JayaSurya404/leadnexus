import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type BusinessMemberRole =
  | "OWNER"
  | "MANAGER";

export type OwnerBusiness = {
  id: string;
  name: string;
  slug: string;
  status:
    | "DRAFT"
    | "ACTIVE"
    | "PAUSED"
    | "ARCHIVED";
  onboardingStep: number;
  onboardingCompletedAt: string | null;
};

export type OwnerContext = {
  userId: string;
  email: string | null;
  role: BusinessMemberRole;
  business: OwnerBusiness;
};

/**
 * Returns the signed-in user's current business context.
 *
 * Returns null when:
 * - user has no business membership
 * - membership points to a missing business
 */
export async function getOwnerContext(): Promise<OwnerContext | null> {
  const user = await requireUser();

  const supabase = await createClient();

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `Failed to load business membership: ${membershipError.message}`,
    );
  }

  if (!membership) {
    return null;
  }

  const {
    data: business,
    error: businessError,
  } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        slug,
        status,
        onboarding_step,
        onboarding_completed_at
      `,
    )
    .eq(
      "id",
      membership.business_id,
    )
    .maybeSingle();

  if (businessError) {
    throw new Error(
      `Failed to load business: ${businessError.message}`,
    );
  }

  if (!business) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,

    role:
      membership.role as BusinessMemberRole,

    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,

      status:
        business.status as OwnerBusiness["status"],

      onboardingStep:
        business.onboarding_step,

      onboardingCompletedAt:
        business.onboarding_completed_at,
    },
  };
}

/**
 * Requires the authenticated user to belong to a LeadNexus
 * business.
 *
 * If the user is authenticated but has not created/joined a
 * business yet, they are sent to onboarding.
 */
export async function requireOwner(): Promise<OwnerContext> {
  const context =
    await getOwnerContext();

  if (!context) {
    redirect("/onboarding");
  }

  return context;
}