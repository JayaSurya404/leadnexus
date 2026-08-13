import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsOwner,
} from "./test-helpers";

test(
  "anonymous onboarding access requires login",
  async ({
    page,
  }) => {
    await page.goto(
      "/onboarding",
    );

    await page.waitForURL(
      /\/login/,
    );

    await expect(
      page.locator(
        'input[name="email"]',
      ),
    ).toBeVisible();
  },
);

test(
  "completed owner cannot re-enter onboarding",
  async ({
    page,
  }) => {
    await loginAsOwner(
      page,
    );

    await page.goto(
      "/onboarding",
    );

    await page.waitForURL(
      /\/dashboard$/,
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Dashboard",
        },
      ),
    ).toBeVisible();
  },
);