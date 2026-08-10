import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.getClaims();

  if (error) {
    return null;
  }

  const claims = data?.claims;

  if (!claims) {
    return null;
  }

  const userId =
    typeof claims.sub === "string"
      ? claims.sub
      : null;

  if (!userId) {
    return null;
  }

  const email =
    typeof claims.email === "string"
      ? claims.email
      : null;

  return {
    id: userId,
    email,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}