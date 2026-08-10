import "server-only";

import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),

  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(
      1,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required",
    )
    .refine(
      (value) => value.startsWith("sb_publishable_"),
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must start with sb_publishable_",
    ),

  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, "SUPABASE_SECRET_KEY is required")
    .refine(
      (value) => value.startsWith("sb_secret_"),
      "SUPABASE_SECRET_KEY must start with sb_secret_",
    ),

  GOOGLE_GENERATIVE_AI_API_KEY: optionalSecret,

  OPENAI_API_KEY: optionalSecret,

  RESEND_API_KEY: optionalSecret,

  EMAIL_FROM: optionalSecret,
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

function formatEnvironmentError(
  error: z.ZodError,
) {
  return error.issues
    .map(
      (issue) =>
        `${issue.path.join(".")}: ${issue.message}`,
    )
    .join("\n");
}

export function getEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL,

    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL,

    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,

    SUPABASE_SECRET_KEY:
      process.env.SUPABASE_SECRET_KEY,

    GOOGLE_GENERATIVE_AI_API_KEY:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,

    OPENAI_API_KEY:
      process.env.OPENAI_API_KEY,

    RESEND_API_KEY:
      process.env.RESEND_API_KEY,

    EMAIL_FROM:
      process.env.EMAIL_FROM,
  });

  if (!result.success) {
    throw new Error(
      `Invalid LeadNexus environment configuration:\n${formatEnvironmentError(
        result.error,
      )}`,
    );
  }

  cachedEnv = result.data;

  return cachedEnv;
}

export function getAppUrl() {
  return getEnv().NEXT_PUBLIC_APP_URL;
}

export function getSupabaseUrl() {
  return getEnv().NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return getEnv()
    .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export function getSupabaseSecretKey() {
  return getEnv().SUPABASE_SECRET_KEY;
}