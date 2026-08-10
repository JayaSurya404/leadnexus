import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Full name must contain at least 2 characters")
  .max(120, "Full name is too long");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.email({
      error: "Enter a valid email address",
    }),
  );

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(32, "Phone number is too long")
  .regex(
    /^\+?[0-9\s\-()]+$/,
    "Enter a valid phone number",
  );

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(128, "Password is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    fullName: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, "Confirm your password"),
  })
  .refine(
    (values) =>
      values.password ===
      values.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, "Confirm your password"),
  })
  .refine(
    (values) =>
      values.password ===
      values.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type LoginInput =
  z.infer<typeof loginSchema>;

export type SignupInput =
  z.infer<typeof signupSchema>;

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;