import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsOwner,
} from "./test-helpers";

test(
  "owner can access visible leads and CSV export",
  async ({
    page,
  }) => {
    await loginAsOwner(
      page,
    );

    await page.goto(
      "/leads",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Leads",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "link",
        {
          name:
            "Export CSV",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Aurora Digital Studio",
      ).first(),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Priya Raman",
      ).first(),
    ).toBeVisible();
  },
);