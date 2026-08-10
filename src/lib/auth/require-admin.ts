import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type AdminContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  platformRole: "PLATFORM_ADMIN";
};

/**
 * Returns the current user's admin context when the
 * authenticated user is a LeadNexus PLATFORM_ADMIN.
 *
 * Returns null for a normal authenticated user.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const user = await requireUser();

  const supabase = await createClient();

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        avatar_url,
        platform_role
      `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load administrator profile: ${error.message}`,
    );
  }

  if (!profile) {
    throw new Error(
      "Authenticated user does not have a LeadNexus profile.",
    );
  }

  if (
    profile.platform_role !==
    "PLATFORM_ADMIN"
  ) {
    return null;
  }

  return {
    userId: profile.id,
    email: user.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    platformRole: "PLATFORM_ADMIN",
  };
}

/**
 * Protects LeadNexus platform-administration pages and
 * server-side functionality.
 *
 * Authentication:
 *   requireUser()
 *
 * Authorization:
 *   profiles.platform_role === PLATFORM_ADMIN
 *
 * Database access remains protected independently by
 * PostgreSQL RLS.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const admin =
    await getAdminContext();

  if (!admin) {
    redirect("/dashboard");
  }

  return admin;
}