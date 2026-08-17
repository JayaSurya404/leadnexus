import { z } from "zod";

const strictObject = <Shape extends z.ZodRawShape>(shape: Shape) => z.object(shape).strict();

export const voiceNexusHandoffSchema = strictObject({
  schemaVersion: z.literal("1.0"),
  event: z.literal("LEAD_HANDOFF_REQUESTED"),
  eventId: z.string().uuid(),
  requestedAt: z.string().datetime({ offset: true }),
  business: strictObject({ id: z.string().uuid(), name: z.string().trim().min(1).max(200), slug: z.string().trim().min(1).max(200) }),
  lead: strictObject({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
    email: z.string().email().max(320).nullable(),
    status: z.enum(["NEW", "CONTACTED", "RESPONDED", "QUALIFIED", "CUSTOMER", "NO_RESPONSE", "NOT_INTERESTED", "LOST", "DO_NOT_CALL"]),
    contactIntent: z.enum(["NONE", "DIRECT_CONTACT", "RECOVERED"]),
    doNotCall: z.boolean(),
    createdAt: z.string().datetime({ offset: true })
  }),
  product: strictObject({ id: z.string().uuid(), name: z.string().trim().min(1).max(300) }).nullable(),
  intelligence: strictObject({
    temperature: z.enum(["UNKNOWN", "COLD", "WARM", "HOT"]),
    score: z.number().int().min(0).max(100),
    primaryInterest: z.string().trim().max(1000).nullable(),
    buyingIntent: z.string().trim().max(1000).nullable(),
    reasons: z.array(z.string().trim().min(1).max(500)).max(20),
    recommendedAction: z.string().trim().max(1500).nullable()
  }).nullable()
});

export const voiceNexusImportResponseSchema = strictObject({
  schemaVersion: z.literal("1.0"),
  eventId: z.string().uuid(),
  status: z.literal("IMPORTED"),
  voiceNexusLeadId: z.string().uuid(),
  duplicate: z.boolean(),
  doNotCall: z.boolean()
});

export const voiceNexusAcknowledgeSchema = strictObject({
  schemaVersion: z.literal("1.0"),
  eventId: z.string().uuid(),
  businessId: z.string().uuid(),
  status: z.enum(["SENT", "FAILED"]),
  voiceNexusLeadId: z.string().uuid().nullable().optional(),
  error: z.string().trim().max(1000).nullable().optional()
});

export type VoiceNexusHandoff = z.infer<typeof voiceNexusHandoffSchema>;
export type VoiceNexusImportResponse = z.infer<typeof voiceNexusImportResponseSchema>;
