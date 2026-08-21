import {
  describe,
  expect,
  it,
} from "vitest";

import {
  publicActivitySchema,
  publicContactSchema,
  publicLeadSchema,
  publicSessionSchema,
} from "../../src/lib/validation/public";

const businessId =
  "11111111-1111-4111-8111-111111111111";

const sessionId =
  "22222222-2222-4222-8222-222222222222";

const leadId =
  "33333333-3333-4333-8333-333333333333";

describe(
  "public validation",
  () => {
    it(
      "accepts valid visitor session input",
      () => {
        const result =
          publicSessionSchema.safeParse({
            businessId,

            anonymousId:
              "visitor-12345678",

            source:
              "instagram",

            landingPath:
              "/b/demo",
          });

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "accepts existing PostgreSQL UUIDs that use a non-RFC variant nibble",
      () => {
        const result =
          publicSessionSchema.safeParse({
            businessId:
              "c3333333-3333-4333-c333-333333333333",
            anonymousId:
              "visitor-velora",
            source:
              "Direct",
            landingPath:
              "/b/velora-ev-mobility",
          });

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "rejects invalid lead phone number",
      () => {
        const result =
          publicLeadSchema.safeParse({
            businessId,
            sessionId,

            productId:
              null,

            name:
              "QA User",

            phone:
              "abc",

            email:
              "",
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejects unknown activity events",
      () => {
        const result =
          publicActivitySchema.safeParse({
            businessId,
            sessionId,

            eventType:
              "UNKNOWN_EVENT",
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejects unsupported contact channels",
      () => {
        const result =
          publicContactSchema.safeParse({
            businessId,
            sessionId,
            leadId,

            channel:
              "TELEGRAM",
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);
