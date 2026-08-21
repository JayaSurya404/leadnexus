import {
  expect,
  test,
} from "@playwright/test";

import {
  loginAsAdmin,
} from "./authenticated-session";

test(
  "visitor enquiry is captured and becomes visible to admin",
  async ({
    page,
  }) => {
    const unique =
      Date.now();

    const email =
      `playwright.${unique}@qa.invalid`;

    await page.goto(
      "/b/aadhira-sungrid-energy",
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
    ).toBeDisabled({
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
        "+91 74218 56039",
      );

    await page
      .getByLabel(
        "Email (optional)",
        {
          exact:
            true,
        },
      )
      .fill(email);

    await expect(
      page.getByLabel(
        /Interested in/,
      ),
    ).toHaveValue("");

    await expect(
      continueButton,
    ).toBeEnabled();

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

    await page.goto(
      "/b/aadhira-sungrid-energy",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Contact Business",
        },
      ),
    ).toBeVisible();

    await page.evaluate(() => {
      const opened = window as typeof window & {
        __leadNexusOpenedUrl?: string;
      };
      opened.open = ((url?: string | URL) => {
        opened.__leadNexusOpenedUrl = String(url ?? "");
        return null;
      }) as typeof window.open;
    });

    const contactResponse = page.waitForResponse(
      (candidate) =>
        candidate.url().includes("/api/public/contact") &&
        candidate.request().method() === "POST",
    );

    await page.locator("section").filter({
      has: page.getByRole(
        "heading",
        {
          name:
            "Contact Business",
        },
      ),
    }).getByRole(
      "button",
      {
        name:
          "WhatsApp",
        exact:
          true,
      },
    ).click();

    expect(
      (await contactResponse).ok(),
    ).toBe(true);

    const openedUrl = await page.evaluate(() =>
      (window as typeof window & {
        __leadNexusOpenedUrl?: string;
      }).__leadNexusOpenedUrl ?? "",
    );

    expect(openedUrl).toContain("https://wa.me/");
    expect(openedUrl).toContain("text=");

    await page.goto(
      `/admin/leads?q=${encodeURIComponent(
        email,
      )}`,
    );

    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "Playwright QA Lead" })
        .getByText("Owner visible", { exact: true }),
    ).toBeVisible();
  },
);
