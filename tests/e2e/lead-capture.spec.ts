import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsAdmin,
} from "./test-helpers";

test(
  "visitor enquiry is captured and becomes visible to admin",
  async ({
    page,
  }) => {
    const unique =
      Date.now();

    const email =
      `playwright.${unique}@example.com`;

    await page.goto(
      "/b/aurora-digital-studio",
    );

    const continueButton =
      page.getByRole(
        "button",
        {
          name:
            "Continue",
        },
      );

    await expect(
      continueButton,
    ).toBeEnabled({
      timeout:
        15_000,
    });

    await page
      .getByLabel(
        "Name",
      )
      .fill(
        "Playwright QA Lead",
      );

    await page
      .getByLabel(
        "Phone",
      )
      .fill(
        "+91 9000012345",
      );

    await page
      .getByLabel(
        "Email",
      )
      .fill(
        email,
      );

    await page
      .getByLabel(
        "Interested in",
      )
      .selectOption({
        label:
          "AI Website Starter",
      });

    const leadResponse =
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              "/api/public/lead",
            ) &&
          response
            .request()
            .method() ===
            "POST",
      );

    await continueButton.click();

    const response =
      await leadResponse;

    expect(
      response.status(),
    ).toBe(
      201,
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Details saved",
        },
      ),
    ).toBeVisible();

    await loginAsAdmin(
      page,
    );

    await page.goto(
      `/admin/leads?q=${encodeURIComponent(
        email,
      )}`,
    );

    const leadRow =
      page
        .getByRole(
          "row",
        )
        .filter({
          hasText:
            "Playwright QA Lead",
        });

    await expect(
      leadRow,
    ).toBeVisible();

    await expect(
      leadRow.getByText(
        "Playwright QA Lead",
        {
          exact:
            true,
        },
      ),
    ).toBeVisible();

    await expect(
      leadRow.getByText(
        "Admin only",
        {
          exact:
            true,
        },
      ),
    ).toBeVisible();
  },
);
