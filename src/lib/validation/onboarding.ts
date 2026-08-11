import { z } from "zod";

const phoneRegex =
  /^\+?[0-9\s\-()]+$/;

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isOptionalUrl(
  value: string,
) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(
      value.trim(),
    );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

const requiredPhoneSchema = z
  .string()
  .trim()
  .min(
    7,
    "Enter a valid phone number",
  )
  .max(
    32,
    "Phone number is too long",
  )
  .regex(
    phoneRegex,
    "Enter a valid phone number",
  );

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(
    32,
    "Phone number is too long",
  )
  .refine(
    (value) =>
      value === "" ||
      phoneRegex.test(value),
    "Enter a valid phone number",
  );

const optionalEmailSchema = z
  .string()
  .trim()
  .max(
    320,
    "Email address is too long",
  )
  .refine(
    (value) =>
      value === "" ||
      emailRegex.test(value),
    "Enter a valid email address",
  );

const optionalUrlSchema = z
  .string()
  .trim()
  .max(
    500,
    "URL is too long",
  )
  .refine(
    isOptionalUrl,
    "Enter a complete URL starting with http:// or https://",
  );

const businessHourSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(6),

    isClosed: z.boolean(),

    opensAt: z.string(),

    closesAt: z.string(),
  })
  .superRefine(
    (value, context) => {
      if (value.isClosed) {
        return;
      }

      const timePattern =
        /^\d{2}:\d{2}$/;

      if (
        !timePattern.test(
          value.opensAt,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["opensAt"],
          message:
            "Opening time is required",
        });
      }

      if (
        !timePattern.test(
          value.closesAt,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["closesAt"],
          message:
            "Closing time is required",
        });
      }

      if (
        value.opensAt &&
        value.closesAt &&
        value.opensAt ===
          value.closesAt
      ) {
        context.addIssue({
          code: "custom",
          path: ["closesAt"],
          message:
            "Opening and closing times cannot be the same",
        });
      }
    },
  );

const productSchema = z.object({
  itemType: z.enum([
    "PRODUCT",
    "SERVICE",
  ]),

  name: z
    .string()
    .trim()
    .min(
      2,
      "Product or service name is required",
    )
    .max(160),

  description: z
    .string()
    .trim()
    .max(3000),

  priceText: z
    .string()
    .trim()
    .max(120),
});

export const onboardingSchema = z
  .object({
    ownerFullName: z
      .string()
      .trim()
      .min(
        2,
        "Enter your full name",
      )
      .max(120),

    ownerPhone:
      requiredPhoneSchema,

    businessName: z
      .string()
      .trim()
      .min(
        2,
        "Business name is required",
      )
      .max(160),

    category: z
      .string()
      .trim()
      .min(
        2,
        "Business category is required",
      )
      .max(120),

    businessType: z
      .string()
      .trim()
      .min(
        2,
        "Business type is required",
      )
      .max(120),

    businessDescription: z
      .string()
      .trim()
      .min(
        10,
        "Add a short description of your business",
      )
      .max(3000),

    businessEmail:
      optionalEmailSchema,

    businessPhone:
      requiredPhoneSchema,

    whatsappNumber:
      optionalPhoneSchema,

    website:
      optionalUrlSchema,

    addressLine1: z
      .string()
      .trim()
      .max(200),

    addressLine2: z
      .string()
      .trim()
      .max(200),

    city: z
      .string()
      .trim()
      .min(
        2,
        "City is required",
      )
      .max(120),

    state: z
      .string()
      .trim()
      .min(
        2,
        "State is required",
      )
      .max(120),

    country: z
      .string()
      .trim()
      .min(
        2,
        "Country is required",
      )
      .max(120),

    postalCode: z
      .string()
      .trim()
      .max(30),

    serviceArea: z
      .string()
      .trim()
      .max(300),

    instagramUrl:
      optionalUrlSchema,

    facebookUrl:
      optionalUrlSchema,

    linkedinUrl:
      optionalUrlSchema,

    youtubeUrl:
      optionalUrlSchema,

    xUrl:
      optionalUrlSchema,

    hours: z
      .array(businessHourSchema)
      .length(
        7,
        "All seven business days are required",
      ),

    products: z
      .array(productSchema)
      .min(
        1,
        "Add at least one product or service",
      )
      .max(
        10,
        "You can add up to 10 products or services during onboarding",
      ),

    whatsappMessage: z
      .string()
      .trim()
      .min(
        5,
        "WhatsApp contact message is required",
      )
      .max(2000),

    emailMessage: z
      .string()
      .trim()
      .max(2000),

    publicHeadline: z
      .string()
      .trim()
      .max(160),

    publicSubheadline: z
      .string()
      .trim()
      .max(240),

    publicAbout: z
      .string()
      .trim()
      .max(3000),

    primaryCtaText: z
      .string()
      .trim()
      .min(
        2,
        "CTA text is required",
      )
      .max(60),

    publicPublished:
      z.boolean(),

    showProducts:
      z.boolean(),

    showBusinessHours:
      z.boolean(),

    showSocialLinks:
      z.boolean(),

    showLocation:
      z.boolean(),

    showPhone:
      z.boolean(),

    showEmail:
      z.boolean(),

    showWhatsapp:
      z.boolean(),
  })
  .superRefine(
    (values, context) => {
      const days = new Set(
        values.hours.map(
          (hour) =>
            hour.dayOfWeek,
        ),
      );

      if (days.size !== 7) {
        context.addIssue({
          code: "custom",
          path: ["hours"],
          message:
            "Each day of the week must appear exactly once",
        });
      }
    },
  );

export type OnboardingInput =
  z.infer<
    typeof onboardingSchema
  >;