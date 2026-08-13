import {
  expect,
  test,
} from "@playwright/test";

test(
  "public business page exposes real business content",
  async ({
    page,
  }) => {
    await page.goto(
      "/b/aurora-digital-studio",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Grow your business with better digital systems",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Products & services",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "AI Website Starter",
      ).first(),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Lead Automation Setup",
      ).first(),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Business hours",
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Interested?",
        },
      ),
    ).toBeVisible();
  },
);