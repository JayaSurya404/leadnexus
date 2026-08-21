import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatLocalDateTime,
} from "../../src/lib/format-local-date-time";

describe(
  "local date-time formatting",
  () => {
    it(
      "converts UTC timestamps through Intl for the requested local zone",
      () => {
        expect(
          formatLocalDateTime(
            "2026-08-21T03:44:00.000Z",
            "en-IN",
            "Asia/Kolkata",
          ),
        ).toContain(
          "9:14 am",
        );
      },
    );

    it(
      "does not silently render invalid timestamps",
      () => {
        expect(
          formatLocalDateTime(
            "not-a-date",
          ),
        ).toBe(
          "Invalid date",
        );
      },
    );
  },
);
