"use server";

import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

type ForgotPasswordActionState = {
  success: boolean;
  message: string;

  fieldErrors?: {
    email?: string[];
  };
};

type ResetPasswordActionState = {
  success: boolean;
  message: string;

  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed =
    forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

  if (!parsed.success) {
    const errors =
      parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Please enter a valid email address.",
      fieldErrors: {
        email: errors.email,
      },
    };
  }

  const supabase = await createClient();

  const appUrl = getAppUrl();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo:
          `${appUrl}/auth/callback?next=/reset-password`,
      },
    );

  if (error) {
    console.error(
      "LeadNexus password reset request error:",
      error.message,
    );

    return {
      success: false,
      message:
        "We couldn't send the reset email right now. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed =
    resetPasswordSchema.safeParse({
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
        password: errors.password,
        confirmPassword:
          errors.confirmPassword,
      },
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      success: false,
      message:
        "Your password recovery session has expired. Request a new reset link.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password: parsed.data.password,
    });

  if (error) {
    console.error(
      "LeadNexus password update error:",
      error.message,
    );

    return {
      success: false,
      message:
        "We couldn't update your password. Please request a new reset link and try again.",
    };
  }

  /*
   * Password has changed.
   *
   * Revoke existing refresh sessions so the
   * user signs in again using the new password.
   */
  const { error: signOutError } =
    await supabase.auth.signOut({
      scope: "global",
    });

  if (signOutError) {
    console.error(
      "Post-password-reset signout error:",
      signOutError.message,
    );
  }

  return {
    success: true,
    message:
      "Your password has been updated successfully. You can now sign in with your new password.",
  };
}