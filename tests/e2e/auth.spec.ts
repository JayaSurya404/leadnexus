import {
  expect,
  test,
} from "@playwright/test";

import type {
  Page,
} from "@playwright/test";

function requiredEnv(
  name: string,
) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name} in .env.local. Add your Phase 16 demo credential without sharing it in chat.`,
    );
  }

  return value;
}

const ownerEmail =
  process.env
    .DEMO_OWNER_EMAIL ??
  "leadnexus.demo.owner@example.com";

const adminEmail =
  process.env
    .DEMO_ADMIN_EMAIL ??
  "leadnexus.demo.admin@example.com";

const ownerPassword =
  requiredEnv(
    "DEMO_OWNER_PASSWORD",
  );

const adminPassword =
  requiredEnv(
    "DEMO_ADMIN_PASSWORD",
  );

async function login(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto(
    "/login",
  );

  await page
    .locator(
      'input[name="email"]',
    )
    .fill(
      email,
    );

  await page
    .locator(
      'input[name="password"]',
    )
    .fill(
      password,
    );

  await page
    .getByRole(
      "button",
      {
        name:
          "Sign in",
      },
    )
    .click();
}

test(
  "owner login reaches dashboard",
  async ({
    page,
  }) => {
    await login(
      page,
      ownerEmail,
      ownerPassword,
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
        "Aurora Digital Studio",
      ).first(),
    ).toBeVisible();
  },
);

test(
  "owner cannot enter platform admin",
  async ({
    page,
  }) => {
    await login(
      page,
      ownerEmail,
      ownerPassword,
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
    await login(
      page,
      adminEmail,
      adminPassword,
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