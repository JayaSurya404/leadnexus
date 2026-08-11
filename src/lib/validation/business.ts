import { z } from "zod";

const phoneRegex =
  /^\+?[0-9\s\-()]+$/;

function optionalEmail() {
  return z
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
    );
}

function optionalPhone() {
  return z
    .string()
    .trim()
    .max(32)
    .refine(
      (value) =>
        value === "" ||
        phoneRegex.test(value),
      "Enter a valid phone number",
    );
}

function optionalUrl() {
  return z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          const url =
            new URL(value);

          return (
            url.protocol ===
              "http:" ||
            url.protocol ===
              "https:"
          );
        } catch {
          return false;
        }
      },
      "Enter a complete URL starting with http:// or https://",
    );
}

export const businessProfileSchema =
  z.object({
    name: z
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
        "Category is required",
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

    description: z
      .string()
      .trim()
      .min(
        10,
        "Add a short business description",
      )
      .max(3000),

    businessEmail:
      optionalEmail(),

    businessPhone:
      optionalPhone(),

    whatsappNumber:
      optionalPhone(),

    website:
      optionalUrl(),

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
      .max(120),

    state: z
      .string()
      .trim()
      .max(120),

    country: z
      .string()
      .trim()
      .max(120),

    postalCode: z
      .string()
      .trim()
      .max(30),

    serviceArea: z
      .string()
      .trim()
      .max(300),
  });

export const socialLinksSchema =
  z.object({
    instagramUrl:
      optionalUrl(),

    facebookUrl:
      optionalUrl(),

    linkedinUrl:
      optionalUrl(),

    youtubeUrl:
      optionalUrl(),

    xUrl:
      optionalUrl(),
  });

export const publicPageSchema =
  z.object({
    headline: z
      .string()
      .trim()
      .max(160),

    subheadline: z
      .string()
      .trim()
      .max(240),

    about: z
      .string()
      .trim()
      .max(3000),

    primaryCtaText: z
      .string()
      .trim()
      .min(2)
      .max(60),

    published:
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
  });

export const contactTemplatesSchema =
  z.object({
    whatsappMessage: z
      .string()
      .trim()
      .min(
        5,
        "WhatsApp message is required",
      )
      .max(2000),

    emailMessage: z
      .string()
      .trim()
      .max(2000),
  });