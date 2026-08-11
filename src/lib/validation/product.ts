import { z } from "zod";

export const productSchema =
  z.object({
    itemType: z.enum([
      "PRODUCT",
      "SERVICE",
    ]),

    name: z
      .string()
      .trim()
      .min(
        2,
        "Name is required",
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

    active:
      z.boolean(),

    featured:
      z.boolean(),

    sortOrder: z
      .number()
      .int()
      .min(0)
      .max(10000),
  });

export type ProductInput =
  z.infer<
    typeof productSchema
  >;