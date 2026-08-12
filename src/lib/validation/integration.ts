import {
  z,
} from "zod";

export const voiceNexusAcknowledgeSchema =
  z.object({
    eventId:
      z.string().uuid(),

    status:
      z.enum([
        "SENT",
        "FAILED",
      ]),

    error:
      z
        .string()
        .trim()
        .max(1000)
        .nullable()
        .optional(),
  });