import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isValidVoiceNexusAuthorization,
} from "../../src/features/integrations/voicenexus-auth";

describe(
  "VoiceNexus authorization",
  () => {
    const secret =
      "super-secret-token";

    it(
      "accepts correct bearer token",
      () => {
        expect(
          isValidVoiceNexusAuthorization(
            `Bearer ${secret}`,
            secret,
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects incorrect token",
      () => {
        expect(
          isValidVoiceNexusAuthorization(
            "Bearer wrong-token",
            secret,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects missing authorization",
      () => {
        expect(
          isValidVoiceNexusAuthorization(
            null,
            secret,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects missing server secret",
      () => {
        expect(
          isValidVoiceNexusAuthorization(
            `Bearer ${secret}`,
            undefined,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects non-bearer authentication",
      () => {
        expect(
          isValidVoiceNexusAuthorization(
            `Basic ${secret}`,
            secret,
          ),
        ).toBe(false);
      },
    );
  },
);