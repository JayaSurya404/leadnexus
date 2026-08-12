import {
  z,
} from "zod";

export const trackingLinkSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Enter a link name.",
      )
      .max(100),

    source: z
      .string()
      .trim()
      .min(
        1,
        "Enter a source.",
      )
      .max(100),

    medium: z
      .string()
      .trim()
      .max(100),

    campaign: z
      .string()
      .trim()
      .max(120),

    content: z
      .string()
      .trim()
      .max(120),

    term: z
      .string()
      .trim()
      .max(120),

    productId: z
      .union([
        z.string().uuid(),
        z.literal(""),
      ])
      .transform(
        (value) =>
          value || null,
      ),
  });