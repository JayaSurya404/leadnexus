import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsAdmin,
} from "./authenticated-session";

test(
  "admin can inspect businesses and platform leads",
  async ({
    page,
  }) => {
    await loginAsAdmin(
      page,
    );

    await page.goto(
      "/admin/businesses",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Businesses",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Aadhira SunGrid Energy",
      ).first(),
    ).toBeVisible();

    await page.goto(
      "/admin/leads",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "All leads",
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
