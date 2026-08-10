"use server";

import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";

type SignupActionState = {
  success: boolean;
  message: string;

  fieldErrors?: {
    fullName?: string[];
    phone?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function signupAction(
  _previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword:
      formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const errors =
      parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Please correct the highlighted fields.",
      fieldErrors: {
        fullName: errors.fullName,
        phone: errors.phone,
        email: errors.email,
        password: errors.password,
        confirmPassword:
          errors.confirmPassword,
      },
    };
  }

  const {
    fullName,
    phone,
    email,
    password,
  } = parsed.data;

  const supabase = await createClient();

  const appUrl = getAppUrl();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          phone,
        },

        emailRedirectTo:
          `${appUrl}/auth/callback?next=/onboarding`,
      },
    });

  if (error) {
    console.error(
      "LeadNexus signup error:",
      error.message,
    );

    return {
      success: false,
      message:
        "We couldn't create your account. Please try again.",
    };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    success: true,
    message:
      "Your account has been created. Check your email and confirm your account to continue.",
  };
}