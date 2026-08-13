import {
  describe,
  expect,
  it,
} from "vitest";

import {
  attributionFromLandingPath,
  validTrackingUuid,
} from "../../src/features/tracking/attribution";

describe(
  "tracking attribution",
  () => {
    it(
      "extracts UTM attribution",
      () => {
        const result =
          attributionFromLandingPath(
            "/b/demo?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=bio&utm_term=website",
            null,
          );

        expect(
          result,
        ).toEqual({
          source:
            "instagram",

          medium:
            "social",

          campaign:
            "launch",

          content:
            "bio",

          term:
            "website",

          trackingLinkId:
            null,
        });
      },
    );

    it(
      "uses fallback source",
      () => {
        const result =
          attributionFromLandingPath(
            "/b/demo",
            "facebook",
          );

        expect(
          result.source,
        ).toBe(
          "facebook",
        );
      },
    );

    it(
      "defaults to Direct",
      () => {
        const result =
          attributionFromLandingPath(
            "/b/demo",
            null,
          );

        expect(
          result.source,
        ).toBe(
          "Direct",
        );
      },
    );

    it(
      "accepts valid tracking UUID only",
      () => {
        const uuid =
          "11111111-1111-4111-8111-111111111111";

        expect(
          validTrackingUuid(
            uuid,
          ),
        ).toBe(
          uuid,
        );

        expect(
          validTrackingUuid(
            "not-a-uuid",
          ),
        ).toBeNull();
      },
    );
  },
);