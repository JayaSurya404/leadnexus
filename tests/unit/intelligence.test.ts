import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isRecoveryCandidate,
} from "../../src/features/intelligence/recovery-rules";

describe(
  "recovery intelligence rules",
  () => {
    it(
      "accepts admin-only hot leads",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              null,

            temperature:
              "HOT",

            score:
              75,
          }),
        ).toBe(true);
      },
    );

    it(
      "accepts warm leads",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              "PENDING",

            temperature:
              "WARM",

            score:
              48,
          }),
        ).toBe(true);
      },
    );

    it(
      "accepts score threshold of 40",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              null,

            temperature:
              "COLD",

            score:
              40,
          }),
        ).toBe(true);
      },
    );

    it(
      "rejects scores below 40",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              null,

            temperature:
              "COLD",

            score:
              39,
          }),
        ).toBe(false);
      },
    );

    it(
      "rejects owner-visible leads",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "OWNER_VISIBLE",

            recoveryDecision:
              null,

            temperature:
              "HOT",

            score:
              90,
          }),
        ).toBe(false);
      },
    );

    it(
      "rejects completed recovery decisions",
      () => {
        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              "IGNORED",

            temperature:
              "HOT",

            score:
              90,
          }),
        ).toBe(false);

        expect(
          isRecoveryCandidate({
            visibility:
              "ADMIN_ONLY",

            recoveryDecision:
              "SENT_TO_OWNER",

            temperature:
              "HOT",

            score:
              90,
          }),
        ).toBe(false);
      },
    );
  },
);