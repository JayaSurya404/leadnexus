import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsAdmin,
} from "./authenticated-session";

test(
  "admin can inspect the recovery queue",
  async ({
    page,
  }) => {
    await loginAsAdmin(
      page,
    );

    await page.goto(
      "/admin/recovery",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Recovery queue",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Recoverable leads",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Hot leads",
      ),
    ).toBeVisible();

    await expect(
      page.locator(
        "body",
      ),
    ).toContainText(
      /Send to business owner|Recovery queue is clear/,
    );
  },
);
