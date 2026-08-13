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
      `Missing ${name} in .env.local.`,
    );
  }

  return value;
}

export const ownerEmail =
  process.env
    .DEMO_OWNER_EMAIL ??
  "leadnexus.demo.owner@example.com";

export const adminEmail =
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

export async function login(
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

export async function loginAsOwner(
  page: Page,
) {
  await login(
    page,
    ownerEmail,
    ownerPassword,
  );

  await page.waitForURL(
    /\/dashboard$/,
  );
}

export async function loginAsAdmin(
  page: Page,
) {
  await login(
    page,
    adminEmail,
    adminPassword,
  );

  await page.waitForURL(
    /\/admin$/,
  );
}