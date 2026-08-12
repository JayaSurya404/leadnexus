import {
  timingSafeEqual,
} from "node:crypto";

export function isValidVoiceNexusAuthorization(
  authorization:
    | string
    | null,
  expectedSecret:
    | string
    | undefined,
) {
  if (
    !expectedSecret ||
    !authorization
  ) {
    return false;
  }

  const prefix =
    "Bearer ";

  if (
    !authorization.startsWith(
      prefix,
    )
  ) {
    return false;
  }

  const token =
    authorization
      .slice(
        prefix.length,
      )
      .trim();

  if (!token) {
    return false;
  }

  const supplied =
    Buffer.from(
      token,
      "utf8",
    );

  const expected =
    Buffer.from(
      expectedSecret,
      "utf8",
    );

  if (
    supplied.length !==
    expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    supplied,
    expected,
  );
}