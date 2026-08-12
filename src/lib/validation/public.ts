import {
  z,
} from "zod";

const uuidSchema =
  z.string().uuid();

const optionalUuidSchema =
  z
    .string()
    .uuid()
    .nullable()
    .optional();

const optionalText =
  z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional();

export const publicSessionSchema =
  z.object({
    businessId:
      uuidSchema,

    existingSessionId:
      optionalUuidSchema,

    anonymousId: z
      .string()
      .trim()
      .min(8)
      .max(100),

    source: z
      .string()
      .trim()
      .max(120)
      .nullable()
      .optional(),

    referrer: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional(),

    landingPath: z
      .string()
      .trim()
      .min(1)
      .max(2000),
  });

export const publicActivitySchema =
  z.object({
    businessId:
      uuidSchema,

    sessionId:
      uuidSchema,

    leadId:
      optionalUuidSchema,

    productId:
      optionalUuidSchema,

    eventType:
      z.enum([
        "SESSION_STARTED",
        "PAGE_VIEW",
        "LEAD_FORM_VIEW",
        "LEAD_FORM_STARTED",
        "LEAD_FORM_SUBMITTED",
        "PRODUCT_VIEW",
        "PRODUCT_ENGAGED",
        "CTA_CLICK",
        "WHATSAPP_CLICK",
        "INSTAGRAM_CLICK",
        "FACEBOOK_CLICK",
        "LINKEDIN_CLICK",
        "PHONE_CLICK",
        "EMAIL_CLICK",
        "WEBSITE_CLICK",
        "RETURN_VISIT",
        "PAGE_EXIT",
      ]),

    pagePath:
      optionalText,
  });

export const publicLeadSchema =
  z.object({
    businessId:
      uuidSchema,

    sessionId:
      uuidSchema,

    productId:
      optionalUuidSchema,

    name: z
      .string()
      .trim()
      .min(
        2,
        "Enter your name",
      )
      .max(120),

    phone: z
      .string()
      .trim()
      .min(
        7,
        "Enter a valid phone number",
      )
      .max(32)
      .regex(
        /^\+?[0-9\s\-()]+$/,
        "Enter a valid phone number",
      ),

    email: z
      .string()
      .trim()
      .max(320)
      .refine(
        (value) =>
          value === "" ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value,
          ),
        "Enter a valid email address",
      ),
  });

export const publicContactSchema =
  z.object({
    businessId:
      uuidSchema,

    sessionId:
      uuidSchema,

    leadId:
      uuidSchema,

    productId:
      optionalUuidSchema,

    channel:
      z.enum([
        "WHATSAPP",
        "EMAIL",
        "PHONE",
        "WEBSITE",
        "INSTAGRAM",
        "FACEBOOK",
        "LINKEDIN",
      ]),
  });