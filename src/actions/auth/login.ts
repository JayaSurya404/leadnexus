"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

type LoginActionState = {
  success: boolean;
  message: string;

  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const errors =
      parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Please correct the highlighted fields.",
      fieldErrors: {
        email: errors.email,
        password: errors.password,
      },
    };
  }

  const { email, password } =
    parsed.data;

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      message:
        "Invalid email or password.",
    };
  }

  /*
   * PLATFORM ADMIN
   */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Unable to load profile after login:",
      profileError.message,
    );
  }

  if (
    profile?.platform_role ===
    "PLATFORM_ADMIN"
  ) {
    redirect("/admin");
  }

  /*
   * BUSINESS OWNER / MANAGER
   */

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "Unable to load membership after login:",
      membershipError.message,
    );

    await supabase.auth.signOut({
      scope: "local",
    });

    return {
      success: false,
      message:
        "We couldn't load your LeadNexus account. Please try again.",
    };
  }

  if (!membership) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}