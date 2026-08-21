import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsOwner,
} from "./authenticated-session";

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
        "Aadhira SunGrid Energy",
      ).first(),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Rakesh Iyer",
      ).first(),
    ).toBeVisible();

    await page.getByRole(
      "link",
      {
        name:
          "Rakesh Iyer",
        exact:
          true,
      },
    ).first().click();

    const note =
      `Playwright follow-up ${Date.now()}`;

    await page.getByLabel(
      "Add note",
    ).fill(note);

    const saveButton = page.getByRole(
      "button",
      {
        name:
          "Add note",
      },
    );

    await saveButton.click();

    await expect(
      page.getByRole(
        "status",
      ),
    ).toHaveText(
      "Note saved.",
    );

    await expect(
      page.getByLabel(
        "Add note",
      ),
    ).toHaveValue("");

    await expect(
      page.getByText(
        note,
      ),
    ).toBeVisible();
  },
);
