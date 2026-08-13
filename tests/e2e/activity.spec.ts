import {
  expect,
  test,
} from "@playwright/test";

test(
  "public page creates session and records activity",
  async ({
    page,
  }) => {
    const sessionResponse =
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              "/api/public/session",
            ) &&
          response
            .request()
            .method() ===
            "POST",
      );

    const activityResponse =
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              "/api/public/activity",
            ) &&
          response
            .request()
            .method() ===
            "POST",
      );

    await page.goto(
      "/b/aurora-digital-studio",
    );

    const session =
      await sessionResponse;

    const activity =
      await activityResponse;

    expect(
      session.ok(),
    ).toBe(true);

    expect(
      activity.ok(),
    ).toBe(true);

    const body =
      activity
        .request()
        .postDataJSON();

    expect([
      "PAGE_VIEW",
      "LEAD_FORM_VIEW",
    ]).toContain(
      body.eventType,
    );
  },
);