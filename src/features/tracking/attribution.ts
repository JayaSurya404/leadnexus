export type LandingAttribution = {
  source: string;

  medium:
    | string
    | null;

  campaign:
    | string
    | null;

  content:
    | string
    | null;

  term:
    | string
    | null;

  trackingLinkId:
    | string
    | null;
};

function nonBlank(
  value:
    | string
    | null
    | undefined,
) {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : null;
}

export function validTrackingUuid(
  value:
    | string
    | null,
) {
  if (!value) {
    return null;
  }

  const pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return pattern.test(
    value,
  )
    ? value
    : null;
}

export function attributionFromLandingPath(
  landingPath: string,
  fallbackSource:
    | string
    | null
    | undefined,
): LandingAttribution {
  try {
    const url =
      new URL(
        landingPath,
        "https://leadnexus.local",
      );

    return {
      source:
        nonBlank(
          url.searchParams.get(
            "utm_source",
          ),
        ) ??
        nonBlank(
          fallbackSource,
        ) ??
        "Direct",

      medium:
        nonBlank(
          url.searchParams.get(
            "utm_medium",
          ),
        ),

      campaign:
        nonBlank(
          url.searchParams.get(
            "utm_campaign",
          ),
        ),

      content:
        nonBlank(
          url.searchParams.get(
            "utm_content",
          ),
        ),

      term:
        nonBlank(
          url.searchParams.get(
            "utm_term",
          ),
        ),

      trackingLinkId:
        validTrackingUuid(
          url.searchParams.get(
            "ln_tracking",
          ),
        ),
    };
  } catch {
    return {
      source:
        nonBlank(
          fallbackSource,
        ) ??
        "Direct",

      medium:
        null,

      campaign:
        null,

      content:
        null,

      term:
        null,

      trackingLinkId:
        null,
    };
  }
}