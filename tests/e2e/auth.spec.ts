import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsAdmin,
  loginAsOwner,
} from "./authenticated-session";

test(
  "owner login reaches dashboard",
  async ({
    page,
  }) => {
    await loginAsOwner(
      page,
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

    await expect(
      page.getByText(
        "Aadhira SunGrid Energy",
      ).first(),
    ).toBeVisible();
  },
);

test(
  "owner cannot enter platform admin",
  async ({
    page,
  }) => {
    await loginAsOwner(
      page,
    );

    await page.waitForURL(
      /\/dashboard$/,
    );

    await page.goto(
      "/admin",
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

test(
  "platform admin reaches admin intelligence",
  async ({
    page,
  }) => {
    await loginAsAdmin(
      page,
    );

    await page.waitForURL(
      /\/admin$/,
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Admin dashboard",
        },
      ),
    ).toBeVisible();

    await page.goto(
      "/admin/intelligence",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            /Lead intelligence/i,
        },
      ),
    ).toBeVisible();
  },
);
